import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  WidthType,
  TextRun,
  AlignmentType,
  BorderStyle,
  PageOrientation,
  Header,
  Footer,
  ImageRun,
  VerticalAlign,
  HeightRule,
  TableLayoutType,
} from 'docx';
import { saveAs } from 'file-saver';
import type { Event, Attendance } from '../types';

// Fetch image as ArrayBuffer
async function fetchImageAsArrayBuffer(url: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.arrayBuffer();
  } catch {
    return null;
  }
}

// Convert data URL to ArrayBuffer
function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

const BORDER_STYLE = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: '000000',
};

const CELL_BORDERS = {
  top: BORDER_STYLE,
  bottom: BORDER_STYLE,
  left: BORDER_STYLE,
  right: BORDER_STYLE,
};

// Exact column widths from original CLG.17.3.2 DAFTAR HADIR template
const HEADER_WIDTHS = {
  total: 15210,
  col1_logo: 2970,
  col2_title: 9540,
  col3_doc: 2700,
};

const DATA_TABLE_WIDTHS = {
  total: 15210,
  no: 540,
  name: 3060,
  position: 2970,
  email: 3510,
  phone: 2970,
  signature: 2160,
};

export async function exportToDocx(event: Event, attendances: Attendance[]) {
  // Try to load logo (use logo-pln-ip.png first, fallback to image1.png)
  let logoData: ArrayBuffer | null = null;
  try {
    let response = await fetch('/logo-pln-ip.png');
    if (!response.ok) {
      response = await fetch('/image1.png');
    }
    if (response.ok) {
      logoData = await response.arrayBuffer();
    }
  } catch {
    // Logo not available
  }

  // Format date
  const dateObj = new Date(event.date);
  const dateStr = dateObj.toLocaleDateString('id-ID', {
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

  // ===== Build Header Table (100% matching original CLG.17.3.2 template) =====
  const headerCells1 = [
    // Column 1: Logo PLN IP (horizontal aspect ratio 4.45)
    new TableCell({
      children: logoData
        ? [
            new Paragraph({
              children: [
                new ImageRun({
                  data: logoData,
                  transformation: { width: 175, height: 48 },
                  type: 'png',
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 0, line: 240 },
            }),
          ]
        : [new Paragraph({ text: '' })],
      rowSpan: 4,
      verticalAlign: VerticalAlign.CENTER,
      width: { size: HEADER_WIDTHS.col1_logo, type: WidthType.DXA },
      borders: CELL_BORDERS,
    }),
    // Column 2: PT PLN INDONESIA POWER CILEGON POWER GENERATION UNIT
    new TableCell({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: 'PT PLN INDONESIA POWER CILEGON POWER GENERATION UNIT',
              bold: true,
              size: 20,
              font: 'Arial',
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      ],
      verticalAlign: VerticalAlign.CENTER,
      width: { size: HEADER_WIDTHS.col2_title, type: WidthType.DXA },
      borders: CELL_BORDERS,
    }),
    // Column 3: No. Dokumen
    new TableCell({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: ' No. Dokumen : CLG.13.03.01.02',
              bold: true,
              size: 16,
              font: 'Arial',
            }),
          ],
        }),
      ],
      verticalAlign: VerticalAlign.CENTER,
      width: { size: HEADER_WIDTHS.col3_doc, type: WidthType.DXA },
      borders: CELL_BORDERS,
    }),
  ];

  const headerCells2 = [
    // Column 2: INDONESIA POWER INTEGRATED MANAGEMENT SYSTEM
    new TableCell({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: 'INDONESIA POWER ',
              bold: true,
              size: 20,
              font: 'Arial',
            }),
            new TextRun({
              text: 'INTEGRATED MANAGEMENT SYSTEM',
              bold: true,
              italics: true,
              size: 20,
              font: 'Arial',
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      ],
      verticalAlign: VerticalAlign.CENTER,
      width: { size: HEADER_WIDTHS.col2_title, type: WidthType.DXA },
      borders: CELL_BORDERS,
    }),
    // Column 3: Tgl Terbit
    new TableCell({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: ' Tgl Terbit        : 26 Juni 2023',
              bold: true,
              size: 16,
              font: 'Arial',
            }),
          ],
        }),
      ],
      verticalAlign: VerticalAlign.CENTER,
      width: { size: HEADER_WIDTHS.col3_doc, type: WidthType.DXA },
      borders: CELL_BORDERS,
    }),
  ];

  const headerCells3 = [
    // Column 2: FORM DAFTAR HADIR
    new TableCell({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: 'FORM DAFTAR HADIR',
              bold: true,
              size: 20,
              font: 'Arial',
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      ],
      verticalAlign: VerticalAlign.CENTER,
      width: { size: HEADER_WIDTHS.col2_title, type: WidthType.DXA },
      borders: CELL_BORDERS,
    }),
    // Column 3: Revisi
    new TableCell({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: ' Revisi              : 03',
              bold: true,
              size: 16,
              font: 'Arial',
            }),
          ],
        }),
      ],
      verticalAlign: VerticalAlign.CENTER,
      width: { size: HEADER_WIDTHS.col3_doc, type: WidthType.DXA },
      borders: CELL_BORDERS,
    }),
  ];

  const headerCells4 = [
    // Column 2: UMUM
    new TableCell({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: 'UMUM',
              bold: true,
              size: 20,
              font: 'Arial',
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      ],
      verticalAlign: VerticalAlign.CENTER,
      width: { size: HEADER_WIDTHS.col2_title, type: WidthType.DXA },
      borders: CELL_BORDERS,
    }),
    // Column 3: Halaman
    new TableCell({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: ' Halaman          : -',
              size: 16,
              font: 'Arial',
            }),
          ],
        }),
      ],
      verticalAlign: VerticalAlign.CENTER,
      width: { size: HEADER_WIDTHS.col3_doc, type: WidthType.DXA },
      borders: CELL_BORDERS,
    }),
  ];

  const headerTable = new Table({
    rows: [
      new TableRow({ children: headerCells1, height: { value: 286, rule: HeightRule.ATLEAST } }),
      new TableRow({ children: headerCells2, height: { value: 291, rule: HeightRule.ATLEAST } }),
      new TableRow({ children: headerCells3, height: { value: 280, rule: HeightRule.ATLEAST } }),
      new TableRow({ children: headerCells4, height: { value: 131, rule: HeightRule.ATLEAST } }),
    ],
    width: { size: HEADER_WIDTHS.total, type: WidthType.DXA },
    columnWidths: [HEADER_WIDTHS.col1_logo, HEADER_WIDTHS.col2_title, HEADER_WIDTHS.col3_doc],
    alignment: AlignmentType.CENTER,
    layout: TableLayoutType.FIXED,
  });

  // ===== Build Main Body =====
  // Title
  const titleParagraph = new Paragraph({
    children: [
      new TextRun({ text: 'DAFTAR HADIR ', bold: true, size: 28, font: 'Arial' }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  });

  const emptyLine = new Paragraph({ text: '', spacing: { after: 100 } });

  // Metadata fields
  const metaFields = [
    { label: 'HARI/TANGGAL', value: dateStr },
    { label: 'PUKUL', value: timeStr },
    { label: 'TEMPAT', value: event.location || '-' },
    { label: 'AGENDA', value: event.title },
  ];

  const metaParagraphs = metaFields.map(
    (field) =>
      new Paragraph({
        children: [
          new TextRun({ text: `${field.label}\t: ${field.value}`, size: 20, font: 'Arial' }),
        ],
        spacing: { after: 40 },
        tabStops: [{ type: 'left' as const, position: 2000 }],
      })
  );

  // ===== Build Data Table =====
  // Header row
  const tableHeaderRow = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'No', bold: true, size: 18, font: 'Arial' })], alignment: AlignmentType.CENTER })],
        verticalAlign: VerticalAlign.CENTER,
        borders: CELL_BORDERS,
        width: { size: DATA_TABLE_WIDTHS.no, type: WidthType.DXA },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'NAMA', bold: true, size: 18, font: 'Arial' })], alignment: AlignmentType.CENTER })],
        verticalAlign: VerticalAlign.CENTER,
        borders: CELL_BORDERS,
        width: { size: DATA_TABLE_WIDTHS.name, type: WidthType.DXA },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'JABATAN/INSTANSI', bold: true, size: 18, font: 'Arial' })], alignment: AlignmentType.CENTER })],
        verticalAlign: VerticalAlign.CENTER,
        borders: CELL_BORDERS,
        width: { size: DATA_TABLE_WIDTHS.position, type: WidthType.DXA },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'ALAMAT EMAIL', bold: true, size: 18, font: 'Arial' })], alignment: AlignmentType.CENTER })],
        verticalAlign: VerticalAlign.CENTER,
        borders: CELL_BORDERS,
        width: { size: DATA_TABLE_WIDTHS.email, type: WidthType.DXA },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'NO. TELP', bold: true, size: 18, font: 'Arial' })], alignment: AlignmentType.CENTER })],
        verticalAlign: VerticalAlign.CENTER,
        borders: CELL_BORDERS,
        width: { size: DATA_TABLE_WIDTHS.phone, type: WidthType.DXA },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'TTD', bold: true, size: 18, font: 'Arial' })], alignment: AlignmentType.CENTER })],
        verticalAlign: VerticalAlign.CENTER,
        borders: CELL_BORDERS,
        width: { size: DATA_TABLE_WIDTHS.signature, type: WidthType.DXA },
      }),
    ],
    height: { value: 400, rule: HeightRule.ATLEAST },
  });

  // Data rows with signatures
  const dataRows: TableRow[] = [];
  for (let i = 0; i < attendances.length; i++) {
    const att = attendances[i];

    // Try to get signature image
    let signatureChildren: (TextRun | ImageRun)[] = [];
    if (att.signature_url) {
      try {
        let sigData: ArrayBuffer | null = null;
        if (att.signature_url.startsWith('data:')) {
          sigData = dataUrlToArrayBuffer(att.signature_url);
        } else {
          sigData = await fetchImageAsArrayBuffer(att.signature_url);
        }
        if (sigData) {
          signatureChildren = [
            new ImageRun({
              data: sigData,
              transformation: { width: 80, height: 40 },
              type: 'png',
            }),
          ];
        }
      } catch {
        // Signature image not available
      }
    }

    dataRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: String(i + 1), size: 18, font: 'Arial' })], alignment: AlignmentType.CENTER })],
            verticalAlign: VerticalAlign.CENTER,
            borders: CELL_BORDERS,
            width: { size: DATA_TABLE_WIDTHS.no, type: WidthType.DXA },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: att.name, size: 18, font: 'Arial' })] })],
            verticalAlign: VerticalAlign.CENTER,
            borders: CELL_BORDERS,
            width: { size: DATA_TABLE_WIDTHS.name, type: WidthType.DXA },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: att.position || '', size: 18, font: 'Arial' })] })],
            verticalAlign: VerticalAlign.CENTER,
            borders: CELL_BORDERS,
            width: { size: DATA_TABLE_WIDTHS.position, type: WidthType.DXA },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: att.email || '', size: 18, font: 'Arial' })] })],
            verticalAlign: VerticalAlign.CENTER,
            borders: CELL_BORDERS,
            width: { size: DATA_TABLE_WIDTHS.email, type: WidthType.DXA },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: att.phone || '', size: 18, font: 'Arial' })] })],
            verticalAlign: VerticalAlign.CENTER,
            borders: CELL_BORDERS,
            width: { size: DATA_TABLE_WIDTHS.phone, type: WidthType.DXA },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: signatureChildren.length > 0 ? signatureChildren : [new TextRun({ text: '', size: 18 })],
                alignment: AlignmentType.CENTER,
              }),
            ],
            verticalAlign: VerticalAlign.CENTER,
            borders: CELL_BORDERS,
            width: { size: DATA_TABLE_WIDTHS.signature, type: WidthType.DXA },
          }),
        ],
        height: { value: 500, rule: HeightRule.ATLEAST },
      })
    );
  }

  // Add empty rows to fill up to at least 20 rows (matching template style)
  const minRows = Math.max(20, attendances.length);
  for (let i = attendances.length; i < minRows; i++) {
    dataRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: '' })], borders: CELL_BORDERS, width: { size: DATA_TABLE_WIDTHS.no, type: WidthType.DXA } }),
          new TableCell({ children: [new Paragraph({ text: '' })], borders: CELL_BORDERS, width: { size: DATA_TABLE_WIDTHS.name, type: WidthType.DXA } }),
          new TableCell({ children: [new Paragraph({ text: '' })], borders: CELL_BORDERS, width: { size: DATA_TABLE_WIDTHS.position, type: WidthType.DXA } }),
          new TableCell({ children: [new Paragraph({ text: '' })], borders: CELL_BORDERS, width: { size: DATA_TABLE_WIDTHS.email, type: WidthType.DXA } }),
          new TableCell({ children: [new Paragraph({ text: '' })], borders: CELL_BORDERS, width: { size: DATA_TABLE_WIDTHS.phone, type: WidthType.DXA } }),
          new TableCell({ children: [new Paragraph({ text: '' })], borders: CELL_BORDERS, width: { size: DATA_TABLE_WIDTHS.signature, type: WidthType.DXA } }),
        ],
        height: { value: 400, rule: HeightRule.ATLEAST },
      })
    );
  }

  const dataTable = new Table({
    rows: [tableHeaderRow, ...dataRows],
    width: { size: DATA_TABLE_WIDTHS.total, type: WidthType.DXA },
    columnWidths: [
      DATA_TABLE_WIDTHS.no,
      DATA_TABLE_WIDTHS.name,
      DATA_TABLE_WIDTHS.position,
      DATA_TABLE_WIDTHS.email,
      DATA_TABLE_WIDTHS.phone,
      DATA_TABLE_WIDTHS.signature,
    ],
    alignment: AlignmentType.CENTER,
    layout: TableLayoutType.FIXED,
  });

  // ===== Footer =====
  const footerParagraph = new Paragraph({
    children: [
      new TextRun({
        text: 'INTEGRASI SISTEM MANAJEMEN MUTU, SISTEM MANAJEMEN K3 & SISTEM MANAJEMEN LINGKUNGAN',
        size: 14,
        font: 'Arial',
        italics: true,
      }),
    ],
  });

  // ===== Build Document =====
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
            },
            margin: {
              top: 1500,
              bottom: 1000,
              left: 814,
              right: 814,
              header: 360,
              footer: 200,
            },
          },
        },
        headers: {
          default: new Header({
            children: [headerTable],
          }),
        },
        footers: {
          default: new Footer({
            children: [footerParagraph],
          }),
        },
        children: [
          titleParagraph,
          emptyLine,
          ...metaParagraphs,
          new Paragraph({ text: '', spacing: { after: 200 } }),
          dataTable,
        ],
      },
    ],
  });

  // Generate and download
  const blob = await Packer.toBlob(doc);
  const fileName = `Daftar_Hadir_${event.title.replace(/\s+/g, '_')}_${event.date}.docx`;
  saveAs(blob, fileName);
}
