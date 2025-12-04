# backend/converters.py
import os
import subprocess
from pathlib import Path
from typing import Literal
from PIL import Image
from PIL import Image

# Use /app/storage in Docker, or local ./storage for development
STORAGE_DIR = Path(os.environ.get("STORAGE_DIR", "./storage"))
UPLOAD_DIR = STORAGE_DIR / "uploads"
CONVERTED_DIR = STORAGE_DIR / "converted"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
CONVERTED_DIR.mkdir(parents=True, exist_ok=True)

# Which conversions we support and how
ConversionKind = Literal["copy", "libreoffice", "pdf_to_image", "image_convert"]

# NOTE: PDF->DOCX/PPTX/XLSX not supported by headless LibreOffice (no import filters)
CONVERSION_MAP: dict[tuple[str, str], ConversionKind] = {
    # PDF conversions
    ("pdf", "pdf"): "copy",
    ("pdf", "jpg"): "pdf_to_image",
    ("pdf", "jpeg"): "pdf_to_image",
    ("pdf", "png"): "pdf_to_image",
    
    # Office to PDF (works with LibreOffice)
    ("doc", "pdf"): "libreoffice",
    ("docx", "pdf"): "libreoffice",
    ("ppt", "pdf"): "libreoffice",
    ("pptx", "pdf"): "libreoffice",
    ("xls", "pdf"): "libreoffice",
    ("xlsx", "pdf"): "libreoffice",
    
    # Office format conversions (same app)
    ("doc", "docx"): "libreoffice",
    ("docx", "doc"): "libreoffice",
    ("ppt", "pptx"): "libreoffice",
    ("pptx", "ppt"): "libreoffice",
    ("xls", "xlsx"): "libreoffice",
    ("xlsx", "xls"): "libreoffice",
    
    # Image format conversions (using Pillow)
    ("jpg", "png"): "image_convert",
    ("jpeg", "png"): "image_convert",
    ("png", "jpg"): "image_convert",
    ("png", "jpeg"): "image_convert",
    ("jpg", "jpg"): "copy",
    ("jpeg", "jpeg"): "copy",
    ("png", "png"): "copy",
}


def run_libreoffice_convert(input_path: Path, target_ext: str) -> Path:
    """
    Use 'soffice' (LibreOffice) to convert an office document/PDF
    into another office format. This assumes LibreOffice is installed
    in the Docker image.
    """
    # LibreOffice uses output directory + format
    output_dir = CONVERTED_DIR
    cmd = [
        "soffice",
        "--headless",
        "--convert-to",
        target_ext,   # e.g. "docx", "pptx", "xlsx", "pdf"
        "--outdir",
        str(output_dir),
        str(input_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        raise RuntimeError(
            f"LibreOffice conversion failed: {result.stderr.strip()}"
        )

    # LibreOffice keeps the same base name but changes extension
    output_path = output_dir / (input_path.stem + f".{target_ext}")
    if not output_path.exists():
        raise FileNotFoundError(
            f"Expected output file not found: {output_path.name}"
        )
    return output_path


def run_pdf_to_images(input_path: Path, target_ext: str) -> Path:
    """
    Convert first page of PDF to a single JPG/PNG using ImageMagick.
    """
    output_path = CONVERTED_DIR / (input_path.stem + f".{target_ext}")
    # ImageMagick command to convert first page only
    cmd = [
        "convert",
        "-density", "300",  # High quality
        f"{input_path}[0]",  # first page
        "-quality", "95",
        str(output_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(
            f"Image conversion failed: {result.stderr.strip()}"
        )
    if not output_path.exists():
        raise FileNotFoundError(f"Expected image not found: {output_path.name}")
    return output_path


def run_image_convert(input_path: Path, target_ext: str) -> Path:
    """
    Convert between image formats using Pillow (JPG <-> PNG).
    """
    output_path = CONVERTED_DIR / (input_path.stem + f".{target_ext}")
    try:
        with Image.open(input_path) as img:
            # Convert RGBA to RGB for JPEG (JPEG doesn't support transparency)
            if target_ext.lower() in ["jpg", "jpeg"] and img.mode == "RGBA":
                rgb_img = Image.new("RGB", img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[3] if len(img.split()) == 4 else None)
                rgb_img.save(output_path, "JPEG", quality=95)
            else:
                img.save(output_path)
        return output_path
    except Exception as e:
        raise RuntimeError(f"Image conversion failed: {str(e)}")


def run_image_convert(input_path: Path, target_ext: str) -> Path:
    """
    Convert between image formats using Pillow (JPG <-> PNG).
    """
    output_path = CONVERTED_DIR / (input_path.stem + f".{target_ext}")
    try:
        with Image.open(input_path) as img:
            # Convert RGBA to RGB for JPEG
            if target_ext.lower() in ["jpg", "jpeg"] and img.mode == "RGBA":
                rgb_img = Image.new("RGB", img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[3] if len(img.split()) == 4 else None)
                rgb_img.save(output_path, "JPEG", quality=95)
            else:
                img.save(output_path)
        return output_path
    except Exception as e:
        raise RuntimeError(f"Image conversion failed: {str(e)}")


def perform_conversion(
    input_path: Path,
    target_ext: str,
) -> Path:
    """
    Core conversion dispatcher. Figures out which converter to call
    based on (src_ext, target_ext) using CONVERSION_MAP.
    """
    src_ext = input_path.suffix.lower().lstrip(".")  # "pdf"
    target_ext = target_ext.lower().lstrip(".")

    key = (src_ext, target_ext)
    if key not in CONVERSION_MAP:
        raise ValueError(
            f"Conversion from .{src_ext} to .{target_ext} is not supported."
        )

    kind = CONVERSION_MAP[key]

    if kind == "copy":
        # e.g. PDF -> PDF: just copy
        output_path = CONVERTED_DIR / (input_path.stem + f".{target_ext}")
        output_path.write_bytes(input_path.read_bytes())
        return output_path

    if kind == "libreoffice":
        return run_libreoffice_convert(input_path, target_ext)

    if kind == "pdf_to_image":
        return run_pdf_to_images(input_path, target_ext)

    if kind == "image_convert":
        return run_image_convert(input_path, target_ext)

    # Fallback (should never hit)
    raise RuntimeError("Unknown conversion kind encountered.")


