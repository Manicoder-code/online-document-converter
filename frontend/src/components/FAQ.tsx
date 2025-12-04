import React from "react";

const FAQ: React.FC = () => {
  return (
    <section className="card">
      <h2>FAQ</h2>
      <div className="faq-item">
        <h3>Is my file safe?</h3>
        <p>
          Yes. Files are stored temporarily and deleted automatically after a short period
          (around 30 minutes). No permanent copies are kept.
        </p>
      </div>
      <div className="faq-item">
        <h3>What is the maximum file size?</h3>
        <p>Currently, files up to 25 MB are supported.</p>
      </div>
      <div className="faq-item">
        <h3>Which formats are supported?</h3>
        <p>
          You can upload DOC, DOCX, PDF, PPT, PPTX, XLS, XLSX, JPG, JPEG, or PNG and
          convert them to PDF, DOCX, PPTX, XLSX, JPG, or PNG.
        </p>
      </div>
    </section>
  );
};

export default FAQ;

