
var fs =require("fs")
const PDFDocument = require("pdfkit");

function createInvoice(invoice, path) {
  let doc = new PDFDocument({ size: "A4", margin: 50 });

  generateCustomerInformation(doc, invoice);
  generateInvoiceTable(doc, invoice);
  doc.end();
  doc.pipe(fs.createWriteStream(path));
}

function generateCustomerInformation(doc, invoice) {
  doc
    .fillColor("#444444")
    .fontSize(20)
    .text("Invoice", 50, 160);

  generateHr(doc, 185);

  const customerInformationTop = 200;

  doc
    .fontSize(10)
    .text("Invoice Number:", 50, customerInformationTop)
    .font("Helvetica-Bold")
    .text(invoice.invoice_nr, 150, customerInformationTop)
    .font("Helvetica")
    .text("Invoice Date:", 50, customerInformationTop + 15)
    .font("Helvetica-Bold")
    .text(invoice.date, 150, customerInformationTop + 15)
    .font("Helvetica")
    .text("Name : ", 50 ,customerInformationTop+ 30)
    .font("Helvetica-Bold")
    .text(invoice.shipping.name, 150, customerInformationTop+30)
    .font("Helvetica")
    .text("Addresss : ", 50 ,customerInformationTop+ 45)
    .font("Helvetica-Bold")
    .text(invoice.shipping.address, 150, customerInformationTop + 45)
    .text(invoice.shipping.postal_code, 150,customerInformationTop+60)
    .font("Helvetica")
    .moveDown();

  generateHr(doc, 275);
}
function generateInvoiceTable(doc, invoice) {
      let i;
      const invoiceTableTop = 330;
    
      doc.font("Helvetica-Bold");
      generateTableRow(
        doc,
        invoiceTableTop,
        "Item",
        "Category",
        "Quantity",
        "Line Total"
      );
      generateHr(doc, invoiceTableTop + 20);
      doc.font("Helvetica");
      var finalPos = 0
      for (i = 0; i < invoice.products.length; i++) {
        const product = invoice.products[i];
        const position = invoiceTableTop + (i + 1) * 30;
        generateTableRow(
          doc,
          position,
          product.product.name,
          product.product.category,
          product.quantity,
          product.product.price
        );
  
        generateHr(doc, position + 20);
        finalPos = position + 10;
      }
      generateTotal(doc, invoice, finalPos)
}

function generateTotal(doc, invoice, y){
  doc
        .fontSize(10)
        .text("Invoice Total:", 325, y+15)
        .font("Helvetica")
        .text(invoice.amount, 425, y+15)
        .font("Helvetica")
}

function generateTableRow(doc, y, c1, c2, c3, c4, c5){
    doc
      .fontSize(10)
      .text(c1, 50, y)
      .text(c2, 150, y)
      .text(c3, 280, y, { width: 90, align: "right" })
      .text(c4, 370, y, { width: 90, align: "right" })
      .text(c5, 0, y, { align: "right" });
  }

function generateHr(doc, y) {
    doc
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(50, y)
      .lineTo(550, y)
      .stroke();
  }

  module.exports = {
    createInvoice
  };