import PDFDocument from 'pdfkit';

/**
 * Generates a structured PDF document from a note summary object.
 * Pipes the resulting binary stream directly into the Express response object.
 * 
 * @param {Object} summary - Mongoose Summary document
 * @param {Object} res - Express Response object
 */
export const generateSummaryPDF = (summary, res) => {
  const doc = new PDFDocument({
    size: 'A4',
    margins: {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50
    }
  });

  // Pipe the document directly into response stream
  doc.pipe(res);

  // Document Branding Header (printed on every page)
  doc.fontSize(8)
     .fillColor('#64748b')
     .text('STUDYBUDDY - AI-POWERED STUDY COMPANION', 50, 30, { align: 'left' });
  
  doc.moveTo(50, 42)
     .lineTo(545, 42)
     .strokeColor('#cbd5e1')
     .lineWidth(1)
     .stroke();

  // Document Title
  doc.moveDown(1.5);
  doc.fontSize(22)
     .fillColor('#0f172a')
     .text(summary.title, { align: 'left', width: 495 });

  doc.fontSize(9)
     .fillColor('#64748b')
     .text(`Compiled on: ${new Date(summary.createdAt).toLocaleDateString('en-US')}`, { align: 'left' });

  doc.moveDown(1);
  
  // Section 1: Study Outline
  doc.fontSize(14)
     .fillColor('#4f46e5') // Brand Indigo
     .text('1. Core Study Outline', { underline: true })
     .moveDown(0.8);

  const summaryLines = (summary.summaryText || '').split('\n');
  
  summaryLines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      doc.moveDown(0.3);
      return;
    }

    // Parse Markdown headers
    const headerMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const text = headerMatch[2].replace(/\*\*/g, ''); // strip bold marks
      
      doc.moveDown(0.5);
      if (level === 1 || level === 2) {
        doc.fontSize(12)
           .fillColor('#1e293b')
           .text(text, { oblique: false });
      } else {
        doc.fontSize(11)
           .fillColor('#4f46e5')
           .text(text);
      }
      doc.moveDown(0.4);
      return;
    }

    // Parse Bullet Points
    const bulletMatch = trimmed.match(/^(\*|-)\s+(.*)$/);
    if (bulletMatch) {
      const text = bulletMatch[2].replace(/\*\*/g, '');
      doc.fontSize(10)
         .fillColor('#334155')
         .text(`\u2022  ${text}`, { indent: 15 })
         .moveDown(0.3);
      return;
    }

    // Parse Numbered Lists
    const listMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (listMatch) {
      const num = listMatch[1];
      const text = listMatch[2].replace(/\*\*/g, '');
      doc.fontSize(10)
         .fillColor('#334155')
         .text(`${num}.  ${text}`, { indent: 15 })
         .moveDown(0.3);
      return;
    }

    // Default Paragraph Line
    const cleanText = trimmed.replace(/\*\*/g, '');
    doc.fontSize(10)
       .fillColor('#334155')
       .text(cleanText, { align: 'justify' })
       .moveDown(0.4);
  });

  // Section 2: Exam Scenarios
  if (summary.scenarios && Array.isArray(summary.scenarios) && summary.scenarios.length > 0) {
    doc.addPage();
    
    // Header for new page
    doc.fontSize(8)
       .fillColor('#64748b')
       .text('STUDYBUDDY - AI-POWERED STUDY COMPANION', 50, 30, { align: 'left' });
    
    doc.moveTo(50, 42)
       .lineTo(545, 42)
       .strokeColor('#cbd5e1')
       .lineWidth(1)
       .stroke();

    doc.moveDown(1.5);
    doc.fontSize(14)
       .fillColor('#4f46e5')
       .text('2. Exam Scenario Questions', { underline: true })
       .moveDown(1);

    summary.scenarios.forEach((sc, index) => {
      // Avoid page-break in the middle of a scenario card if possible
      const spaceLeft = doc.page.height - doc.y - doc.page.margins.bottom;
      if (spaceLeft < 150) {
        doc.addPage();
        
        // Brand header on the fresh page
        doc.fontSize(8)
           .fillColor('#64748b')
           .text('STUDYBUDDY - AI-POWERED STUDY COMPANION', 50, 30, { align: 'left' });
        
        doc.moveTo(50, 42)
           .lineTo(545, 42)
           .strokeColor('#cbd5e1')
           .lineWidth(1)
           .stroke();

        doc.moveDown(1.5);
      }

      // Render Scenario Title
      doc.fontSize(11)
         .fillColor('#4f46e5')
         .text(`Scenario Question ${index + 1}`, { underline: false })
         .moveDown(0.3);

      // Render Context description (indented, grey italic)
      const cleanScenario = sc.scenario ? sc.scenario.replace(/\*\*/g, '') : '';
      doc.fontSize(9)
         .fillColor('#64748b')
         .text(`"${cleanScenario}"`, { oblique: true, indent: 10 })
         .moveDown(0.4);

      // Render Question
      const cleanQuestion = sc.question ? sc.question.replace(/\*\*/g, '') : '';
      doc.fontSize(10)
         .fillColor('#0f172a')
         .text(`Question: ${cleanQuestion}`, { indent: 10 })
         .moveDown(0.4);

      // Render Solution/Answer
      const cleanAnswer = sc.answer ? sc.answer.replace(/\*\*/g, '') : '';
      doc.fontSize(10)
         .fillColor('#10b981') // Green
         .text(`Solution: ${cleanAnswer}`, { indent: 10 })
         .moveDown(0.4);

      // Render Explanation
      const cleanExplanation = sc.explanation ? sc.explanation.replace(/\*\*/g, '') : '';
      doc.fontSize(9.5)
         .fillColor('#334155')
         .text(`Explanation: ${cleanExplanation}`, { indent: 10, align: 'justify' })
         .moveDown(1.2);
    });
  }

  // End / Finalize the PDF Document
  doc.end();
};
