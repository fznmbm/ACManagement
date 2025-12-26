import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface InvoiceData {
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  student_name: string;
  student_number: string;
  parent_name: string;
  parent_email: string;
  items: Array<{
    description: string;
    amount: number;
  }>;
  subtotal: number;
  total: number;
  status: "paid" | "pending" | "overdue";
  paid_date?: string;
  payment_method?: string;
}

interface FineReceiptData {
  receipt_number: string;
  issue_date: string;
  student_name: string;
  student_number: string;
  parent_name: string;
  fine_type: string;
  fine_reason: string;
  amount: number;
  status: "paid" | "pending" | "waived";
  paid_date?: string;
  payment_method?: string;
}

export function generateFeeInvoicePDF(data: InvoiceData, schoolInfo: any) {
  const doc = new jsPDF();

  // School Logo and Header
  doc.setFontSize(20);
  doc.setTextColor(34, 197, 94); // Primary green
  doc.text(schoolInfo.name || "Al Hikmah Institute Crawley", 15, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(schoolInfo.address || "West Sussex, UK", 15, 28);
  doc.text(
    `Email: ${schoolInfo.email || "alhikmahinstitutecrawley@gmail.com"}`,
    15,
    33
  );
  doc.text(`Phone: ${schoolInfo.phone || "+44 7411 061242"}`, 15, 38);

  // Invoice Title
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("FEE INVOICE", 15, 55);

  // Invoice Details Box
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);

  const rightX = 140;
  doc.text(`Invoice #: ${data.invoice_number}`, rightX, 55);
  doc.text(
    `Date: ${new Date(data.invoice_date).toLocaleDateString("en-GB")}`,
    rightX,
    60
  );
  doc.text(
    `Due Date: ${new Date(data.due_date).toLocaleDateString("en-GB")}`,
    rightX,
    65
  );

  // Status Badge
  const statusColors: any = {
    paid: [34, 197, 94],
    pending: [251, 146, 60],
    overdue: [239, 68, 68],
  };
  const statusColor = statusColors[data.status] || [100, 100, 100];
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(rightX, 68, 35, 7, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(data.status.toUpperCase(), rightX + 17.5, 73, { align: "center" });

  // Bill To Section
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("BILL TO:", 15, 70);

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(data.parent_name, 15, 77);
  doc.text(data.parent_email, 15, 82);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Student: ${data.student_name}`, 15, 89);
  doc.text(`Student #: ${data.student_number}`, 15, 94);

  // Line Items Table
  const tableStartY = 105;

  autoTable(doc, {
    startY: tableStartY,
    head: [["Description", "Amount"]],
    body: data.items.map((item) => [
      item.description,
      `£${item.amount.toFixed(2)}`,
    ]),
    theme: "grid",
    headStyles: {
      fillColor: [34, 197, 94],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 10,
    },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 50, halign: "right" },
    },
  });

  // Get the Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY || tableStartY + 40;

  // Totals
  const totalsX = 130;
  const totalsStartY = finalY + 10;

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text("Subtotal:", totalsX, totalsStartY);
  doc.text(`£${data.subtotal.toFixed(2)}`, 190, totalsStartY, {
    align: "right",
  });

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("TOTAL:", totalsX, totalsStartY + 8);
  doc.text(`£${data.total.toFixed(2)}`, 190, totalsStartY + 8, {
    align: "right",
  });

  // Payment Information (if paid)
  if (data.status === "paid" && data.paid_date) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(34, 197, 94);
    const paidY = totalsStartY + 20;
    doc.text(
      `Paid on: ${new Date(data.paid_date).toLocaleDateString("en-GB")}`,
      15,
      paidY
    );
    if (data.payment_method) {
      doc.text(`Payment Method: ${data.payment_method}`, 15, paidY + 5);
    }
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  const footerY = 280;
  doc.text(
    "Thank you for your payment. For any queries, please contact the school office.",
    105,
    footerY,
    { align: "center" }
  );
  doc.text(
    `Generated on ${new Date().toLocaleDateString(
      "en-GB"
    )} at ${new Date().toLocaleTimeString("en-GB")}`,
    105,
    footerY + 4,
    { align: "center" }
  );

  return doc;
}

export function generateFineReceiptPDF(data: FineReceiptData, schoolInfo: any) {
  const doc = new jsPDF();

  // School Logo and Header
  doc.setFontSize(20);
  doc.setTextColor(34, 197, 94);
  doc.text(schoolInfo.name || "Al Hikmah Institute Crawley", 15, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(schoolInfo.address || "West Sussex, UK", 15, 28);
  doc.text(
    `Email: ${schoolInfo.email || "alhikmahinstitutecrawley@gmail.com"}`,
    15,
    33
  );
  doc.text(`Phone: ${schoolInfo.phone || "+44 7700 900000"}`, 15, 38);

  // Receipt Title
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("ATTENDANCE FINE RECEIPT", 15, 55);

  // Receipt Details
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);

  const rightX = 140;
  doc.text(`Receipt #: ${data.receipt_number}`, rightX, 55);
  doc.text(
    `Date: ${new Date(data.issue_date).toLocaleDateString("en-GB")}`,
    rightX,
    60
  );

  // Status Badge
  const statusColors: any = {
    paid: [34, 197, 94],
    pending: [251, 146, 60],
    waived: [59, 130, 246],
  };
  const statusColor = statusColors[data.status] || [100, 100, 100];
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(rightX, 63, 35, 7, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(data.status.toUpperCase(), rightX + 17.5, 68, { align: "center" });

  // Student Information
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("STUDENT INFORMATION:", 15, 70);

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Student Name: ${data.student_name}`, 15, 77);
  doc.text(`Student Number: ${data.student_number}`, 15, 82);
  doc.text(`Parent/Guardian: ${data.parent_name}`, 15, 87);

  // Fine Details Box
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(15, 95, 180, 35, 3, 3, "FD");

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text("FINE DETAILS:", 20, 103);

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Type: ${data.fine_type}`, 20, 110);
  doc.text(`Reason: ${data.fine_reason}`, 20, 117);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(239, 68, 68); // Red for fine amount
  doc.text(`Amount: £${data.amount.toFixed(2)}`, 20, 125);

  // Payment Information
  if (data.status === "paid" && data.paid_date) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(34, 197, 94);
    doc.text("PAYMENT INFORMATION:", 15, 145);

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(
      `Payment Date: ${new Date(data.paid_date).toLocaleDateString("en-GB")}`,
      15,
      152
    );
    if (data.payment_method) {
      doc.text(`Payment Method: ${data.payment_method}`, 15, 157);
    }

    // Paid Stamp
    doc.setFontSize(24);
    doc.setTextColor(34, 197, 94);
    doc.setFont("helvetica", "bold");
    doc.text("PAID", 105, 180, {
      align: "center",
      angle: 15,
    });
    doc.setDrawColor(34, 197, 94);
    doc.setLineWidth(2);
    doc.circle(105, 175, 25, "S");
  } else if (data.status === "waived") {
    doc.setFontSize(11);
    doc.setTextColor(59, 130, 246);
    doc.text("This fine has been waived by the administration.", 15, 145);
  } else {
    doc.setFontSize(11);
    doc.setTextColor(251, 146, 60);
    doc.text("This fine is currently PENDING payment.", 15, 145);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  const footerY = 280;
  doc.text(
    "For any queries regarding this fine, please contact the school office.",
    105,
    footerY,
    { align: "center" }
  );
  doc.text(
    `Generated on ${new Date().toLocaleDateString(
      "en-GB"
    )} at ${new Date().toLocaleTimeString("en-GB")}`,
    105,
    footerY + 4,
    { align: "center" }
  );

  return doc;
}
