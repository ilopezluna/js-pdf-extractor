// Simple script to create a test PDF for testing purposes
const fs = require('fs');
const path = require('path');

// Create a minimal PDF file
// This is a very basic PDF structure that contains text
const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 500
>>
stream
BT
/F1 12 Tf
50 750 Td
(INVOICE) Tj
0 -20 Td
(Invoice Number: INV-2024-001) Tj
0 -20 Td
(Date: January 15, 2024) Tj
0 -40 Td
(Bill To:) Tj
0 -20 Td
(John Doe) Tj
0 -20 Td
(123 Main Street) Tj
0 -20 Td
(New York, NY 10001) Tj
0 -20 Td
(Email: john.doe@example.com) Tj
0 -40 Td
(Items:) Tj
0 -20 Td
(1. Web Development Services - $2,500.00) Tj
0 -20 Td
(2. UI/UX Design - $1,500.00) Tj
0 -20 Td
(3. Consultation Hours \\(10 hrs @ $150/hr\\) - $1,500.00) Tj
0 -40 Td
(Total Amount Due: $5,940.00) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000317 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
868
%%EOF`;

const outputPath = path.join(__dirname, '..', 'tests', 'fixtures', 'sample-invoice.pdf');
fs.writeFileSync(outputPath, pdfContent);
console.log('Test PDF created successfully at:', outputPath);
