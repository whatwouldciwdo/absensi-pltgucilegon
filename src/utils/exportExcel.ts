import * as XLSX from 'xlsx';
import type { Event, Attendance } from '../types';

export function exportToExcel(event: Event, attendances: Attendance[]) {
  // Format date
  const dateStr = new Date(event.date).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Format time
  const timeStr = event.time_start
    ? event.time_end
      ? `${event.time_start.slice(0, 5)} - ${event.time_end.slice(0, 5)} WIB`
      : `${event.time_start.slice(0, 5)} WIB`
    : '-';

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Build sheet data
  const sheetData: (string | number)[][] = [
    ['DAFTAR HADIR'],
    [],
    ['HARI/TANGGAL', dateStr],
    ['PUKUL', timeStr],
    ['TEMPAT', event.location || '-'],
    ['AGENDA', event.title],
    [],
    ['No', 'NAMA', 'JABATAN/INSTANSI', 'ALAMAT EMAIL', 'NO. TELP', 'WAKTU HADIR'],
  ];

  // Add attendance data
  attendances.forEach((att, index) => {
    sheetData.push([
      index + 1,
      att.name,
      att.position || '-',
      att.email || '-',
      att.phone || '-',
      new Date(att.attended_at).toLocaleString('id-ID'),
    ]);
  });

  // Add summary
  sheetData.push([]);
  sheetData.push(['Total Peserta:', attendances.length]);

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Set column widths
  ws['!cols'] = [
    { wch: 5 },   // No
    { wch: 25 },  // Nama
    { wch: 25 },  // Jabatan
    { wch: 30 },  // Email
    { wch: 18 },  // Telp
    { wch: 22 },  // Waktu
  ];

  // Merge title row
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Daftar Hadir');

  // Generate and download
  const fileName = `Daftar_Hadir_${event.title.replace(/\s+/g, '_')}_${event.date}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
