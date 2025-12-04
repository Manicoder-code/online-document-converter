# backend/main.py
import uuid
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
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


@app.post("/convert")
async def convert_file(
    file: Annotated[UploadFile, File(..., description="File to convert")],
    target_format: Annotated[str, Form(..., description="Target format, e.g. pdf, docx")],
):
    # 1) Validate target format
    target_format = target_format.lower().strip()

    if target_format not in {"pdf", "docx", "pptx", "xlsx", "jpg", "jpeg", "png"}:
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

    # 5) Build a simple download URL
    download_url = f"/download/{file_id}?ext={output_path.suffix.lstrip('.')}"
    return {
        "status": "success",
        "file_id": file_id,
        "download_url": download_url,
        "message": f"Converted {original_name} to .{target_format} successfully.",
    }


@app.get("/download/{file_id}")
def download_converted_file(file_id: str, ext: str):
    ext = ext.lower().lstrip(".")
    output_path = CONVERTED_DIR / f"{file_id}.{ext}"

    if not output_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Converted file not found. It may have expired or was deleted.",
        )

    # You can set content_type explicitly based on ext if you want
    return FileResponse(
        path=str(output_path),
        filename=output_path.name,
    )


# Optional: custom exception handlers for nicer JSON
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"status": "error", "detail": exc.detail},
    )

