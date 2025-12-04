import React, { useRef } from "react";

type UploadBoxProps = {
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
};

const UploadBox: React.FC<UploadBoxProps> = ({ file, onFileChange, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    onFileChange(selectedFile);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled) return;
    const droppedFile = event.dataTransfer.files?.[0] || null;
    onFileChange(droppedFile);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleChooseFileClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  return (
    <div
      className="upload-box"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <p className="upload-title">Drag &amp; drop your file here</p>
      <p className="upload-or">or</p>
      <button
        type="button"
        className="btn"
        onClick={handleChooseFileClick}
        disabled={disabled}
      >
        Choose File
      </button>
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        onChange={handleFileSelect}
        disabled={disabled}
      />
      {file && (
        <p className="file-info">
          Selected: <strong>{file.name}</strong>
        </p>
      )}
    </div>
  );
};

export default UploadBox;

