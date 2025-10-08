// Create a proper test PDF using PDFKit
const fs = require('fs');
const path = require('path');

// We'll install PDFKit for creating a proper test PDF
const { execSync } = require('child_process');

try {
  // Install PDFKit temporarily
  console.log('Installing PDFKit...');
  execSync('npm install --no-save pdfkit', { stdio: 'inherit' });

  const PDFDocument = require('pdfkit');
  
  // Create a new PDF document
  const doc = new PDFDocument();
  const outputPath = path.join(__dirname, '..', 'tests', 'fixtures', 'sample-invoice.pdf');
  
  // Pipe to file
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // Add content
  doc.fontSize(20).text('INVOICE', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text('Invoice Number: INV-2024-001');
  doc.text('Date: January 15, 2024');
  doc.moveDown();
  doc.text('Bill To:');
  doc.text('John Doe');
  doc.text('123 Main Street');
  doc.text('New York, NY 10001');
  doc.text('Email: john.doe@example.com');
  doc.moveDown();
  doc.text('Items:');
  doc.text('1. Web Development Services - $2,500.00');
  doc.text('2. UI/UX Design - $1,500.00');
  doc.text('3. Consultation Hours (10 hrs @ $150/hr) - $1,500.00');
  doc.moveDown();
  doc.text('Subtotal: $5,500.00');
  doc.text('Tax (8%): $440.00');
  doc.fontSize(14).text('Total Amount Due: $5,940.00', { underline: true });
  doc.moveDown();
  doc.fontSize(12).text('Payment Terms: Net 30');
  doc.text('Due Date: February 14, 2024');
  doc.moveDown();
  doc.text('Thank you for your business!');

  // Finalize PDF
  doc.end();

  stream.on('finish', () => {
    console.log('Test PDF created successfully at:', outputPath);
    // Clean up PDFKit
    execSync('npm uninstall pdfkit', { stdio: 'inherit' });
  });
} catch (error) {
  console.error('Error creating PDF:', error.message);
  process.exit(1);
}
