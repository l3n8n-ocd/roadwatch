const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');
const { Report, User, AccidentType } = require('../models');

async function exportRows(where) {
  const reports = await Report.findAll({
    where,
    include: [
      { model: User, as: 'reporter', attributes: ['full_name', 'contact_email'] },
      { model: User, as: 'assignedOfficer', attributes: ['full_name'] },
      { model: AccidentType, as: 'accidentType', attributes: ['type_name'] },
    ],
    order: [['date_submitted', 'DESC']],
  });
  return reports.map((r) => ({
    report_id: r.report_id,
    record_type: r.record_type,
    status: r.report_status,
    accident_type: r.accidentType?.type_name || '',
    accident_date: r.accident_date,
    accident_time: r.accident_time,
    location: r.accident_location,
    latitude: r.latitude ?? '',
    longitude: r.longitude ?? '',
    injury_information: r.injury_information,
    priority: r.priority,
    vehicles_involved: r.vehicles_involved || '',
    reporter: r.reporter?.full_name || '',
    reporter_email: r.reporter?.contact_email || '',
    assigned_officer: r.assignedOfficer?.full_name || '',
    official_remarks: r.official_remarks || '',
    description: r.accident_description,
    date_submitted: r.date_submitted instanceof Date ? r.date_submitted.toISOString() : r.date_submitted,
  }));
}

// Stops spreadsheet formula injection: cells that start with = + - @ are prefixed with an apostrophe.
const safeCell = (v) => (typeof v === 'string' && /^[=+\-@\t\r]/.test(v) ? `'${v}` : v);

async function csvBuffer(where) {
  const rows = (await exportRows(where)).map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, safeCell(v)])));
  const fields = ['report_id', 'record_type', 'status', 'accident_type', 'accident_date', 'accident_time', 'location', 'latitude',
    'longitude', 'injury_information', 'priority', 'vehicles_involved', 'reporter', 'reporter_email', 'assigned_officer', 'official_remarks',
    'description', 'date_submitted'];
  return Buffer.from(new Parser({ fields }).parse(rows));
}

// PDF layout (issue #42): landscape A4, title block, then a table with a navy header row that repeats on every
// page, wrapped cells, zebra rows and "Page X of Y". Description, remarks and contact details stay in the CSV.
const NAVY = '#0B2545';
const MUTED = '#5B6B80';
const ZEBRA = '#F4F6F9';
const RULE = '#C9D2DE';
const PDF_COLUMNS = [
  { label: 'Report', width: 58, value: (r) => `RW-${String(r.report_id).padStart(6, '0')}` },
  { label: 'Date and time', width: 78, value: (r) => `${r.accident_date} ${String(r.accident_time || '').slice(0, 5)}` },
  { label: 'Type', width: 80, value: (r) => r.accident_type },
  { label: 'Location', width: 130, value: (r) => r.location },
  { label: 'Injuries', width: 58, value: (r) => r.injury_information.charAt(0).toUpperCase() + r.injury_information.slice(1) },
  { label: 'Priority', width: 52, value: (r) => r.priority },
  { label: 'Status', width: 92, value: (r) => r.status },
  { label: 'Record', width: 78, value: (r) => (r.record_type === 'verified_record' ? 'Verified record' : 'Public submission') },
  { label: 'Reporter', width: 70, value: (r) => r.reporter || '-' },
  { label: 'Officer', width: 74, value: (r) => r.assigned_officer || 'Unassigned' },
];
const PAD = 4;

// "status: Verified, date_from: 2026-10-01" for the title block; paging keys are left out.
function describeFilters(filters = {}) {
  const parts = Object.entries(filters)
    .filter(([key, value]) => value !== undefined && value !== '' && key !== 'page' && key !== 'limit')
    .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`);
  return parts.length ? parts.join(', ') : 'none (all reports)';
}

async function pdfBuffer(where, filters) {
  const rows = await exportRows(where);
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36, bufferPages: true });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const left = doc.page.margins.left;
    const tableWidth = PDF_COLUMNS.reduce((sum, c) => sum + c.width, 0);
    const bottom = () => doc.page.height - doc.page.margins.bottom - 14; // room for the page number

    const generated = new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' });
    const verified = rows.filter((r) => r.record_type === 'verified_record').length;
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(16).text('RoadWatch - Accident Report Summary', left, doc.y);
    doc.font('Helvetica').fontSize(9).fillColor(MUTED)
      .text(`Generated ${generated} (Philippine time)   |   Filters: ${describeFilters(filters)}`)
      .text(`${rows.length} ${rows.length === 1 ? 'report' : 'reports'}: ${verified} verified records, ${rows.length - verified} public submissions`)
      .moveDown(0.6);

    const rowHeight = (cells, font) => {
      doc.font(font).fontSize(8);
      return Math.max(...cells.map((text, i) => doc.heightOfString(text, { width: PDF_COLUMNS[i].width - PAD * 2 }))) + PAD * 2;
    };
    const drawRow = (cells, { header = false, zebra = false } = {}) => {
      const font = header ? 'Helvetica-Bold' : 'Helvetica';
      const h = rowHeight(cells, font);
      const y = doc.y;
      if (header || zebra) doc.rect(left, y, tableWidth, h).fill(header ? NAVY : ZEBRA);
      let x = left;
      cells.forEach((text, i) => {
        doc.font(font).fontSize(8).fillColor(header ? '#FFFFFF' : NAVY)
          .text(text, x + PAD, y + PAD, { width: PDF_COLUMNS[i].width - PAD * 2 });
        x += PDF_COLUMNS[i].width;
      });
      doc.moveTo(left, y + h).lineTo(left + tableWidth, y + h).lineWidth(0.5).strokeColor(RULE).stroke();
      doc.x = left;
      doc.y = y + h;
    };
    const headerCells = PDF_COLUMNS.map((c) => c.label);

    drawRow(headerCells, { header: true });
    if (!rows.length) {
      doc.font('Helvetica').fontSize(9).fillColor(MUTED).text('No reports match these filters.', left, doc.y + 8);
    }
    rows.forEach((r, i) => {
      const cells = PDF_COLUMNS.map((c) => String(c.value(r) ?? ''));
      if (doc.y + rowHeight(cells, 'Helvetica') > bottom()) {
        doc.addPage();
        drawRow(headerCells, { header: true });
      }
      drawRow(cells, { zebra: i % 2 === 1 });
    });

    // "Page X of Y" in the bottom margin of every page.
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      const marginBottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc.font('Helvetica').fontSize(8).fillColor(MUTED)
        .text(`Page ${i + 1} of ${range.count}`, left, doc.page.height - marginBottom - 10, { width: tableWidth, align: 'right', lineBreak: false });
      doc.page.margins.bottom = marginBottom;
    }
    doc.end();
  });
}

module.exports = { csvBuffer, pdfBuffer };
