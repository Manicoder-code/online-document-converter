import React from "react";

const SupportedList: React.FC = () => {
  return (
    <section className="card">
      <h2>Supported Conversions</h2>
      <div className="grid">
        <span>DOC → PDF</span>
        <span>DOCX → PDF</span>
        <span>PPT → PDF</span>
        <span>PPTX → PDF</span>
        <span>XLS → PDF</span>
        <span>XLSX → PDF</span>
        <span>JPG/PNG → PDF</span>
        <span>PDF → DOCX</span>
        <span>PDF → PPTX</span>
        <span>PDF → XLSX</span>
        <span>PDF → JPG</span>
        <span>PDF → PNG</span>
      </div>
    </section>
  );
};

export default SupportedList;

