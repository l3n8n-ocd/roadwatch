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
    'longitude', 'injury_information', 'vehicles_involved', 'reporter', 'reporter_email', 'assigned_officer', 'official_remarks',
    'description', 'date_submitted'];
  return Buffer.from(new Parser({ fields }).parse(rows));
}

async function pdfBuffer(where) {
  const rows = await exportRows(where);
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.fontSize(18).text('RoadWatch - Accident Report Summary', { align: 'center' }).moveDown(0.5);
    doc.fontSize(9).text(`Generated: ${new Date().toISOString()}   Reports: ${rows.length}`, { align: 'center' }).moveDown();
    rows.forEach((r) => {
      if (doc.y > 700) doc.addPage();
      doc.fontSize(10).text(`#${r.report_id} | ${r.status} | ${r.record_type === 'verified_record' ? 'VERIFIED RECORD' : 'Public submission'} | ${r.accident_type}`);
      doc.fontSize(8).text(`${r.accident_date} ${r.accident_time} - ${r.location}`);
      doc.text(`Injuries: ${r.injury_information} | Reporter: ${r.reporter || 'n/a'} | Officer: ${r.assigned_officer || 'Unassigned'}`);
      doc.text(String(r.description).slice(0, 400)).moveDown(0.7);
    });
    doc.end();
  });
}

module.exports = { csvBuffer, pdfBuffer };
