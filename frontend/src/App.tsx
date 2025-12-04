import React from "react";

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Nav */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/80">
              <span className="text-sm font-bold">OC</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                Online Converter
              </h1>
              <p className="text-xs text-slate-400">
                Convert DOC, PDF, PPT, XLS & more in seconds
              </p>
            </div>
          </div>

          <nav className="hidden gap-6 text-xs text-slate-300 md:flex">
            <button className="hover:text-white">Home</button>
            <button className="hover:text-white">All Tools</button>
            <button className="hover:text-white">Help</button>
          </nav>

          <button className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-emerald-500 hover:bg-emerald-500/10">
            Login / Sign up
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 lg:flex-row">
        {/* Left: Hero text */}
        <section className="flex-1 space-y-5">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Convert{" "}
            <span className="text-emerald-400">any document</span> to the
            format you need.
          </h2>

          <p className="max-w-xl text-sm leading-relaxed text-slate-300">
            Upload your files and instantly convert between DOC, DOCX, PDF,
            PPT, XLS, images and more. No complex settings, no ads spam — just
            fast and reliable conversions.
          </p>

          <div className="flex flex-wrap gap-2 text-[11px] text-slate-200">
            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1">
              ✓ DOC to PDF
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1">
              ✓ PDF to Word
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1">
              ✓ PPT to PDF
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1">
              ✓ Image to PDF
            </span>
          </div>

          {/* Popular conversions */}
          <div className="mt-4 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Popular conversions
            </h3>
            <div className="grid gap-2 text-xs text-slate-200 sm:grid-cols-2 lg:grid-cols-3">
              {[
                "Word → PDF",
                "PDF → Word",
                "Excel → PDF",
                "PowerPoint → PDF",
                "JPG → PDF",
                "PDF → JPG",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2"
                >
                  <span>{item}</span>
                  <span className="text-[10px] text-emerald-400">Convert</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right: Converter Card */}
        <section className="flex-1">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-emerald-900/15">
            <h3 className="mb-1 text-lg font-semibold">Convert your file</h3>
            <p className="mb-4 text-xs text-slate-400">
              Step 1: Upload file · Step 2: Choose output format · Step 3:
              Convert & download.
            </p>

            <form className="space-y-4 text-sm">
              {/* Upload area */}
              <div className="space-y-2">
                <label className="text-xs text-slate-300">
                  1. Upload file <span className="text-red-400">*</span>
                </label>
                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 px-4 py-6 text-center">
                  <p className="text-xs text-slate-300">
                    Drag & drop file here, or
                  </p>
                  <button
                    type="button"
                    className="rounded-xl bg-emerald-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-600"
                  >
                    Browse files
                  </button>
                  <p className="text-[11px] text-slate-500">
                    Supported: .doc, .docx, .pdf, .ppt, .pptx, .xls, .xlsx,
                    .jpg, .png
                  </p>
                </div>
              </div>

              {/* Format selectors */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs text-slate-300">
                    2. From format
                  </label>
                  <select className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-emerald-500">
                    <option>Auto detect</option>
                    <option>DOC</option>
                    <option>DOCX</option>
                    <option>PDF</option>
                    <option>PPT</option>
                    <option>PPTX</option>
                    <option>XLS</option>
                    <option>XLSX</option>
                    <option>JPG</option>
                    <option>PNG</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-slate-300">
                    3. To format
                    <span className="text-red-400"> *</span>
                  </label>
                  <select className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-emerald-500">
                    <option>PDF</option>
                    <option>DOCX</option>
                    <option>DOC</option>
                    <option>PPTX</option>
                    <option>XLSX</option>
                    <option>JPG</option>
                    <option>PNG</option>
                  </select>
                </div>
              </div>

              {/* Email / options (optional) */}
              <div className="space-y-2">
                <label className="text-xs text-slate-300">
                  Email (optional – send link)
                </label>
                <input
                  type="email"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-emerald-500"
                  placeholder="you@example.com"
                />
              </div>

              {/* Convert button + status */}
              <div className="space-y-2">
                <button
                  type="submit"
                  className="mt-1 w-full rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 active:scale-[0.99]"
                >
                  Convert Now
                </button>
                <p className="text-[11px] text-slate-500">
                  Your file is processed securely. We auto-delete conversions
                  after a short time.
                </p>
              </div>
            </form>
          </div>

          {/* Recent conversions / placeholder */}
          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <p className="font-medium">Recent conversions</p>
              <span className="text-[10px] text-slate-500">Demo data</span>
            </div>
            <div className="mt-3 space-y-2">
              {[
                "proposal.docx → proposal.pdf",
                "invoice.pdf → invoice.docx",
                "slides.pptx → slides.pdf",
              ].map((item, i) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2"
                >
                  <span>{item}</span>
                  <span className="text-[10px] text-emerald-400">
                    Completed {i + 1} min ago
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-[11px] text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Online Converter. All rights reserved.</p>
          <div className="flex gap-4">
            <button className="hover:text-slate-300">Privacy</button>
            <button className="hover:text-slate-300">Terms</button>
            <button className="hover:text-slate-300">Contact</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

