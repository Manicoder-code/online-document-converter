# Online Document Converter

A simple, fast, and clean web app to convert documents online:

- DOC/DOCX → PDF
- PPT/PPTX → PDF
- XLS/XLSX → PDF
- Images (JPG/PNG) → PDF
- PDF → DOCX/PPTX/XLSX/JPG/PNG

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Python + FastAPI
- **Conversion Engine:** LibreOffice (headless) + Pillow (for image → PDF)

## Features

- Drag & drop file upload
- Choose target format from dropdown
- Progress indicator & friendly error messages
- Download converted file directly
- FAQ and Contact / Feedback section
- Files stored only temporarily and auto-cleaned

## Project Structure

```text
backend/   # FastAPI API + conversion logic
frontend/  # React + TypeScript UI

