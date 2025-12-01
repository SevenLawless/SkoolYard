import { jsPDF } from "jspdf";
import type { Payment } from "./data";

export function generateInvoicePDF(
  payment: Payment,
  payerName: string,
  additionalInfo?: {
    classSubject?: string;
    teacherName?: string;
    staffName?: string;
  }
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Color scheme based on payment type
  const getColor = () => {
    if (payment.type === "student") return [59, 130, 246]; // Blue
    if (payment.type === "teacher") return [251, 146, 60]; // Orange
    return [139, 92, 246]; // Purple for staff
  };
  const [r, g, b] = getColor();

  // Colored header section
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, pageWidth, 40, "F");

  // Company/School header
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("SchoolYard", 20, 20);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Learning Center", 20, 28);

  // Invoice title in header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pageWidth - 20, 25, { align: "right" });

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Invoice details box
  let yPos = 50;
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(20, yPos, pageWidth - 40, 35, 3, 3, "F");
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Invoice Number", 25, yPos + 8);
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text(payment.invoiceNumber || "N/A", 25, yPos + 15);

  const paymentDate = payment.date ? new Date(payment.date).toLocaleDateString() : new Date().toLocaleDateString();
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text("Date", 25, yPos + 25);
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(paymentDate, 25, yPos + 32);

  // Payment type badge
  const paymentTypeLabel = payment.type === "student" ? "Student Payment" : payment.type === "teacher" ? "Teacher Payment" : "Staff Payment";
  doc.setFillColor(r, g, b);
  const typeWidth = doc.getTextWidth(paymentTypeLabel) + 10;
  doc.roundedRect(pageWidth - 20 - typeWidth, yPos + 5, typeWidth, 12, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(paymentTypeLabel, pageWidth - 20 - typeWidth / 2, yPos + 12, { align: "center" });

  yPos = 100;

  // Bill To section
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 20, yPos);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(payerName, 20, yPos + 10);

  // Additional info box
  if (additionalInfo) {
    yPos += 20;
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(20, yPos, pageWidth - 40, 30, 3, 3, "F");
    
    let infoY = yPos + 8;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    if (additionalInfo.classSubject) {
      doc.text(`Class: ${additionalInfo.classSubject}`, 25, infoY);
      infoY += 8;
    }
    if (additionalInfo.teacherName) {
      doc.text(`Teacher: ${additionalInfo.teacherName}`, 25, infoY);
      infoY += 8;
    }
    if (additionalInfo.staffName) {
      doc.text(`Staff: ${additionalInfo.staffName}`, 25, infoY);
    }
    yPos += 40;
  } else {
    yPos += 30;
  }

  // Amount section with colored box
  doc.setFillColor(r, g, b);
  doc.roundedRect(20, yPos, pageWidth - 40, 35, 3, 3, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Total Amount", 25, yPos + 15);
  
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(`${payment.amount.toFixed(2)} DH`, pageWidth - 25, yPos + 20, { align: "right" });

  // Footer with company info
  const footerY = pageHeight - 40;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(20, footerY, pageWidth - 20, footerY);

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("SchoolYard Learning Center", 20, footerY + 10);
  doc.text("Email: info@schoolyard.com | Phone: +212 6 00 00 00 00", 20, footerY + 17);
  doc.text("Thank you for your business!", pageWidth / 2, footerY + 25, { align: "center" });

  // Download the PDF
  const fileName = `Invoice_${payment.invoiceNumber || payment.id}_${paymentDate.replace(/\//g, "-")}.pdf`;
  doc.save(fileName);
}

