package com.banking.service;

import com.banking.model.Transaction;
import com.banking.model.Account;
import com.banking.model.User;
import com.banking.repository.TransactionRepository;
import com.banking.repository.AccountRepository;
import com.banking.repository.UserRepository;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.VerticalAlignment;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.colors.Color;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class ExportService {

    @Autowired private TransactionRepository transactionRepository;
    @Autowired private AccountRepository accountRepository;
    @Autowired private UserRepository userRepository;

    private static final Color GOLD = new DeviceRgb(245, 200, 66);
    private static final Color DARK_BG = new DeviceRgb(6, 10, 18);
    private static final Color TEXT_COLOR = new DeviceRgb(240, 239, 234);
    private static final Color GREEN = new DeviceRgb(0, 255, 178);
    private static final Color RED = new DeviceRgb(255, 77, 109);
    private static final Color BLUE = new DeviceRgb(59, 158, 255);

    public byte[] generateStatementPdf(String accountNumber, LocalDateTime fromDate, LocalDateTime toDate) throws Exception {
        Optional<Account> accOpt = accountRepository.findByAccountNumber(accountNumber);
        if (accOpt.isEmpty()) {
            throw new RuntimeException("Account not found");
        }

        Account account = accOpt.get();
        Optional<User> userOpt = userRepository.findById(account.getUserId());
        User user = userOpt.orElse(null);

        List<Transaction> transactions = transactionRepository
            .findByFromAccountOrToAccountAndDateBetweenOrderByDateDesc(
                accountNumber, accountNumber, fromDate, toDate, org.springframework.data.domain.PageRequest.of(0, 1000)).getContent();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdfDoc = new PdfDocument(writer);
        Document document = new Document(pdfDoc);
        document.setMargins(36, 36, 36, 36);

        // Header
        Paragraph header = new Paragraph("NEXBANK STATEMENT OF ACCOUNT")
            .setFontSize(22)
            .setBold()
            .setFontColor(GOLD)
            .setTextAlignment(TextAlignment.CENTER)
            .setMarginBottom(4);
        document.add(header);

        Paragraph subheader = new Paragraph("Transaction Report")
            .setFontSize(12)
            .setFontColor(TEXT_COLOR)
            .setTextAlignment(TextAlignment.CENTER)
            .setMarginBottom(24);
        document.add(subheader);

        // Account Info
        float[] colWidths = {1, 1, 1, 1};
        Table infoTable = new Table(colWidths);
        infoTable.setMarginBottom(24);

        addInfoCell(infoTable, "Account Holder", user != null ? user.getName() : "N/A");
        addInfoCell(infoTable, "Account Number", accountNumber);
        addInfoCell(infoTable, "Account Type", account.getAccountType());
        addInfoCell(infoTable, "Current Balance", "₹" + String.format("%.2f", account.getBalance()));

        addInfoCell(infoTable, "From Date", fromDate != null ? fromDate.toLocalDate().toString() : "All");
        addInfoCell(infoTable, "To Date", toDate != null ? toDate.toLocalDate().toString() : "All");
        addInfoCell(infoTable, "Report Generated", LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm")));
        addInfoCell(infoTable, "Total Transactions", String.valueOf(transactions.size()));

        document.add(infoTable);

        // Transactions Table
        float[] txnColWidths = {1.2f, 1, 1, 1.2f, 1, 1.5f};
        Table txnTable = new Table(txnColWidths);
        txnTable.setMarginBottom(24);
        txnTable.setBackgroundColor(new DeviceRgb(13, 21, 36));

        // Header Row
        addHeaderCell(txnTable, "Date & Time");
        addHeaderCell(txnTable, "Type");
        addHeaderCell(txnTable, "Amount");
        addHeaderCell(txnTable, "From/To Account");
        addHeaderCell(txnTable, "Status");
        addHeaderCell(txnTable, "Description");

        double totalCredit = 0;
        double totalDebit = 0;

        for (Transaction tx : transactions) {
            boolean isCredit = tx.getType().equals("CREDIT");
            Color typeColor = isCredit ? GREEN : tx.getType().equals("DEBIT") ? RED : BLUE;

            String dateTime = tx.getDate() != null ?
                tx.getDate().format(DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm")) : "";
            String account_info = isCredit ?
                (tx.getToAccount() != null ? tx.getToAccount() : "N/A") :
                (tx.getFromAccount() != null ? tx.getFromAccount() : "N/A");

            addTxnCell(txnTable, dateTime, TEXT_COLOR);
            addTxnCell(txnTable, tx.getType(), typeColor);

            String amountStr = "₹" + String.format("%.2f", tx.getAmount());
            addTxnCell(txnTable, amountStr, TEXT_COLOR);
            addTxnCell(txnTable, account_info, TEXT_COLOR);

            Color statusColor = "SUCCESS".equals(tx.getStatus()) ? GREEN : RED;
            addTxnCell(txnTable, tx.getStatus(), statusColor);
            addTxnCell(txnTable, tx.getDescription() != null ? tx.getDescription() : "", TEXT_COLOR);

            if (isCredit) totalCredit += tx.getAmount();
            else if ("DEBIT".equals(tx.getType())) totalDebit += tx.getAmount();
        }

        document.add(txnTable);

        // Summary
        float[] summaryColWidths = {2, 1, 1, 1};
        Table summaryTable = new Table(summaryColWidths);
        addSummaryCell(summaryTable, "Total Credits", "₹" + String.format("%.2f", totalCredit), GREEN);
        addSummaryCell(summaryTable, "Total Debits", "₹" + String.format("%.2f", totalDebit), RED);
        addSummaryCell(summaryTable, "Net Flow", "₹" + String.format("%.2f", totalCredit - totalDebit), GOLD);

        document.add(summaryTable);

        // Footer
        Paragraph footer = new Paragraph("© 2026 NexBank. All rights reserved. This is an electronically generated document.")
            .setFontSize(9)
            .setFontColor(new DeviceRgb(122, 143, 166))
            .setTextAlignment(TextAlignment.CENTER)
            .setMarginTop(32);
        document.add(footer);

        document.close();
        return baos.toByteArray();
    }

    public byte[] generateStatementCsv(String accountNumber, LocalDateTime fromDate, LocalDateTime toDate) throws Exception {
        Optional<Account> accOpt = accountRepository.findByAccountNumber(accountNumber);
        if (accOpt.isEmpty()) {
            throw new RuntimeException("Account not found");
        }

        Account account = accOpt.get();
        Optional<User> userOpt = userRepository.findById(account.getUserId());
        User user = userOpt.orElse(null);

        List<Transaction> transactions = transactionRepository
            .findByFromAccountOrToAccountAndDateBetweenOrderByDateDesc(
                accountNumber, accountNumber, fromDate, toDate, org.springframework.data.domain.PageRequest.of(0, 10000)).getContent();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        OutputStreamWriter writer = new OutputStreamWriter(baos);
        CSVPrinter csvPrinter = new CSVPrinter(writer, CSVFormat.DEFAULT.withHeader(
            "Date", "Time", "Type", "Amount", "From Account", "To Account", "Status", "Description", "Transaction ID"
        ));

        for (Transaction tx : transactions) {
            String dateTime = tx.getDate() != null ?
                tx.getDate().format(DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm")) : "";
            String date = tx.getDate() != null ?
                tx.getDate().toLocalDate().toString() : "";
            String time = tx.getDate() != null ?
                tx.getDate().format(DateTimeFormatter.ofPattern("HH:mm:ss")) : "";

            csvPrinter.printRecord(
                date,
                time,
                tx.getType(),
                String.format("%.2f", tx.getAmount()),
                tx.getFromAccount() != null ? tx.getFromAccount() : "",
                tx.getToAccount() != null ? tx.getToAccount() : "",
                tx.getStatus(),
                tx.getDescription() != null ? tx.getDescription() : "",
                tx.getId()
            );
        }

        csvPrinter.flush();
        writer.close();
        return baos.toByteArray();
    }

    private void addInfoCell(Table table, String label, String value) {
        Cell labelCell = new Cell()
            .add(new Paragraph(label).setBold().setFontSize(10).setFontColor(GOLD))
            .setBackgroundColor(new DeviceRgb(13, 21, 36))
            .setPadding(10);
        table.addCell(labelCell);

        Cell valueCell = new Cell()
            .add(new Paragraph(value).setFontSize(10).setFontColor(TEXT_COLOR))
            .setBackgroundColor(new DeviceRgb(10, 18, 32))
            .setPadding(10);
        table.addCell(valueCell);
    }

    private void addHeaderCell(Table table, String header) {
        Cell cell = new Cell()
            .add(new Paragraph(header).setBold().setFontSize(11).setFontColor(GOLD))
            .setBackgroundColor(new DeviceRgb(13, 21, 36))
            .setPadding(12)
            .setTextAlignment(TextAlignment.CENTER)
            .setVerticalAlignment(VerticalAlignment.MIDDLE);
        table.addCell(cell);
    }

    private void addTxnCell(Table table, String value, Color color) {
        Cell cell = new Cell()
            .add(new Paragraph(value).setFontSize(10).setFontColor(color))
            .setBackgroundColor(new DeviceRgb(10, 18, 32))
            .setPadding(10);
        table.addCell(cell);
    }

    private void addSummaryCell(Table table, String label, String value, Color color) {
        Cell labelCell = new Cell()
            .add(new Paragraph(label).setBold().setFontSize(11).setFontColor(TEXT_COLOR))
            .setBackgroundColor(new DeviceRgb(13, 21, 36))
            .setPadding(12);
        table.addCell(labelCell);

        Cell valueCell = new Cell()
            .add(new Paragraph(value).setBold().setFontSize(12).setFontColor(color))
            .setBackgroundColor(new DeviceRgb(10, 18, 32))
            .setPadding(12)
            .setTextAlignment(TextAlignment.RIGHT);
        table.addCell(valueCell);
    }
}
