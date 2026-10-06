import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { SECTOR_SALARY_TRENDS, PARISH_SALARY_BENCHMARKS, SECTOR_COMPENSATION_GUIDE } from '../data/salaryData';
import { JobListing, JobApplication } from '../types';

export interface PdfReportOptions {
  adminName: string;
  jobs: JobListing[];
  applications: JobApplication[];
  includeTrendsChart?: boolean;
  includeDistributionChart?: boolean;
  includeDetailedTables?: boolean;
  notes?: string;
}

export const generateSalaryPdfReport = async (options: PdfReportOptions): Promise<void> => {
  const {
    adminName,
    jobs,
    applications,
    includeTrendsChart = true,
    includeDistributionChart = true,
    includeDetailedTables = true,
    notes = '',
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  // Helper: Draw Header Bar
  const drawPageHeader = (pageNumber: number, totalPagesText: string = '3') => {
    // Top primary banner
    doc.setFillColor(0, 107, 77); // Emerald 800 (#006b4d)
    doc.rect(0, 0, pageWidth, 18, 'F');

    // Accent line
    doc.setFillColor(200, 150, 29); // Amber Gold
    doc.rect(0, 18, pageWidth, 1.5, 'F');

    // Header Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('COMMONWEALTH OF DOMINICA · MINISTRY OF LABOUR & EMPLOYMENT', margin, 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(220, 252, 231);
    doc.text('Nature Island Careers · National Labour Exchange Division · info@natureislecareers.com', margin, 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`Page ${pageNumber} of ${totalPagesText}`, pageWidth - margin, 11, { align: 'right' });

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Official Dominican Labour Registry Report · Authenticated Administrator: ${adminName} · ${dateStr} ${timeStr}`,
      margin,
      pageHeight - 6
    );
    doc.text('CONFIDENTIAL & ACCREDITED GOV.DM EXCHANGE DATA', pageWidth - margin, pageHeight - 6, {
      align: 'right',
    });
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 9, pageWidth - margin, pageHeight - 9);
  };

  // ==========================================
  // PAGE 1: Executive Overview & Trends Chart
  // ==========================================
  drawPageHeader(1);

  let curY = 25;

  // Title Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('National Labour Market & Sector Salary Trend Report', margin, curY);

  curY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Comprehensive compensation benchmarks, 6-month sector salary trends, and parish distribution analytics.',
    margin,
    curY
  );

  curY += 7;
  // Report Meta Strip
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, curY, contentWidth, 12, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`REPORT ID: DOM-LAB-2026-Q3`, margin + 3, curY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`REPORT PERIOD: April 2026 – September 2026 (6 Months)`, margin + 55, curY + 5);
  doc.text(`CURRENCY: Eastern Caribbean Dollar (XCD / EC$)`, margin + 130, curY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 107, 77);
  doc.text(`AUTHENTICATED BY: ${adminName}`, margin + 3, curY + 9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`GENERATED: ${dateStr} at ${timeStr} AST`, margin + 130, curY + 9.5);

  curY += 16;

  // 4 Top Metric Cards
  const cardW = (contentWidth - 9) / 4;
  const cardH = 15;

  const metrics = [
    { label: 'ACTIVE ISLAND VACANCIES', val: `${jobs.length} Positions`, sub: 'All 10 Parishes & Remote' },
    { label: 'MEDIAN MONTHLY WAGE', val: 'EC$5,840', sub: 'Dominican Private & Public' },
    { label: 'TOP 6-MO SALARY GROWTH', val: '+16.1% Clean Energy', sub: 'Geothermal & SCADA Grid' },
    { label: 'NEP SUBSIDIZED ROLES', val: `${jobs.filter((j) => j.isNepApproved).length} Programs`, sub: 'Ministry of Labour Partner' },
  ];

  metrics.forEach((m, idx) => {
    const cardX = margin + idx * (cardW + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, curY, cardW, cardH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, cardX + 2.5, curY + 3.5);

    doc.setFontSize(9.5);
    doc.setTextColor(0, 107, 77);
    doc.text(m.val, cardX + 2.5, curY + 8.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text(m.sub, cardX + 2.5, curY + 12.5);
  });

  curY += 19;

  // Section Heading: 6-Month Sector Salary Trends
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Six-Month Average Salary Trends Across Dominican Sectors', margin, curY);

  curY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Monthly salary trajectory (EC$ / month) tracked across verified vacancies. Demonstrates clean energy & digital leadership.',
    margin,
    curY
  );

  curY += 5;

  // Capture Trends Chart Image if available in DOM
  let chartCaptured = false;
  if (includeTrendsChart) {
    try {
      const chartEl = document.getElementById('d3-salary-trends-card');
      if (chartEl) {
        const canvas = await html2canvas(chartEl, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });
        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * contentWidth) / canvas.width;
        const targetHeight = Math.min(105, imgHeight);

        doc.addImage(imgData, 'PNG', margin, curY, contentWidth, targetHeight);
        curY += targetHeight + 5;
        chartCaptured = true;
      }
    } catch (e) {
      console.warn('Could not snapshot trends chart to canvas, generating table instead:', e);
    }
  }

  // Fallback / Compact summary table if chart wasn't captured or space permits
  if (!chartCaptured) {
    const tableTop = curY;
    const colW = contentWidth / 7;
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, tableTop, contentWidth, 6, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Industry Sector', margin + 2, tableTop + 4);
    doc.text('Apr 2026', margin + colW * 1.5, tableTop + 4);
    doc.text('Jun 2026', margin + colW * 2.7, tableTop + 4);
    doc.text('Aug 2026', margin + colW * 3.9, tableTop + 4);
    doc.text('Sep 2026', margin + colW * 5.1, tableTop + 4);
    doc.text('6-Mo Trend', margin + colW * 6.1, tableTop + 4);

    let rowY = tableTop + 6;
    SECTOR_SALARY_TRENDS.slice(0, 7).forEach((s, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, rowY, contentWidth, 5, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(15, 23, 42);
      doc.text(s.sector, margin + 2, rowY + 3.5);
      doc.text(`EC$${s.data[0].avgSalary}`, margin + colW * 1.5, rowY + 3.5);
      doc.text(`EC$${s.data[2].avgSalary}`, margin + colW * 2.7, rowY + 3.5);
      doc.text(`EC$${s.data[4].avgSalary}`, margin + colW * 3.9, rowY + 3.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`EC$${s.data[5].avgSalary}`, margin + colW * 5.1, rowY + 3.5);

      const pct = (((s.data[5].avgSalary - s.data[0].avgSalary) / s.data[0].avgSalary) * 100).toFixed(1);
      doc.setTextColor(0, 107, 77);
      doc.text(`+${pct}%`, margin + colW * 6.1, rowY + 3.5);

      rowY += 5;
    });

    curY = rowY + 4;
  }

  // Executive Insights callout box
  if (curY < pageHeight - 35) {
    doc.setFillColor(240, 253, 244); // emerald-50
    doc.setDrawColor(187, 247, 208);
    const boxH = Math.min(22, pageHeight - curY - 14);
    doc.roundedRect(margin, curY, contentWidth, boxH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(6, 95, 70);
    doc.text('DOMINICA LABOUR MARKET INTELLIGENCE TAKEAWAY:', margin + 3, curY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(15, 23, 42);
    const summaryLines = doc.splitTextToSize(
      'Renewable Energy & Geothermal maintains the highest average compensation (EC$8,650/mo) fueled by high-voltage grid interconnection in the Roseau Valley. Hospitality and Eco-Tourism compensation expanded +14.5% during the dry season peak, while remote IT assignment opportunities grew across all 10 parishes.',
      contentWidth - 6
    );
    doc.text(summaryLines, margin + 3, curY + 8.5);
  }

  // ==========================================
  // PAGE 2: Parish Distribution & Benchmarks
  // ==========================================
  doc.addPage();
  drawPageHeader(2);

  curY = 25;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Regional Compensation Distribution Across Dominica Parishes', margin, curY);

  curY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Statistical spread including Minimum, Median, Maximum, and Cost-of-Living index for all 10 parishes and remote assignments.',
    margin,
    curY
  );

  curY += 5;

  // Capture Parish Distribution Chart if available in DOM
  let distCaptured = false;
  if (includeDistributionChart) {
    try {
      const distEl = document.getElementById('d3-parish-distribution-card');
      if (distEl) {
        const canvas = await html2canvas(distEl, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });
        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * contentWidth) / canvas.width;
        const targetHeight = Math.min(115, imgHeight);

        doc.addImage(imgData, 'PNG', margin, curY, contentWidth, targetHeight);
        curY += targetHeight + 6;
        distCaptured = true;
      }
    } catch (e) {
      console.warn('Could not snapshot parish distribution chart to canvas, generating table instead:', e);
    }
  }

  // If distribution chart was not captured or for supplementary data:
  if (!distCaptured) {
    const tableTop = curY;
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, tableTop, contentWidth, 6, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Parish / Region', margin + 2, tableTop + 4);
    doc.text('Min Wage', margin + 45, tableTop + 4);
    doc.text('Median Rate', margin + 75, tableTop + 4);
    doc.text('Max Ceiling', margin + 105, tableTop + 4);
    doc.text('Top Sector', margin + 135, tableTop + 4);
    doc.text('Cost Index', margin + 168, tableTop + 4);

    let rowY = tableTop + 6;
    PARISH_SALARY_BENCHMARKS.forEach((p, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, rowY, contentWidth, 5, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(15, 23, 42);
      doc.text(p.parish, margin + 2, rowY + 3.5);
      doc.text(`EC$${p.minSalary.toLocaleString()}`, margin + 45, rowY + 3.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 107, 77);
      doc.text(`EC$${p.medianSalary.toLocaleString()}`, margin + 75, rowY + 3.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(`EC$${p.maxSalary.toLocaleString()}`, margin + 105, rowY + 3.5);
      doc.text(p.topSector, margin + 135, rowY + 3.5);
      doc.text(`${p.costOfLivingIndex}`, margin + 168, rowY + 3.5);

      rowY += 5;
    });

    curY = rowY + 6;
  }

  // Recommended Employer Compensation Brackets
  if (curY < pageHeight - 65) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Employer Competitive Salary Recommendations (By Seniority)', margin, curY);

    curY += 5;

    // Mini Table of Sector Seniority Guidelines
    const guideTop = curY;
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, guideTop, contentWidth, 6, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Key Dominican Industry', margin + 2, guideTop + 4);
    doc.text('Entry / NEP Trainee', margin + 55, guideTop + 4);
    doc.text('Mid-Level Professional', margin + 98, guideTop + 4);
    doc.text('Senior / Executive Lead', margin + 140, guideTop + 4);

    let gY = guideTop + 6;
    SECTOR_COMPENSATION_GUIDE.slice(0, 5).forEach((g, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, gY, contentWidth, 5, 'F');
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(15, 23, 42);
      doc.text(g.sector, margin + 2, gY + 3.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`EC$${g.entryLevel.min} - $${g.entryLevel.max}`, margin + 55, gY + 3.5);
      doc.text(`EC$${g.midLevel.min} - $${g.midLevel.max}`, margin + 98, gY + 3.5);
      doc.text(`EC$${g.seniorLevel.min} - $${g.seniorLevel.max}`, margin + 140, gY + 3.5);

      gY += 5;
    });

    curY = gY + 4;
  }

  // ==========================================
  // PAGE 3: Comprehensive Tables & Official Stamp
  // ==========================================
  if (includeDetailedTables) {
    doc.addPage();
    drawPageHeader(3);

    curY = 25;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('3. Detailed Six-Month Sector Trajectory & Regional Audit Matrix', margin, curY);

    curY += 6;

    // Full 9 Sectors × 6 Months Complete Table
    const tTop = curY;
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, tTop, contentWidth, 6, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(30, 41, 59);
    doc.text('Dominican Job Sector', margin + 2, tTop + 4);
    doc.text('Apr 26', margin + 52, tTop + 4);
    doc.text('May 26', margin + 70, tTop + 4);
    doc.text('Jun 26', margin + 88, tTop + 4);
    doc.text('Jul 26', margin + 106, tTop + 4);
    doc.text('Aug 26', margin + 124, tTop + 4);
    doc.text('Sep 26', margin + 142, tTop + 4);
    doc.text('6-Mo Diff', margin + 162, tTop + 4);

    let tY = tTop + 6;
    SECTOR_SALARY_TRENDS.forEach((sec, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, tY, contentWidth, 5.5, 'F');
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(15, 23, 42);
      doc.text(sec.sector, margin + 2, tY + 3.8);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`EC$${sec.data[0].avgSalary}`, margin + 52, tY + 3.8);
      doc.text(`EC$${sec.data[1].avgSalary}`, margin + 70, tY + 3.8);
      doc.text(`EC$${sec.data[2].avgSalary}`, margin + 88, tY + 3.8);
      doc.text(`EC$${sec.data[3].avgSalary}`, margin + 106, tY + 3.8);
      doc.text(`EC$${sec.data[4].avgSalary}`, margin + 124, tY + 3.8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 107, 77);
      doc.text(`EC$${sec.data[5].avgSalary}`, margin + 142, tY + 3.8);

      const diff = sec.data[5].avgSalary - sec.data[0].avgSalary;
      const pct = ((diff / sec.data[0].avgSalary) * 100).toFixed(1);
      doc.text(`+${pct}%`, margin + 162, tY + 3.8);

      tY += 5.5;
    });

    curY = tY + 8;

    // Full 11 Parishes Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Complete Parish Compensation & Sample Size Breakdown', margin, curY);

    curY += 5;

    const pTop = curY;
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, pTop, contentWidth, 6, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(30, 41, 59);
    doc.text('Parish / Area', margin + 2, pTop + 4);
    doc.text('Minimum (XCD)', margin + 42, pTop + 4);
    doc.text('25th Percentile (Q1)', margin + 70, pTop + 4);
    doc.text('Median Rate', margin + 102, pTop + 4);
    doc.text('75th Percentile (Q3)', margin + 126, pTop + 4);
    doc.text('Max Salary', margin + 155, pTop + 4);
    doc.text('Cost Index', margin + 172, pTop + 4);

    let pY = pTop + 6;
    PARISH_SALARY_BENCHMARKS.forEach((parish, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, pY, contentWidth, 4.8, 'F');
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(15, 23, 42);
      doc.text(parish.parish, margin + 2, pY + 3.2);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`EC$${parish.minSalary.toLocaleString()}`, margin + 42, pY + 3.2);
      doc.text(`EC$${parish.q1Salary.toLocaleString()}`, margin + 70, pY + 3.2);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 107, 77);
      doc.text(`EC$${parish.medianSalary.toLocaleString()}`, margin + 102, pY + 3.2);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`EC$${parish.q3Salary.toLocaleString()}`, margin + 126, pY + 3.2);
      doc.text(`EC$${parish.maxSalary.toLocaleString()}`, margin + 155, pY + 3.2);
      doc.text(`${parish.costOfLivingIndex}`, margin + 172, pY + 3.2);

      pY += 4.8;
    });

    curY = pY + 8;

    // Optional Custom Notes if user provided any
    if (notes && curY < pageHeight - 45) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Administrative Notes & Instructions:', margin, curY);
      curY += 4;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.8);
      doc.setTextColor(71, 85, 105);
      const customLines = doc.splitTextToSize(notes, contentWidth);
      doc.text(customLines, margin, curY);
      curY += customLines.length * 3.5 + 4;
    }

    // Official Labour Directorate Certification Box
    if (curY < pageHeight - 35) {
      const certBoxH = pageHeight - curY - 14;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, curY, contentWidth, certBoxH, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text('OFFICIAL REGISTRY CERTIFICATION & STATUTORY COMPLIANCE', margin + 4, curY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.text(
        'This document is generated directly from the Nature Isle Careers official labor exchange database registry, compliant with the Dominica Labour Standards Act and Eastern Caribbean Central Bank (ECCB) regional reporting standards.',
        margin + 4,
        curY + 9.5
      );

      // Signature Stamp Representation
      doc.setDrawColor(0, 107, 77);
      doc.rect(pageWidth - margin - 50, curY + 3, 46, certBoxH - 6);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(0, 107, 77);
      doc.text('MINISTRY OF LABOUR', pageWidth - margin - 27, curY + 7, { align: 'center' });
      doc.text('OFFICIALLY CERTIFIED', pageWidth - margin - 27, curY + 11, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5);
      doc.setTextColor(100, 116, 139);
      doc.text(`AUDIT REF: DLD-${Date.now().toString().slice(-6)}`, pageWidth - margin - 27, curY + 15, { align: 'center' });
    }
  }

  // Save the PDF file
  const fileName = `Dominica_Salary_and_Sector_Trends_Report_${now.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
