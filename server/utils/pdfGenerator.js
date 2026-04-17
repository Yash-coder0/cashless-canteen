const PDFDocument = require("pdfkit");

/**
 * Generates Orders Report PDF
 * @param {Array} orders - Array of order objects
 * @param {Object} filters - Filter criteria {status, dateFrom, dateTo}
 * @param {Object} res - Express response object
 */
const generateOrdersReportPDF = (orders, filters, res) => {
  const doc = new PDFDocument({ margin: 30, size: "A4" });

  // Pipe directly to response
  doc.pipe(res);

  // Header
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("RIT Canteen", { align: "center" })
    .fontSize(14)
    .text("Cashless Canteen System", { align: "center" })
    .moveDown(0.5);

  doc
    .fontSize(16)
    .font("Helvetica")
    .text("Orders Report", { align: "center", underline: true })
    .moveDown(1);

  // Filter Info
  doc.fontSize(10).font("Helvetica");
  if (filters.status) doc.text(`Status: ${filters.status}`);
  if (filters.dateFrom) doc.text(`From: ${new Date(filters.dateFrom).toLocaleDateString()}`);
  if (filters.dateTo) doc.text(`To: ${new Date(filters.dateTo).toLocaleDateString()}`);
  doc.moveDown(1);

  // Table setup
  const tableTop = doc.y;
  const colWidths = [60, 100, 150, 70, 70, 85];
  const colX = [];
  let currentX = 30;
  for (const width of colWidths) {
    colX.push(currentX);
    currentX += width;
  }

  // Draw Table Headers
  const headers = ["Order ID", "Student Name", "Items", "Amount", "Status", "Date"];
  doc.font("Helvetica-Bold").fontSize(10);
  headers.forEach((header, i) => {
    doc.text(header, colX[i], tableTop, { width: colWidths[i], align: "left" });
  });

  // Draw Line
  let y = doc.y + 5;
  doc.moveTo(30, y).lineTo(565, y).stroke();
  y += 10;

  // Table Rows
  doc.font("Helvetica").fontSize(9);
  orders.forEach((order) => {
    // Check page break
    if (y > 750) {
      doc.addPage();
      y = 30;
      doc.font("Helvetica-Bold").fontSize(10);
      headers.forEach((header, i) => {
        doc.text(header, colX[i], y, { width: colWidths[i], align: "left" });
      });
      y = doc.y + 5;
      doc.moveTo(30, y).lineTo(565, y).stroke();
      y += 10;
      doc.font("Helvetica").fontSize(9);
    }

    const itemsText = order.items.map((i) => `${i.name} x${i.quantity}`).join(", ");
    const amountText = `Rs. ${(order.totalAmount / 100).toFixed(2)}`;
    const dateText = new Date(order.createdAt).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit"
    });

    const studentName = order.userId?.name || "N/A";

    // Text with wrapping
    const rowTop = y;
    let maxRowHeight = 0;

    const rowData = [
      order.orderNumber.toString(),
      studentName,
      itemsText,
      amountText,
      order.status,
      dateText
    ];

    rowData.forEach((text, i) => {
      const height = doc.heightOfString(text, { width: colWidths[i] });
      doc.text(text, colX[i], rowTop, { width: colWidths[i] });
      if (height > maxRowHeight) maxRowHeight = height;
    });

    y += maxRowHeight + 10;
    doc.moveTo(30, y - 5).lineTo(565, y - 5).strokeColor("#eeeeee").stroke();
    doc.strokeColor("#000000"); // Reset stroke color
  });

  // Footer
  doc.on("pageAdded", () => {
    addFooter(doc);
  });
  
  // Go through all pages and add footer (hack since pdfkit doesn't have native footer)
  const range = doc.bufferedPageRange();
  if (!range) {
     addFooter(doc);
  } else {
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      addFooter(doc);
    }
  }

  doc.end();
};

const addFooter = (doc) => {
  const bottom = doc.page.height - 50;
  doc.page.margins.bottom = 0;
  doc
    .fontSize(8)
    .fillColor("#666666")
    .text(
      `Generated on ${new Date().toLocaleString()} | RIT Canteen Admin`,
      30,
      bottom,
      { align: "center", width: doc.page.width - 60 }
    );
  // Reset for normal writing
  doc.fillColor("#000000");
  doc.page.margins.bottom = 30;
};

/**
 * Generates Revenue Report PDF
 * @param {Object} analyticsData - { revenue, overview, items }
 * @param {String} period - "daily", "weekly", "monthly", "yearly"
 * @param {Object} res - Express response object
 */
const generateRevenueReportPDF = (analyticsData, period, res) => {
  const doc = new PDFDocument({ margin: 30, size: "A4", bufferPages: true });

  // Pipe directly to response
  doc.pipe(res);

  // Header
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("RIT Canteen", { align: "center" })
    .fontSize(14)
    .text("Cashless Canteen System", { align: "center" })
    .moveDown(0.5);

  doc
    .fontSize(16)
    .font("Helvetica")
    .text("Revenue Report", { align: "center", underline: true })
    .moveDown(1);

  // Period Info
  doc.fontSize(10).font("Helvetica").text(`Period: ${period.charAt(0).toUpperCase() + period.slice(1)}`);
  doc.moveDown(1);

  // Summary Table
  const { overview } = analyticsData;
  if (overview) {
    doc.fontSize(14).font("Helvetica-Bold").text("Summary").moveDown(0.5);
    doc.fontSize(10).font("Helvetica");
    doc.text(`Total Revenue: Rs. ${overview.totalRevenue.toFixed(2)}`);
    doc.text(`Total Completed Orders: ${overview.totalCompletedOrders}`);
    if (overview.totalCompletedOrders > 0) {
       doc.text(`Average Order Value: Rs. ${(overview.totalRevenue / overview.totalCompletedOrders).toFixed(2)}`);
    } else {
       doc.text(`Average Order Value: Rs. 0.00`);
    }
    doc.moveDown(1.5);
  }

  // Top 10 items table
  const { items } = analyticsData;
  if (items && items.mostPopular && items.mostPopular.length > 0) {
    doc.fontSize(14).font("Helvetica-Bold").text("Top Items").moveDown(0.5);

    const tableTop = doc.y;
    const colWidths = [200, 100, 100];
    const colX = [30, 230, 330];

    // Draw Table Headers
    const headers = ["Item Name", "Orders", "Revenue"];
    doc.font("Helvetica-Bold").fontSize(10);
    headers.forEach((header, i) => {
      doc.text(header, colX[i], tableTop, { width: colWidths[i], align: "left" });
    });

    let y = doc.y + 5;
    doc.moveTo(30, y).lineTo(565, y).stroke();
    y += 10;

    // Table Rows
    doc.font("Helvetica").fontSize(9);
    // Take up to 10
    const topItems = items.mostPopular.slice(0, 10);
    topItems.forEach((item) => {
      const rowTop = y;
      let maxRowHeight = 0;

      const rowData = [
        item.name || "Unknown",
        item.totalOrders.toString(),
        `Rs. ${item.totalRevenue.toFixed(2)}`
      ];

      rowData.forEach((text, i) => {
        const height = doc.heightOfString(text, { width: colWidths[i] });
        doc.text(text, colX[i], rowTop, { width: colWidths[i] });
        if (height > maxRowHeight) maxRowHeight = height;
      });

      y += maxRowHeight + 8;
      doc.moveTo(30, y - 4).lineTo(565, y - 4).strokeColor("#eeeeee").stroke();
      doc.strokeColor("#000000"); // Reset stroke color
    });
    
    doc.moveDown(2);
  }

  // Draw Revenue Timeline
  const { revenue } = analyticsData;
  if (revenue && revenue.length > 0) {
    // Ensure we start on doc.y after moving down
    doc.y = Math.max(doc.y, doc.y + 10);
    // Check page break
    if (doc.y > 650) {
      doc.addPage();
    }
    
    doc.fontSize(14).font("Helvetica-Bold").text("Revenue Timeline").moveDown(0.5);

    const tableTop = doc.y;
    const colWidths = [150, 100, 150];
    const colX = [30, 180, 280];

    const headers = ["Date / Period", "Orders", "Revenue"];
    doc.font("Helvetica-Bold").fontSize(10);
    headers.forEach((header, i) => {
      doc.text(header, colX[i], tableTop, { width: colWidths[i], align: "left" });
    });

    let y = doc.y + 5;
    doc.moveTo(30, y).lineTo(565, y).stroke();
    y += 10;

    doc.font("Helvetica").fontSize(9);
    revenue.forEach((r) => {
      if (y > 750) {
        doc.addPage();
        y = 30;
        doc.font("Helvetica-Bold").fontSize(10);
        headers.forEach((header, i) => {
          doc.text(header, colX[i], y, { width: colWidths[i], align: "left" });
        });
        y = doc.y + 5;
        doc.moveTo(30, y).lineTo(565, y).stroke();
        y += 10;
        doc.font("Helvetica").fontSize(9);
      }

      const rowTop = y;
      let maxRowHeight = 0;

      const rowData = [
        r.date || "Unknown",
        (r.orders || 0).toString(),
        `Rs. ${(r.revenue || 0).toFixed(2)}`
      ];

      rowData.forEach((text, i) => {
        const height = doc.heightOfString(text, { width: colWidths[i] });
        doc.text(text, colX[i], rowTop, { width: colWidths[i] });
        if (height > maxRowHeight) maxRowHeight = height;
      });

      y += maxRowHeight + 5;
      doc.moveTo(30, y - 2).lineTo(565, y - 2).strokeColor("#eeeeee").stroke();
      doc.strokeColor("#000000"); // Reset stroke color
    });
  }

  // Footer for all pages
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    addFooter(doc);
  }

  doc.end();
};

module.exports = {
  generateOrdersReportPDF,
  generateRevenueReportPDF
};
