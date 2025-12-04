FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV STORAGE_DIR=/app/storage

WORKDIR /app

# System dependencies for LibreOffice, ImageMagick, Ghostscript & fonts
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libreoffice \
        imagemagick \
        ghostscript \
        fonts-dejavu \
        locales \
        poppler-utils \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]



