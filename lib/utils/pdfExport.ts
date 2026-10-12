// lib/utils/pdfExport.ts
//
// Thin async facade over the PDF implementation. The heavy libraries
// (jsPDF + jspdf-autotable, ~150 KB) live in ./pdfExport.impl and are loaded
// only the first time an export is actually run — keeping them out of the
// initial bundle of every page that can export (Reports, Certificates, Fees…).
//
// Call sites are unchanged: they call these functions from a click handler and
// don't await the result. Each now returns a Promise and loads the impl on
// first use.

type Impl = typeof import("./pdfExport.impl");

let implPromise: Promise<Impl> | null = null;
function loadImpl(): Promise<Impl> {
  if (!implPromise) implPromise = import("./pdfExport.impl");
  return implPromise;
}

export async function exportAttendanceToPDF(
  ...args: Parameters<Impl["exportAttendanceToPDF"]>
) {
  return (await loadImpl()).exportAttendanceToPDF(...args);
}

export async function exportTablePDF(
  ...args: Parameters<Impl["exportTablePDF"]>
) {
  return (await loadImpl()).exportTablePDF(...args);
}

export async function exportStudentToPDF(
  ...args: Parameters<Impl["exportStudentToPDF"]>
) {
  return (await loadImpl()).exportStudentToPDF(...args);
}

export async function exportClassToPDF(
  ...args: Parameters<Impl["exportClassToPDF"]>
) {
  return (await loadImpl()).exportClassToPDF(...args);
}

export async function exportAcademicToPDF(
  ...args: Parameters<Impl["exportAcademicToPDF"]>
) {
  return (await loadImpl()).exportAcademicToPDF(...args);
}

export async function exportMemorizationToPDF(
  ...args: Parameters<Impl["exportMemorizationToPDF"]>
) {
  return (await loadImpl()).exportMemorizationToPDF(...args);
}

export async function exportCertificateToPDF(
  ...args: Parameters<Impl["exportCertificateToPDF"]>
) {
  return (await loadImpl()).exportCertificateToPDF(...args);
}

export async function exportLowAttendanceToPDF(
  ...args: Parameters<Impl["exportLowAttendanceToPDF"]>
) {
  return (await loadImpl()).exportLowAttendanceToPDF(...args);
}

export async function exportSingleCertificatePDF(
  ...args: Parameters<Impl["exportSingleCertificatePDF"]>
) {
  return (await loadImpl()).exportSingleCertificatePDF(...args);
}
