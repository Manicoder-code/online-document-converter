# backend/converters.py
import subprocess
from pathlib import Path
from typing import Literal

STORAGE_DIR = Path("/app/storage")
UPLOAD_DIR = STORAGE_DIR / "uploads"
CONVERTED_DIR = STORAGE_DIR / "converted"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
CONVERTED_DIR.mkdir(parents=True, exist_ok=True)

# Which conversions we support and how
ConversionKind = Literal["copy", "libreoffice", "image"]

CONVERSION_MAP: dict[tuple[str, str], ConversionKind] = {
    ("pdf", "pdf"): "copy",
    ("pdf", "docx"): "libreoffice",
    ("pdf", "pptx"): "libreoffice",
    ("pdf", "xlsx"): "libreoffice",
    ("pdf", "jpg"): "image",
    ("pdf", "jpeg"): "image",
    ("pdf", "png"): "image",
    ("doc", "pdf"): "libreoffice",
    ("docx", "pdf"): "libreoffice",
    ("ppt", "pdf"): "libreoffice",
    ("pptx", "pdf"): "libreoffice",
    ("xls", "pdf"): "libreoffice",
    ("xlsx", "pdf"): "libreoffice",
    # add more later as needed
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
    Convert first page of PDF to a single JPG/PNG using ImageMagick 'magick'
    or GraphicsMagick, or pdftoppm. Here we assume ImageMagick.
    """
    output_path = CONVERTED_DIR / (input_path.stem + f".{target_ext}")
    # Example using ImageMagick (page 0 only):
    cmd = [
        "magick",
        str(input_path) + "[0]",  # first page
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

    if kind == "image":
        return run_pdf_to_images(input_path, target_ext)

    # Fallback (should never hit)
    raise RuntimeError("Unknown conversion kind encountered.")

