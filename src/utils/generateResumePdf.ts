import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface ResumePdfOptions {
  element: HTMLElement;
  fileName: string;
  candidateName: string;
}

export const generateResumePdf = async (options: ResumePdfOptions): Promise<void> => {
  const { element, fileName, candidateName } = options;

  try {
    // Render element to canvas with high resolution
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // Standard A4 dimensions in mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Calculate ratio to fit width
    const ratio = pdfWidth / imgWidth;
    const renderedHeight = imgHeight * ratio;

    if (renderedHeight <= pdfHeight) {
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, renderedHeight, undefined, 'FAST');
    } else {
      // Multi-page slicing if long resume
      let remainingHeight = renderedHeight;
      let position = 0;

      while (remainingHeight > 0) {
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, renderedHeight, undefined, 'FAST');
        remainingHeight -= pdfHeight;
        position -= pdfHeight;

        if (remainingHeight > 0) {
          pdf.addPage();
        }
      }
    }

    const safeName = (fileName || `${candidateName.replace(/\s+/g, '_')}_Dominica_CV.pdf`).replace(/[^\w.-]/gi, '_');
    pdf.save(safeName.endsWith('.pdf') ? safeName : `${safeName}.pdf`);
  } catch (error) {
    console.error('Error generating Resume PDF with html2canvas:', error);
    // Fallback: trigger print
    window.print();
  }
};
