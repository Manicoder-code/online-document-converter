# backend/main.py
import uuid
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from converters import (
    UPLOAD_DIR,
    CONVERTED_DIR,
    perform_conversion,
)

app = FastAPI(title="Online Document Converter")

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

    if target_format not in {"pdf", "docx", "pptx", "xlsx", "jpg", "png"}:
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


