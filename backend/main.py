# backend/main.py
import uuid
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from converters import (
    UPLOAD_DIR,
    CONVERTED_DIR,
    perform_conversion,
    merge_pdfs,
    split_pdf,
    compress_pdf,
)

# Auth & DB imports
from db import SessionLocal, engine, Base
from models import User
from schemas import UserCreate, UserLogin, UserOut, Token
from crud import get_user_by_email, create_user, authenticate_user
from auth import create_access_token
from sqlalchemy.orm import Session

app = FastAPI(title="Online Document Converter")

# Create tables
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
@app.post("/signup", response_model=UserOut)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = create_user(db, user.email, user.password)
    return new_user

@app.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = authenticate_user(db, user.email, user.password)
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token({"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# 🔐 CORS – adjust origins if you deploy on a domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["https://your-frontend.com"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


def cleanup_files(input_path: Path, output_path: Path):
    """Delete temporary files after conversion."""
    try:
        if input_path.exists():
            input_path.unlink()
        if output_path.exists():
            output_path.unlink()
    except Exception as e:
        # Log error but don't fail the request
        print(f"Cleanup error: {e}")


@app.post("/convert")
async def convert_file(
    background_tasks: BackgroundTasks,
    file: Annotated[UploadFile, File(..., description="File to convert")],
    target_format: Annotated[str, Form(..., description="Target format, e.g. pdf, docx")],
):
    # 1) Validate target format
    target_format = target_format.lower().strip()

    if target_format not in {"pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "jpg", "jpeg", "png"}:
        raise HTTPException(
            status_code=400,
            detail=f"Target format '{target_format}' is not supported.",
        )

    # 2) Validate file type / size (basic example)
    MAX_SIZE_MB = 25
    contents = await file.read()
    if len(contents) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File is too large. Maximum supported size is {MAX_SIZE_MB} MB.",
        )

    original_name = file.filename or "uploaded"
    src_ext = Path(original_name).suffix.lower().lstrip(".")

    if not src_ext:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file must have an extension.",
        )

    # 3) Save upload to disk with a UUID
    file_id = uuid.uuid4().hex
    input_path = UPLOAD_DIR / f"{file_id}.{src_ext}"
    input_path.write_bytes(contents)

    try:
        # 4) Perform conversion based on map
        output_path = perform_conversion(input_path, target_format)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Converted file not found on server. Details: {str(e)}",
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Conversion failed. Details: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Unexpected error during conversion.",
        ) from e

    # 5) Return the converted file directly
    converted_filename = f"{Path(original_name).stem}.{target_format}"
    
    # Schedule cleanup after response is sent
    background_tasks.add_task(cleanup_files, input_path, output_path)
    
    return FileResponse(
        path=str(output_path),
        filename=converted_filename,
        media_type="application/octet-stream",
    )


# Optional: custom exception handlers for nicer JSON
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"status": "error", "detail": exc.detail},
    )


@app.post("/merge")
async def merge_pdf_files(
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(..., description="PDF files to merge"),
):
    """Merge multiple PDF files into one."""
    if len(files) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least 2 PDF files are required for merging.",
        )
    
    # Save uploaded files
    saved_paths = []
    try:
        for file in files:
            if not file.filename or not file.filename.lower().endswith('.pdf'):
                raise HTTPException(
                    status_code=400,
                    detail=f"All files must be PDF format. Invalid file: {file.filename}",
                )
            
            contents = await file.read()
            file_id = uuid.uuid4().hex
            input_path = UPLOAD_DIR / f"{file_id}.pdf"
            input_path.write_bytes(contents)
            saved_paths.append(input_path)
        
        # Merge PDFs
        output_path = merge_pdfs(saved_paths)
        
        # Schedule cleanup
        for path in saved_paths:
            background_tasks.add_task(cleanup_files, path, Path())
        background_tasks.add_task(cleanup_files, Path(), output_path)
        
        return FileResponse(
            path=str(output_path),
            filename="merged.pdf",
            media_type="application/pdf",
        )
    
    except HTTPException:
        # Cleanup on error
        for path in saved_paths:
            if path.exists():
                path.unlink()
        raise
    except Exception as e:
        # Cleanup on error
        for path in saved_paths:
            if path.exists():
                path.unlink()
        raise HTTPException(
            status_code=500,
            detail=f"Merge failed: {str(e)}",
        )


@app.post("/split")
async def split_pdf_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="PDF file to split"),
    page_ranges: str = Form(..., description="Page ranges, e.g., '1-3,5,7-9'"),
):
    """Split a PDF file into multiple PDFs based on page ranges."""
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="File must be a PDF.",
        )
    
    # Save uploaded file
    contents = await file.read()
    file_id = uuid.uuid4().hex
    input_path = UPLOAD_DIR / f"{file_id}.pdf"
    input_path.write_bytes(contents)
    
    try:
        # Split PDF
        output_paths = split_pdf(input_path, page_ranges)
        
        # For simplicity, return the first split file
        # In production, you might want to zip them or return multiple files
        if not output_paths:
            raise HTTPException(
                status_code=400,
                detail="No pages matched the specified ranges.",
            )
        
        first_output = output_paths[0]
        
        # Schedule cleanup
        background_tasks.add_task(cleanup_files, input_path, Path())
        for path in output_paths:
            if path != first_output:
                background_tasks.add_task(cleanup_files, Path(), path)
        background_tasks.add_task(cleanup_files, Path(), first_output)
        
        return FileResponse(
            path=str(first_output),
            filename=first_output.name,
            media_type="application/pdf",
        )
    
    except ValueError as e:
        if input_path.exists():
            input_path.unlink()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        if input_path.exists():
            input_path.unlink()
        raise HTTPException(
            status_code=500,
            detail=f"Split failed: {str(e)}",
        )


@app.post("/compress")
async def compress_pdf_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="PDF file to compress"),
    quality: str = Form("medium", description="Compression quality: low, medium, or high"),
):
    """Compress a PDF file."""
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="File must be a PDF.",
        )
    
    # Save uploaded file
    contents = await file.read()
    file_id = uuid.uuid4().hex
    input_path = UPLOAD_DIR / f"{file_id}.pdf"
    input_path.write_bytes(contents)
    
    try:
        # Compress PDF
        output_path = compress_pdf(input_path, quality)
        
        # Schedule cleanup
        background_tasks.add_task(cleanup_files, input_path, output_path)
        
        return FileResponse(
            path=str(output_path),
            filename=f"compressed_{file.filename}",
            media_type="application/pdf",
        )
    
    except ValueError as e:
        if input_path.exists():
            input_path.unlink()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        if input_path.exists():
            input_path.unlink()
        raise HTTPException(
            status_code=500,
            detail=f"Compression failed: {str(e)}",
        )

