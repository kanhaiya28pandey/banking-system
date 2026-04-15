package com.banking.service;

import com.banking.model.Transaction;
import com.banking.model.Account;
import com.banking.model.User;
import com.itextpdf.io.image.ImageData;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.LineSeparator;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.events.PdfDocumentEvent;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import org.springframework.stereotype.Service;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
public class ReceiptService {

    public byte[] generateReceiptPdf(Transaction tx, Account account, User user) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdfDoc = new PdfDocument(writer);
        Document doc = new Document(pdfDoc);
        doc.setMargins(25, 25, 25, 25);

        // Color palette
        DeviceRgb goldColor = new DeviceRgb(245, 200, 66);          // #F5C842
        DeviceRgb darkBg = new DeviceRgb(10, 18, 32);              // #0A1220
        DeviceRgb textColor = new DeviceRgb(240, 239, 234);        // #F0EFEA
        DeviceRgb greenColor = new DeviceRgb(0, 255, 178);         // #00FFB2
        DeviceRgb redColor = new DeviceRgb(255, 77, 109);          // #FF4D6D
        DeviceRgb blueColor = new DeviceRgb(59, 158, 255);         // #3B9EFF
        DeviceRgb lightGray = new DeviceRgb(122, 143, 166);        // #7A8FA6
        DeviceRgb bgGray = new DeviceRgb(13, 24, 41);              // #0D1829

        // TOP DECORATIVE ELEMENT
        Paragraph topDecor = new Paragraph("◆ TRANSACTION RECEIPT ◆")
                .setFontSize(10)
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(goldColor)
                .setMarginBottom(16);
        doc.add(topDecor);

        // HEADER with gradient effect
        Paragraph header = new Paragraph("NEXBANK")
                .setFontSize(32)
                .setBold()
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(goldColor)
                .setMarginBottom(4);
        doc.add(header);

        Paragraph tagline = new Paragraph("SECURE DIGITAL BANKING")
                .setFontSize(9)
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(lightGray)
                .setMarginBottom(20);
        doc.add(tagline);

        // DECORATIVE LINE
        Paragraph line1 = new Paragraph("━".repeat(70))
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(new DeviceRgb(245, 200, 66))
                .setFontSize(8)
                .setMarginBottom(18);
        doc.add(line1);

        // TRANSACTION STATUS
        String statusText = tx.getStatus().equals("SUCCESS") ? "✓ SUCCESSFUL" : "✗ FAILED";
        DeviceRgb statusColor = tx.getStatus().equals("SUCCESS") ? greenColor : redColor;
        Paragraph status = new Paragraph(statusText)
                .setFontSize(12)
                .setBold()
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(statusColor)
                .setMarginBottom(16);
        doc.add(status);

        // MAIN INFO TABLE with better styling
        Table infoTable = new Table(2);
        infoTable.setWidth(500);
        infoTable.setMarginBottom(20);

        addStyledRow(infoTable, "Receipt ID", tx.getId() != null ? tx.getId().substring(0, Math.min(16, tx.getId().length())) : "N/A",
                     goldColor, textColor, bgGray);
        addStyledRow(infoTable, "Date & Time", formatDateTime(tx.getDate()),
                     goldColor, textColor, bgGray);
        addStyledRow(infoTable, "Transaction Type", tx.getType(),
                     goldColor, getTypeColor(tx.getType(), greenColor, redColor, blueColor), bgGray);
        addStyledRow(infoTable, "Amount", "₹ " + String.format("%,.2f", tx.getAmount()),
                     goldColor, getTypeColor(tx.getType(), greenColor, redColor, blueColor), bgGray);
        addStyledRow(infoTable, "Status", tx.getStatus(),
                     goldColor, tx.getStatus().equals("SUCCESS") ? greenColor : redColor, bgGray);

        if (tx.getFromAccount() != null && !tx.getFromAccount().isEmpty()) {
            addStyledRow(infoTable, "From Account", maskAccountNumber(tx.getFromAccount()),
                         goldColor, lightGray, bgGray);
        }
        if (tx.getToAccount() != null && !tx.getToAccount().isEmpty()) {
            addStyledRow(infoTable, "To Account", maskAccountNumber(tx.getToAccount()),
                         goldColor, lightGray, bgGray);
        }

        addStyledRow(infoTable, "Description", tx.getDescription() != null ? tx.getDescription() : "N/A",
                     goldColor, textColor, bgGray);

        doc.add(infoTable);

        // DECORATIVE LINE
        Paragraph line2 = new Paragraph("━".repeat(70))
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(goldColor)
                .setFontSize(8)
                .setMarginBottom(16);
        doc.add(line2);

        // ACCOUNT HOLDER INFO (if available)
        if (user != null) {
            Paragraph userInfo = new Paragraph("Account Holder: " + user.getName())
                    .setFontSize(10)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontColor(textColor)
                    .setMarginBottom(12);
            doc.add(userInfo);
        }

        // SECURITY BADGE
        Paragraph security = new Paragraph("🔒 ENCRYPTED & SECURED")
                .setFontSize(9)
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(greenColor)
                .setMarginBottom(20);
        doc.add(security);

        // FOOTER
        Paragraph footer = new Paragraph("© 2026 NexBank. All rights reserved.\nThis is a digital receipt issued by NexBank.\nFor support, visit nexbank.com")
                .setTextAlignment(TextAlignment.CENTER)
                .setFontSize(8)
                .setFontColor(lightGray)
                .setMarginTop(20);
        doc.add(footer);

        // BOTTOM DECORATIVE ELEMENT
        Paragraph bottomDecor = new Paragraph("◆ THANK YOU ◆")
                .setFontSize(10)
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(goldColor)
                .setMarginTop(16);
        doc.add(bottomDecor);

        doc.close();
        return baos.toByteArray();
    }

    private void addStyledRow(Table table, String label, String value,
                             DeviceRgb labelColor, DeviceRgb valueColor, DeviceRgb bgColor) {
        Cell labelCell = new Cell()
                .add(new Paragraph(label)
                        .setFontSize(10)
                        .setBold()
                        .setFontColor(labelColor))
                .setPadding(12)
                .setBackgroundColor(bgColor);

        Cell valueCell = new Cell()
                .add(new Paragraph(value != null ? value : "N/A")
                        .setFontSize(11)
                        .setFontColor(valueColor))
                .setPadding(12)
                .setBackgroundColor(bgColor);

        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private String formatDateTime(java.time.LocalDateTime dateTime) {
        if (dateTime == null) return "N/A";
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm:ss");
        return dateTime.format(formatter);
    }

    private String maskAccountNumber(String accountNumber) {
        if (accountNumber == null || accountNumber.length() < 4) return accountNumber;
        return "****" + accountNumber.substring(accountNumber.length() - 4);
    }

    private DeviceRgb getTypeColor(String type, DeviceRgb green, DeviceRgb red, DeviceRgb blue) {
        if ("CREDIT".equals(type)) return green;
        if ("DEBIT".equals(type)) return red;
        if ("TRANSFER".equals(type)) return blue;
        return new DeviceRgb(122, 143, 166);
    }
}
