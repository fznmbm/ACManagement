// lib/utils/pdfExport.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate } from "./helpers";

// PDF styling constants
const COLORS = {
  primary: [34, 197, 94] as [number, number, number], // Green
  secondary: [107, 114, 128] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
  danger: [239, 68, 68] as [number, number, number],
  warning: [249, 115, 22] as [number, number, number],
  light: [243, 244, 246] as [number, number, number],
  purple: [147, 51, 234] as [number, number, number],
  yellow: [234, 179, 8] as [number, number, number],
};

/**
 * Initialize PDF with header
 */
function initializePDF(title: string): jsPDF {
  const doc = new jsPDF();

  // Header with logo/title
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 210, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Attendance & Curriculum System", 105, 20, { align: "center" });

  doc.setFontSize(16);
  doc.setFont("helvetica", "normal");
  doc.text(title, 105, 30, { align: "center" });

  // Reset text color
  doc.setTextColor(0, 0, 0);

  return doc;
}

/**
 * Add footer to PDF
 */
function addFooter(doc: jsPDF, pageNumber: number, totalPages: number) {
  const pageHeight = doc.internal.pageSize.height;

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.secondary);
  doc.text(`Page ${pageNumber} of ${totalPages}`, 105, pageHeight - 10, {
    align: "center",
  });
  doc.text(
    `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
    105,
    pageHeight - 5,
    { align: "center" }
  );
}

/**
 * Export Attendance Report to PDF
 */
export function exportAttendanceToPDF(data: {
  records: any[];
  statistics: any;
  filters?: any;
}) {
  const doc = initializePDF("Attendance Report");

  let yPos = 50;

  // Report Information
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  if (data.filters) {
    doc.text("Report Filters:", 20, yPos);
    yPos += 6;

    if (data.filters.class_name) {
      doc.text(`Class: ${data.filters.class_name}`, 25, yPos);
      yPos += 5;
    }
    if (data.filters.student_name) {
      doc.text(`Student: ${data.filters.student_name}`, 25, yPos);
      yPos += 5;
    }
    if (data.filters.from_date && data.filters.to_date) {
      doc.text(
        `Date Range: ${formatDate(data.filters.from_date)} to ${formatDate(
          data.filters.to_date
        )}`,
        25,
        yPos
      );
      yPos += 5;
    }
    yPos += 5;
  }

  // Statistics Summary
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Summary Statistics", 20, yPos);
  yPos += 8;

  // Statistics boxes
  const stats = [
    {
      label: "Total Records",
      value: data.statistics.total,
      color: COLORS.secondary,
    },
    {
      label: "Present",
      value: `${data.statistics.present} (${data.statistics.presentRate}%)`,
      color: COLORS.success,
    },
    { label: "Absent", value: data.statistics.absent, color: COLORS.danger },
    { label: "Late", value: data.statistics.late, color: COLORS.warning },
  ];

  let xPos = 20;
  stats.forEach((stat, index) => {
    doc.setFillColor(...stat.color);
    doc.rect(xPos, yPos, 42, 20, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(String(stat.value), xPos + 21, yPos + 10, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(stat.label, xPos + 21, yPos + 16, { align: "center" });

    xPos += 45;
  });

  yPos += 30;

  // Attendance Records Table
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Attendance Records", 20, yPos);
  yPos += 5;

  const tableData = data.records.map((record) => [
    formatDate(record.date, "short"),
    record.students
      ? `${record.students.first_name} ${record.students.last_name}`
      : "N/A",
    record.students?.student_number || "N/A",
    record.classes?.name || "N/A",
    record.status,
    record.notes || "-",
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Date", "Student", "Student #", "Class", "Status", "Notes"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 35 },
      2: { cellWidth: 25 },
      3: { cellWidth: 35 },
      4: { cellWidth: 20 },
      5: { cellWidth: 45 },
    },
    didDrawPage: (data) => {
      // Add footer to each page
      const pageCount = doc.getNumberOfPages();
      addFooter(doc, data.pageNumber, pageCount);
    },
  });

  // Save PDF
  doc.save(`attendance-report-${new Date().toISOString().split("T")[0]}.pdf`);
}

/**
 * Export Student Report to PDF
 */
export function exportStudentToPDF(data: {
  student: any;
  attendance: any;
  quranProgress: any[];
  academicProgress: any[];
}) {
  const doc = initializePDF("Student Report");

  let yPos = 50;

  // Student Information
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Student Information", 20, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const studentInfo = [
    ["Name:", `${data.student.first_name} ${data.student.last_name}`],
    ["Student Number:", data.student.student_number],
    ["Class:", data.student.classes?.name || "No class assigned"],
    ["Gender:", data.student.gender],
    [
      "Date of Birth:",
      data.student.date_of_birth
        ? formatDate(data.student.date_of_birth)
        : "N/A",
    ],
    ["Status:", data.student.status],
  ];

  studentInfo.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, 20, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(String(value), 60, yPos);
    yPos += 6;
  });

  yPos += 5;

  // Attendance Summary
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Attendance Summary", 20, yPos);
  yPos += 10;

  // Statistics boxes
  const stats = [
    { label: "Total", value: data.attendance.total, color: COLORS.secondary },
    { label: "Present", value: data.attendance.present, color: COLORS.success },
    { label: "Absent", value: data.attendance.absent, color: COLORS.danger },
    { label: "Late", value: data.attendance.late, color: COLORS.warning },
    { label: "Rate", value: `${data.attendance.rate}%`, color: COLORS.primary },
  ];

  let xPos = 20;
  stats.forEach((stat) => {
    doc.setFillColor(...stat.color);
    doc.rect(xPos, yPos, 35, 18, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(String(stat.value), xPos + 17.5, yPos + 9, { align: "center" });

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(stat.label, xPos + 17.5, yPos + 14, { align: "center" });

    xPos += 37;
  });

  yPos += 25;

  // Recent Attendance Table
  if (data.attendance.recent && data.attendance.recent.length > 0) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Recent Attendance (Last 30 Days)", 20, yPos);
    yPos += 5;

    const attendanceData = data.attendance.recent
      .slice(0, 20)
      .map((record: any) => [
        formatDate(record.date, "short"),
        record.status,
        record.notes || "-",
      ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Date", "Status", "Notes"]],
      body: attendanceData,
      theme: "striped",
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
      },
      styles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 30 },
        2: { cellWidth: 110 },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Quran Progress
  if (data.quranProgress && data.quranProgress.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Quran Progress", 20, yPos);
    yPos += 5;

    const quranData = data.quranProgress.map((progress: any) => [
      progress.surah_name,
      `${progress.verses_memorized}/${progress.verses_total}`,
      progress.progress_type,
      progress.proficiency_level || "N/A",
      progress.teacher_notes || "-",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Surah", "Verses", "Type", "Level", "Notes"]],
      body: quranData,
      theme: "striped",
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
      },
      styles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 25 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 75 },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Academic Progress
  if (data.academicProgress && data.academicProgress.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Academic Progress", 20, yPos);
    yPos += 5;

    const academicData = data.academicProgress.map((progress: any) => [
      progress.assessment_date
        ? formatDate(progress.assessment_date, "short")
        : "N/A",
      progress.subjects?.name || "N/A",
      progress.assessment_type || "N/A",
      progress.score && progress.max_score
        ? `${progress.score}/${progress.max_score}`
        : "N/A",
      progress.grade || "N/A",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Date", "Subject", "Assessment", "Score", "Grade"]],
      body: academicData,
      theme: "striped",
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
      },
      styles: {
        fontSize: 9,
      },
    });
  }

  // Add footer to all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(doc, i, pageCount);
  }

  // Save PDF
  doc.save(
    `student-report-${data.student.student_number}-${
      new Date().toISOString().split("T")[0]
    }.pdf`
  );
}

/**
 * Export Class Report to PDF
 */
export function exportClassToPDF(data: {
  classInfo: any;
  students: any[];
  statistics: any;
}) {
  const doc = initializePDF("Class Report");

  let yPos = 50;

  // Class Information
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Class Information", 20, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const classInfo = [
    ["Class Name:", data.classInfo.name],
    ["Level:", data.classInfo.level || "N/A"],
    ["Teacher:", data.classInfo.profiles?.full_name || "No teacher assigned"],
    ["Academic Year:", data.classInfo.academic_year || "N/A"],
    ["Total Students:", String(data.statistics.totalStudents)],
  ];

  classInfo.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, 20, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(String(value), 65, yPos);
    yPos += 6;
  });

  yPos += 5;

  // Overall Statistics
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Overall Class Statistics", 20, yPos);
  yPos += 8;

  const stats = [
    {
      label: "Total Records",
      value: data.statistics.totalRecords,
      color: COLORS.secondary,
    },
    {
      label: "Present",
      value: data.statistics.totalPresent,
      color: COLORS.success,
    },
    {
      label: "Absent",
      value: data.statistics.totalAbsent,
      color: COLORS.danger,
    },
    { label: "Late", value: data.statistics.totalLate, color: COLORS.warning },
    {
      label: "Class Rate",
      value: `${data.statistics.classRate}%`,
      color: COLORS.primary,
    },
  ];

  let xPos = 20;
  stats.forEach((stat) => {
    doc.setFillColor(...stat.color);
    doc.rect(xPos, yPos, 35, 18, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(String(stat.value), xPos + 17.5, yPos + 9, { align: "center" });

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(stat.label, xPos + 17.5, yPos + 14, { align: "center" });

    xPos += 37;
  });

  yPos += 25;

  // Student Details Table
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Student Attendance Details", 20, yPos);
  yPos += 5;

  const studentData = data.students.map((student) => [
    student.student_number,
    `${student.first_name} ${student.last_name}`,
    String(student.attendance.total),
    String(student.attendance.present),
    String(student.attendance.absent),
    String(student.attendance.late),
    `${student.attendance.rate}%`,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Student #", "Name", "Total", "Present", "Absent", "Late", "Rate"]],
    body: studentData,
    theme: "striped",
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 50 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { cellWidth: 20 },
      6: { cellWidth: 25 },
    },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      addFooter(doc, data.pageNumber, pageCount);
    },
  });

  // Save PDF
  doc.save(
    `class-report-${data.classInfo.name.replace(/\s+/g, "-")}-${
      new Date().toISOString().split("T")[0]
    }.pdf`
  );
}

/**
 * Export Academic Report to PDF
 */
export function exportAcademicToPDF(data: {
  records: any[];
  statistics: { total: number; average: string; students: number };
  filters?: {
    student_name?: string;
    class_name?: string;
    date_from?: string;
    date_to?: string;
  };
}) {
  const doc = initializePDF("Academic Progress Report");

  let yPos = 50;

  // Report Filters
  if (data.filters) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Report Filters:", 20, yPos);
    yPos += 6;

    if (data.filters.student_name) {
      doc.text(`Student: ${data.filters.student_name}`, 25, yPos);
      yPos += 5;
    }
    if (data.filters.class_name) {
      doc.text(`Class: ${data.filters.class_name}`, 25, yPos);
      yPos += 5;
    }
    if (data.filters.date_from && data.filters.date_to) {
      doc.text(
        `Date Range: ${formatDate(data.filters.date_from)} to ${formatDate(
          data.filters.date_to
        )}`,
        25,
        yPos
      );
      yPos += 5;
    }
    yPos += 5;
  }

  // Summary Statistics
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Summary Statistics", 20, yPos);
  yPos += 8;

  const stats = [
    {
      label: "Total Assessments",
      value: data.statistics.total,
      color: COLORS.secondary,
    },
    {
      label: "Average Score",
      value: `${data.statistics.average}%`,
      color: COLORS.primary,
    },
    {
      label: "Students",
      value: data.statistics.students,
      color: COLORS.success,
    },
  ];

  let xPos = 20;
  stats.forEach((stat) => {
    doc.setFillColor(...stat.color);
    doc.rect(xPos, yPos, 55, 20, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(String(stat.value), xPos + 27.5, yPos + 10, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(stat.label, xPos + 27.5, yPos + 16, { align: "center" });

    xPos += 60;
  });

  yPos += 30;

  // Assessment Records Table
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Assessment Records", 20, yPos);
  yPos += 5;

  const tableData = data.records.map((record) => [
    formatDate(record.assessment_date, "short"),
    record.students
      ? `${record.students.first_name} ${record.students.last_name}`
      : "N/A",
    record.subjects?.name || "N/A",
    record.assessment_type || "N/A",
    record.score && record.max_score
      ? `${record.score}/${record.max_score}`
      : "N/A",
    `${record.percentage}%`,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Date", "Student", "Subject", "Type", "Score", "Percentage"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 40 },
      2: { cellWidth: 35 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: 27 },
    },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      addFooter(doc, data.pageNumber, pageCount);
    },
  });

  doc.save(`academic-report-${new Date().toISOString().split("T")[0]}.pdf`);
}

/**
 * Export Memorization Report to PDF
 */
export function exportMemorizationToPDF(data: {
  records: any[];
  statistics: { total: number; mastered: number; learning: number };
  filters?: {
    student_name?: string;
    item_type?: string;
    status?: string;
  };
}) {
  const doc = initializePDF("Memorization Progress Report");

  let yPos = 50;

  // Report Filters
  if (data.filters) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Report Filters:", 20, yPos);
    yPos += 6;

    if (data.filters.student_name) {
      doc.text(`Student: ${data.filters.student_name}`, 25, yPos);
      yPos += 5;
    }
    if (data.filters.item_type) {
      doc.text(`Type: ${data.filters.item_type}`, 25, yPos);
      yPos += 5;
    }
    if (data.filters.status) {
      doc.text(`Status: ${data.filters.status}`, 25, yPos);
      yPos += 5;
    }
    yPos += 5;
  }

  // Summary Statistics
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Summary Statistics", 20, yPos);
  yPos += 8;

  const stats = [
    {
      label: "Total Items",
      value: data.statistics.total,
      color: COLORS.secondary,
    },
    {
      label: "Mastered",
      value: data.statistics.mastered,
      color: [147, 51, 234],
    }, // purple
    {
      label: "In Progress",
      value: data.statistics.learning,
      color: COLORS.primary,
    },
  ];

  let xPos = 20;
  stats.forEach((stat) => {
    doc.setFillColor(...stat.color);
    doc.rect(xPos, yPos, 55, 20, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(String(stat.value), xPos + 27.5, yPos + 10, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(stat.label, xPos + 27.5, yPos + 16, { align: "center" });

    xPos += 60;
  });

  yPos += 30;

  // Memorization Records Table
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Memorization Progress Records", 20, yPos);
  yPos += 5;

  const tableData = data.records.map((record) => [
    record.students
      ? `${record.students.first_name} ${record.students.last_name}`
      : "N/A",
    record.memorization_items?.title || "N/A",
    record.memorization_items?.item_type || "N/A",
    record.status ? record.status.replace("_", " ") : "N/A",
    record.proficiency_rating ? `${record.proficiency_rating}/5` : "N/A",
    formatDate(record.updated_at, "short"),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [
      ["Student", "Item", "Type", "Status", "Proficiency", "Last Updated"],
    ],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 40 },
      2: { cellWidth: 25 },
      3: { cellWidth: 30 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 },
    },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      addFooter(doc, data.pageNumber, pageCount);
    },
  });

  doc.save(`memorization-report-${new Date().toISOString().split("T")[0]}.pdf`);
}

/**
 * Export Certificate Report to PDF
 */
export function exportCertificateToPDF(data: {
  records: any[];
  statistics: { total: number; students: number };
  filters?: {
    student_name?: string;
    certificate_type?: string;
    date_from?: string;
    date_to?: string;
  };
}) {
  const doc = initializePDF("Certificate Report");

  let yPos = 50;

  // Report Filters
  if (data.filters) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Report Filters:", 20, yPos);
    yPos += 6;

    if (data.filters.student_name) {
      doc.text(`Student: ${data.filters.student_name}`, 25, yPos);
      yPos += 5;
    }
    if (data.filters.certificate_type) {
      doc.text(`Type: ${data.filters.certificate_type}`, 25, yPos);
      yPos += 5;
    }
    if (data.filters.date_from && data.filters.date_to) {
      doc.text(
        `Date Range: ${formatDate(data.filters.date_from)} to ${formatDate(
          data.filters.date_to
        )}`,
        25,
        yPos
      );
      yPos += 5;
    }
    yPos += 5;
  }

  // Summary Statistics
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Summary Statistics", 20, yPos);
  yPos += 8;

  const stats = [
    {
      label: "Total Certificates",
      value: data.statistics.total,
      color: [234, 179, 8], // yellow
    },
    {
      label: "Students",
      value: data.statistics.students,
      color: COLORS.primary,
    },
  ];

  let xPos = 20;
  stats.forEach((stat) => {
    doc.setFillColor(...stat.color);
    doc.rect(xPos, yPos, 80, 20, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(String(stat.value), xPos + 40, yPos + 10, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(stat.label, xPos + 40, yPos + 16, { align: "center" });

    xPos += 85;
  });

  yPos += 30;

  // Certificate Records Table
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Certificate Records", 20, yPos);
  yPos += 5;

  const tableData = data.records.map((record) => [
    record.certificate_number || "N/A",
    record.students
      ? `${record.students.first_name} ${record.students.last_name}`
      : "N/A",
    record.certificate_type
      ? record.certificate_type.replace(/_/g, " ")
      : "N/A",
    formatDate(record.issue_date, "short"),
    record.details || "-",
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Certificate #", "Student", "Type", "Issue Date", "Details"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 40 },
      2: { cellWidth: 40 },
      3: { cellWidth: 28 },
      4: { cellWidth: 37 },
    },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      addFooter(doc, data.pageNumber, pageCount);
    },
  });

  doc.save(`certificate-report-${new Date().toISOString().split("T")[0]}.pdf`);
}

/**
 * Export Low Attendance Report to PDF
 */
export function exportLowAttendanceToPDF(data: {
  records: any[];
  threshold: number;
}) {
  const doc = initializePDF("Low Attendance Alert Report");

  let yPos = 50;

  // Alert Banner
  doc.setFillColor(239, 68, 68); // red
  doc.rect(20, yPos, 170, 15, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(
    `ALERT: ${data.records.length} Student${
      data.records.length !== 1 ? "s" : ""
    } Below ${data.threshold}% Attendance`,
    105,
    yPos + 10,
    { align: "center" }
  );

  yPos += 25;

  // Description
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    "These students require immediate attention and follow-up with parents.",
    20,
    yPos
  );
  yPos += 10;

  // Student Records Table
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Student Details", 20, yPos);
  yPos += 5;

  const tableData = data.records.map((record) => [
    record.student_number || "N/A",
    record.first_name && record.last_name
      ? `${record.first_name} ${record.last_name}`
      : "N/A",
    record.className || "N/A",
    `${record.percentage}%`,
    `${record.present}/${record.total}`,
    String(record.absent),
    record.parent_name || "N/A",
    record.parent_phone || "N/A",
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [
      [
        "Student #",
        "Name",
        "Class",
        "Rate",
        "Present/Total",
        "Absent",
        "Parent",
        "Phone",
      ],
    ],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: COLORS.danger,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 35 },
      2: { cellWidth: 25 },
      3: { cellWidth: 18, fontStyle: "bold" },
      4: { cellWidth: 22 },
      5: { cellWidth: 18 },
      6: { cellWidth: 25 },
      7: { cellWidth: 25 },
    },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      addFooter(doc, data.pageNumber, pageCount);
    },
  });

  doc.save(
    `low-attendance-alert-${new Date().toISOString().split("T")[0]}.pdf`
  );
}
