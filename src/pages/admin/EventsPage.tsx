import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { supabase } from '../../lib/supabaseClient';
import type { Event } from '../../types';

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<(Event & { attendance_count: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTimeStart, setFormTimeStart] = useState('');
  const [formTimeEnd, setFormTimeEnd] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // QR Code & Shortlink Modal state
  const [qrModalEvent, setQrModalEvent] = useState<Event | null>(null);
  const [qrModalDataUrl, setQrModalDataUrl] = useState('');
  const [qrModalIsNew, setQrModalIsNew] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: attendances } = await supabase.from('attendances').select('event_id');

      const eventsWithCount = (eventsData || []).map((evt) => ({
        ...evt,
        attendance_count: attendances?.filter((a) => a.event_id === evt.id).length || 0,
      }));

      setEvents(eventsWithCount);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const resolveEventSlug = (event: Event) => {
    if (event.slug && event.slug.trim()) return event.slug.trim();
    const stored = localStorage.getItem(`pln_slug_${event.id}`);
    if (stored && stored.trim()) return stored.trim();
    const fromTitle = slugify(event.title || '');
    if (fromTitle) return fromTitle;
    return event.id ? event.id.replace(/-/g, '').slice(0, 8) : 'presensi';
  };

  const getEventShortlink = (event: Event) => {
    const baseUrl = (import.meta.env.VITE_APP_URL as string) || window.location.origin;
    const slug = resolveEventSlug(event);
    return `${baseUrl}/p/${slug}`;
  };

  const generateQrCode = async (url: string) => {
    return await QRCode.toDataURL(url, {
      width: 800,
      margin: 2,
      color: {
        dark: '#004e5a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });
  };

  const openQrModal = async (event: Event, isNew = false) => {
    const slug = resolveEventSlug(event);
    localStorage.setItem(`pln_slug_${event.id}`, slug);
    localStorage.setItem(`pln_id_by_slug_${slug}`, event.id);

    const link = getEventShortlink(event);
    try {
      const qrData = await generateQrCode(link);
      setQrModalEvent(event);
      setQrModalDataUrl(qrData);
      setQrModalIsNew(isNew);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  const downloadQrCode = (event: Event, dataUrl: string) => {
    const slug = resolveEventSlug(event);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `QR-Presensi-${slug}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const escapeHtml = (str?: string | null) => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const printQrPoster = (event: Event, qrDataUrl: string) => {
    const link = getEventShortlink(event);
    const safeTitle = escapeHtml(event.title);
    const safeLocation = escapeHtml(event.location);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Poster Presensi - ${safeTitle}</title>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            text-align: center;
            color: #171c20;
            padding: 20px;
            background: #ffffff;
          }
          .header {
            border-bottom: 3px solid #006574;
            padding-bottom: 16px;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
          }
          .logo { height: 48px; }
          .inst { font-size: 14px; font-weight: 700; color: #006574; text-transform: uppercase; letter-spacing: 0.5px; }
          .unit { font-size: 16px; font-weight: 800; color: #171c20; }
          .badge-presensi {
            background: #e6f4f6;
            color: #006574;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 1px;
            display: inline-block;
            padding: 6px 18px;
            border-radius: 20px;
            margin-bottom: 12px;
          }
          .title { font-size: 26px; font-weight: 800; color: #006574; margin: 10px 0; line-height: 1.3; }
          .meta-box {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 20px;
            background: #f8fafc;
            padding: 10px 24px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            font-size: 15px;
            color: #334155;
            margin-bottom: 25px;
          }
          .qr-wrapper {
            position: relative;
            display: inline-block;
            padding: 20px;
            border: 2px solid #008093;
            border-radius: 24px;
            background: #ffffff;
            box-shadow: 0 10px 30px rgba(0,101,116,0.12);
            margin-bottom: 20px;
          }
          .qr-img { width: 330px; height: 330px; display: block; border-radius: 12px; }
          .instruction { font-size: 18px; font-weight: 800; color: #171c20; margin-bottom: 6px; }
          .sub-instruction { font-size: 14px; color: #64748b; margin-bottom: 16px; }
          .shortlink-box {
            display: inline-block;
            background: #f0fdfa;
            border: 1.5px dashed #008093;
            padding: 10px 24px;
            border-radius: 30px;
            font-size: 16px;
            font-weight: 800;
            color: #006574;
            margin-top: 10px;
            letter-spacing: 0.3px;
          }
          .footer {
            margin-top: 40px;
            font-size: 12px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/logo-pln-ip.png" class="logo" alt="Logo PLN IP" onerror="this.style.display='none'" />
          <div>
            <div class="inst">PT PLN INDONESIA POWER</div>
            <div class="unit">UBP CILEGON</div>
          </div>
        </div>
        <div class="badge-presensi">DAFTAR HADIR DIGITAL</div>
        <h1 class="title">${safeTitle}</h1>
        <div class="meta-box">
          <div><strong>Tanggal:</strong> ${new Date(event.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
          ${event.time_start ? `<div>•</div><div><strong>Waktu:</strong> ${event.time_start.slice(0, 5)} WIB</div>` : ''}
          ${safeLocation ? `<div>•</div><div><strong>Tempat:</strong> ${safeLocation}</div>` : ''}
        </div>
        <div class="qr-wrapper">
          <img src="${qrDataUrl}" class="qr-img" alt="QR Code Presensi" />
        </div>
        <div class="instruction">Arahkan Kamera HP Anda ke QR Code di Atas</div>
        <div class="sub-instruction">Buka kamera atau pemindai QR untuk langsung mengisi presensi dan tanda tangan digital.</div>
        <div>
          <div class="shortlink-box">${link}</div>
        </div>
        <div class="footer">
          Sistem Informasi Presensi Digital &copy; 2026 PT PLN Indonesia Power UBP Cilegon
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  const openCreateModal = () => {
    setEditEvent(null);
    setFormTitle('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormTimeStart('09:00');
    setFormTimeEnd('12:00');
    setFormLocation('Ruang Rapat Integritas Lantai 2');
    setFormDescription('');
    setFormSlug('');
    setIsSlugCustomized(false);
    setShowModal(true);
  };

  const openEditModal = (event: Event) => {
    setEditEvent(event);
    setFormTitle(event.title);
    setFormDate(event.date);
    setFormTimeStart(event.time_start || '');
    setFormTimeEnd(event.time_end || '');
    setFormLocation(event.location || '');
    setFormDescription(event.description || '');
    setFormSlug(event.slug || slugify(event.title));
    setIsSlugCustomized(true);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate) return;

    setFormSubmitting(true);
    try {
      const cleanSlug = formSlug.trim() ? slugify(formSlug.trim()) : slugify(formTitle.trim());
      const eventData: Record<string, unknown> = {
        title: formTitle.trim(),
        date: formDate,
        time_start: formTimeStart || null,
        time_end: formTimeEnd || null,
        location: formLocation.trim() || null,
        description: formDescription.trim() || null,
        slug: cleanSlug || null,
      };

      if (editEvent) {
        const { error } = await supabase
          .from('events')
          .update({ ...eventData, updated_at: new Date().toISOString() })
          .eq('id', editEvent.id);

        if (error) {
          // Fallback if slug column not yet added
          if (error.message?.includes('slug')) {
            delete eventData.slug;
            const { error: retryErr } = await supabase
              .from('events')
              .update({ ...eventData, updated_at: new Date().toISOString() })
              .eq('id', editEvent.id);
            if (retryErr) throw retryErr;
          } else {
            throw error;
          }
        }
        setShowModal(false);
        fetchEvents();
      } else {
        let createdRecord: Event | null = null;
        const { data, error } = await supabase
          .from('events')
          .insert(eventData)
          .select('*')
          .single();

        if (error) {
          // Fallback if slug column not yet added
          if (error.message?.includes('slug')) {
            delete eventData.slug;
            const { data: retryData, error: retryErr } = await supabase
              .from('events')
              .insert(eventData)
              .select('*')
              .single();
            if (retryErr) throw retryErr;
            createdRecord = retryData;
          } else {
            throw error;
          }
        } else {
          createdRecord = data;
        }

        setShowModal(false);
        await fetchEvents();

        // Immediately show QR Code & Shortlink Wizard Modal for newly generated event
        if (createdRecord) {
          openQrModal(createdRecord, true);
        }
      }
    } catch (err) {
      console.error('Error saving event:', err);
      alert('Gagal menyimpan kegiatan. Pastikan koneksi Supabase Anda aktif.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const toggleActive = async (event: Event) => {
    if (togglingId === event.id) return;
    setTogglingId(event.id);
    const nextActive = !event.is_active;
    try {
      const { error } = await supabase
        .from('events')
        .update({ is_active: nextActive, updated_at: new Date().toISOString() })
        .eq('id', event.id);
      if (error) throw error;
      setEvents((prev) =>
        prev.map((item) => (item.id === event.id ? { ...item, is_active: nextActive } : item))
      );
    } catch (err) {
      console.error('Error toggling event:', err);
      alert('Gagal mengubah status kegiatan.');
    } finally {
      setTogglingId(null);
    }
  };

  const deleteEvent = async (event: Event) => {
    if (!confirm(`Hapus kegiatan "${event.title}"? Semua data kehadiran terkait juga akan dihapus.`)) return;

    try {
      const { error } = await supabase.from('events').delete().eq('id', event.id);
      if (error) throw error;
      fetchEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  };

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    (e.location || '').toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="font-headline-sm" style={{ color: '#171c20', margin: '0 0 4px', fontSize: '24px' }}>
            Kelola Kegiatan
          </h1>
          <p className="font-body-sm" style={{ color: '#3d494b', margin: 0 }}>
            Buat dan atur kegiatan presensi untuk PLN Indonesia Power UBP Cilegon
          </p>
        </div>
        <button
          className="neu-raised"
          onClick={openCreateModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            backgroundColor: '#008093',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '13px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0, 128, 147, 0.3)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            add
          </span>
          Buat Kegiatan Baru
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ maxWidth: '340px' }}>
        <div style={{ position: 'relative' }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6d797c',
              fontSize: '20px',
            }}
          >
            search
          </span>
          <input
            type="text"
            className="pln-input neu-inset"
            placeholder="Cari kegiatan atau lokasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
        </div>
      </div>

      {/* Events Table Container */}
      <div
        className="neu-raised"
        style={{
          borderRadius: '16px',
          backgroundColor: '#f6faff',
          border: '1px solid rgba(189, 201, 204, 0.4)',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="neu-inset" style={{ height: '52px', borderRadius: '8px' }} />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
            <div
              className="neu-inset"
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                margin: '0 auto 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6d797c',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
                event_busy
              </span>
            </div>
            <h3 className="font-title-md" style={{ color: '#171c20', margin: '0 0 6px' }}>
              {search ? 'Kegiatan Tidak Ditemukan' : 'Belum Ada Kegiatan'}
            </h3>
            <p className="font-body-sm" style={{ color: '#3d494b', margin: '0 0 1rem', maxWidth: '380px', marginInline: 'auto' }}>
              {search ? 'Coba ubah kata kunci pencarian Anda.' : 'Klik "Buat Kegiatan Baru" untuk menambahkan agenda presensi.'}
            </p>
            {!search && (
              <button
                className="neu-raised-sm"
                onClick={openCreateModal}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  backgroundColor: '#008093',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Buat Kegiatan
              </button>
            )}
          </div>
        ) : (
          <div className="data-table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kegiatan</th>
                  <th>Tanggal</th>
                  <th>Tempat</th>
                  <th>Status</th>
                  <th>Peserta</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <span style={{ fontWeight: 600, color: '#171c20', fontSize: '14px' }}>
                        {event.title}
                      </span>
                    </td>
                    <td style={{ color: '#3d494b' }}>{formatDate(event.date)}</td>
                    <td style={{ color: '#3d494b' }}>{event.location || '-'}</td>
                    <td>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={event.is_active}
                        aria-label={`Ubah status ${event.title} menjadi ${event.is_active ? 'Tidak Aktif' : 'Aktif'}`}
                        title={event.is_active ? 'Klik untuk menonaktifkan' : 'Klik untuk mengaktifkan'}
                        disabled={togglingId === event.id}
                        onClick={() => toggleActive(event)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '2px 4px',
                          border: 'none',
                          background: 'transparent',
                          cursor: togglingId === event.id ? 'wait' : 'pointer',
                          opacity: togglingId === event.id ? 0.65 : 1,
                        }}
                      >
                        <span
                          style={{
                            position: 'relative',
                            display: 'inline-flex',
                            alignItems: 'center',
                            width: '38px',
                            height: '22px',
                            borderRadius: '9999px',
                            backgroundColor: event.is_active ? '#16a34a' : '#cbd5e1',
                            transition: 'background-color 0.2s ease',
                            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.18)',
                            flexShrink: 0,
                          }}
                        >
                          <span
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              backgroundColor: '#ffffff',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
                              transform: event.is_active ? 'translateX(19px)' : 'translateX(3px)',
                              transition: 'transform 0.2s ease',
                            }}
                          />
                        </span>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: event.is_active ? '#16a34a' : '#64748b',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {event.is_active ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </button>
                    </td>
                    <td>
                      <Link
                        to={`/admin/attendance/${event.id}`}
                        className="neu-inset"
                        style={{
                          display: 'inline-flex',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          color: '#006574',
                          fontSize: '11px',
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                      >
                        {event.attendance_count} orang
                      </Link>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <Link
                          to={`/admin/attendance/${event.id}`}
                          className="neu-raised-sm"
                          title="Lihat Daftar Hadir"
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#006574',
                            backgroundColor: '#f6faff',
                            textDecoration: 'none',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                            visibility
                          </span>
                        </Link>
                        <button
                          className="neu-raised-sm"
                          onClick={() => openQrModal(event, false)}
                          title="QR Code & Shortlink Presensi"
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#008093',
                            backgroundColor: '#f6faff',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                            qr_code_2
                          </span>
                        </button>
                        <button
                          className="neu-raised-sm"
                          onClick={() => openEditModal(event)}
                          title="Edit Kegiatan"
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#3d494b',
                            backgroundColor: '#f6faff',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                            edit
                          </span>
                        </button>
                        <button
                          className="neu-raised-sm"
                          onClick={() => deleteEvent(event)}
                          title="Hapus Kegiatan"
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#dc2626',
                            backgroundColor: '#f6faff',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Buat / Edit Kegiatan */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-content neu-raised"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '620px',
              width: '100%',
              backgroundColor: '#f6faff',
              borderRadius: '16px',
              padding: '2rem',
              border: '1px solid rgba(189, 201, 204, 0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: '#006574', fontSize: '24px' }}>
                  {editEvent ? 'edit_calendar' : 'calendar_add_on'}
                </span>
                <h3 className="font-headline-sm" style={{ margin: 0, fontSize: '18px', color: '#171c20' }}>
                  {editEvent ? 'Edit Kegiatan' : 'Buat Kegiatan Baru'}
                </h3>
              </div>
              <button
                className="neu-raised-sm"
                onClick={() => setShowModal(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6d797c',
                  backgroundColor: '#f6faff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  close
                </span>
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="evt-title" style={{ color: '#171c20', fontWeight: 600 }}>
                  Nama Kegiatan / Agenda <span className="required">*</span>
                </label>
                <input
                  id="evt-title"
                  type="text"
                  className="pln-input neu-inset"
                  placeholder="Contoh: Rapat Koordinasi K3 & Lingkungan"
                  value={formTitle}
                  onChange={(e) => {
                    setFormTitle(e.target.value);
                    if (!isSlugCustomized) {
                      setFormSlug(slugify(e.target.value));
                    }
                  }}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" htmlFor="evt-slug" style={{ color: '#171c20', fontWeight: 600, margin: 0 }}>
                    Shortlink Kustom (Slug URL)
                  </label>
                  <span style={{ fontSize: '11px', color: '#006574', fontWeight: 600 }}>
                    Tautan Singkat & Ramah
                  </span>
                </div>
                <div
                  className="neu-inset"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#f0f4f9',
                    borderRadius: '10px',
                    padding: '0 12px',
                    border: '1px solid rgba(189, 201, 204, 0.4)',
                  }}
                >
                  <span style={{ fontSize: '13px', color: '#6d797c', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {((import.meta.env.VITE_APP_URL as string) || window.location.origin)}/p/
                  </span>
                  <input
                    id="evt-slug"
                    type="text"
                    className="pln-input"
                    placeholder="nama-kegiatan-kustom"
                    value={formSlug}
                    onChange={(e) => {
                      setIsSlugCustomized(true);
                      setFormSlug(slugify(e.target.value));
                    }}
                    style={{
                      border: 'none',
                      backgroundColor: 'transparent',
                      padding: '10px 4px',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#006574',
                      boxShadow: 'none',
                      flex: 1,
                    }}
                  />
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#6d797c' }}>
                  Peserta dapat mengakses link ini atau scan QR code yang otomatis ter-generate setelah disimpan.
                </p>
              </div>

              <div className="grid grid-2 gap-4">
                <div className="form-group">
                  <label className="form-label" htmlFor="evt-date" style={{ color: '#171c20', fontWeight: 600 }}>
                    Tanggal <span className="required">*</span>
                  </label>
                  <input
                    id="evt-date"
                    type="date"
                    className="pln-input neu-inset"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="evt-location" style={{ color: '#171c20', fontWeight: 600 }}>
                    Tempat / Ruangan
                  </label>
                  <input
                    id="evt-location"
                    type="text"
                    className="pln-input neu-inset"
                    placeholder="Contoh: Ruang Rapat Integritas Lantai 2"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-2 gap-4">
                <div className="form-group">
                  <label className="form-label" htmlFor="evt-time-start" style={{ color: '#171c20', fontWeight: 600 }}>
                    Waktu Mulai
                  </label>
                  <input
                    id="evt-time-start"
                    type="time"
                    className="pln-input neu-inset"
                    value={formTimeStart}
                    onChange={(e) => setFormTimeStart(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="evt-time-end" style={{ color: '#171c20', fontWeight: 600 }}>
                    Waktu Selesai
                  </label>
                  <input
                    id="evt-time-end"
                    type="time"
                    className="pln-input neu-inset"
                    value={formTimeEnd}
                    onChange={(e) => setFormTimeEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="evt-desc" style={{ color: '#171c20', fontWeight: 600 }}>
                  Deskripsi / Keterangan (Opsional)
                </label>
                <textarea
                  id="evt-desc"
                  className="pln-input neu-inset"
                  placeholder="Keterangan agenda rapat atau kegiatan..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  style={{ minHeight: '80px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="neu-raised-sm"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    backgroundColor: '#f6faff',
                    color: '#3d494b',
                    fontSize: '13px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="neu-raised"
                  disabled={formSubmitting}
                  style={{
                    padding: '8px 22px',
                    borderRadius: '8px',
                    backgroundColor: '#008093',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0, 128, 147, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {formSubmitting ? (
                    <>
                      <div className="spinner spinner-sm" style={{ borderTopColor: '#ffffff' }} />
                      Menyimpan...
                    </>
                  ) : editEvent ? (
                    'Simpan Perubahan'
                  ) : (
                    'Buat Kegiatan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL QR CODE & SHORTLINK WIZARD
          ============================================================ */}
      {qrModalEvent && qrModalDataUrl && (
        <div className="modal-overlay" onClick={() => setQrModalEvent(null)} style={{ zIndex: 1000 }}>
          <div
            className="modal-content neu-raised"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '560px',
              width: '100%',
              backgroundColor: '#f6faff',
              borderRadius: '24px',
              padding: '2.25rem 2rem',
              border: '1px solid rgba(189, 201, 204, 0.45)',
              boxShadow: '-12px -12px 30px #ffffff, 12px 12px 30px rgba(163, 177, 198, 0.45), 0 20px 45px rgba(0, 101, 116, 0.15)',
              animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {/* Header / Banner */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 14px',
                  borderRadius: '20px',
                  backgroundColor: qrModalIsNew ? 'rgba(22, 163, 74, 0.12)' : 'rgba(0, 101, 116, 0.12)',
                  color: qrModalIsNew ? '#16a34a' : '#006574',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  marginBottom: '8px',
                  border: qrModalIsNew ? '1px solid rgba(22, 163, 74, 0.25)' : '1px solid rgba(0, 101, 116, 0.25)',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    {qrModalIsNew ? 'verified' : 'qr_code_scanner'}
                  </span>
                  {qrModalIsNew ? 'KEGIATAN BERHASIL DIGENERATE' : 'AKSES PRESENSI & QR CODE'}
                </div>
                <h3 className="font-headline-sm" style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#171c20' }}>
                  {qrModalIsNew ? 'QR Code & Shortlink Siap Digunakan' : qrModalEvent.title}
                </h3>
              </div>
              <button
                className="neu-raised-sm"
                onClick={() => setQrModalEvent(null)}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6d797c',
                  backgroundColor: '#f6faff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  close
                </span>
              </button>
            </div>

            {/* Event Summary */}
            <div
              className="neu-inset"
              style={{
                backgroundColor: '#edf3f9',
                borderRadius: '14px',
                padding: '11px 16px',
                marginBottom: '1.5rem',
                border: '1px solid rgba(189, 201, 204, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '17px', color: '#006574' }}>
                  event_available
                </span>
                <span style={{ fontWeight: 700, color: '#171c20', fontSize: '13px' }}>
                  {qrModalEvent.title}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', color: '#3d494b', fontWeight: 600 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#006574' }}>
                    calendar_month
                  </span>
                  {formatDate(qrModalEvent.date)}
                </div>
                {qrModalEvent.time_start && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', color: '#3d494b', fontWeight: 600 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#008093' }}>
                      schedule
                    </span>
                    {qrModalEvent.time_start.slice(0, 5)} WIB
                  </div>
                )}
              </div>
            </div>

            {/* QR Code Center Display with Modern Viewfinder Frame */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  padding: '18px',
                  borderRadius: '24px',
                  backgroundColor: '#ffffff',
                  boxShadow: '-8px -8px 24px #ffffff, 8px 8px 24px rgba(163, 177, 198, 0.45), 0 12px 28px rgba(0, 101, 116, 0.12)',
                  border: '1px solid rgba(189, 201, 204, 0.4)',
                }}
              >
                {/* Modern Viewfinder Corners */}
                <div style={{ position: 'absolute', top: '10px', left: '10px', width: '22px', height: '22px', borderTop: '3px solid #008093', borderLeft: '3px solid #008093', borderTopLeftRadius: '8px' }} />
                <div style={{ position: 'absolute', top: '10px', right: '10px', width: '22px', height: '22px', borderTop: '3px solid #008093', borderRight: '3px solid #008093', borderTopRightRadius: '8px' }} />
                <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '22px', height: '22px', borderBottom: '3px solid #008093', borderLeft: '3px solid #008093', borderBottomLeftRadius: '8px' }} />
                <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '22px', height: '22px', borderBottom: '3px solid #008093', borderRight: '3px solid #008093', borderBottomRightRadius: '8px' }} />

                <img
                  src={qrModalDataUrl}
                  alt={`QR Code Presensi - ${qrModalEvent.title}`}
                  style={{
                    width: '220px',
                    height: '220px',
                    display: 'block',
                    borderRadius: '12px',
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', margin: '12px 0 0', fontSize: '12.5px', color: '#006574', fontWeight: 600 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '17px', color: '#008093' }}>
                  center_focus_strong
                </span>
                <span>Scan dengan kamera smartphone untuk presensi langsung</span>
              </div>
            </div>

            {/* Custom Shortlink Box */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700, color: '#171c20' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#008093' }}>
                    alternate_email
                  </span>
                  Tautan Singkat (Shortlink):
                </span>
                {copiedToast && (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>check_circle</span>
                    Tautan berhasil disalin!
                  </span>
                )}
              </div>
              <div
                className="neu-inset"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#f0f4f9',
                  borderRadius: '14px',
                  padding: '8px 12px',
                  border: '1px solid rgba(189, 201, 204, 0.45)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#006574' }}>
                  link
                </span>
                <input
                  type="text"
                  readOnly
                  value={getEventShortlink(qrModalEvent)}
                  style={{
                    flex: 1,
                    border: 'none',
                    backgroundColor: 'transparent',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#006574',
                    outline: 'none',
                    letterSpacing: '0.2px',
                  }}
                />
                <button
                  type="button"
                  className="neu-raised-sm"
                  onClick={() => copyToClipboard(getEventShortlink(qrModalEvent))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#f6faff',
                    color: '#006574',
                    fontSize: '12px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    content_copy
                  </span>
                  Salin
                </button>
                <a
                  href={getEventShortlink(qrModalEvent)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neu-raised-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    backgroundColor: '#f6faff',
                    color: '#3d494b',
                    fontSize: '12px',
                    textDecoration: 'none',
                  }}
                  title="Buka di tab baru"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    arrow_outward
                  </span>
                </a>
              </div>
            </div>

            {/* Action Buttons: Download PNG, Print Poster */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={() => downloadQrCode(qrModalEvent, qrModalDataUrl)}
                className="neu-raised"
                style={{
                  padding: '11px 16px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #008093 0%, #006574 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0, 101, 116, 0.3)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>
                  download_for_offline
                </span>
                Unduh QR (PNG)
              </button>

              <button
                type="button"
                onClick={() => printQrPoster(qrModalEvent, qrModalDataUrl)}
                className="neu-raised"
                style={{
                  padding: '11px 16px',
                  borderRadius: '12px',
                  backgroundColor: '#f6faff',
                  color: '#006574',
                  border: '1px solid rgba(189, 201, 204, 0.4)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '-2px -2px 6px #ffffff, 2px 2px 6px rgba(163, 177, 198, 0.35)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>
                  local_printshop
                </span>
                Cetak Poster QR
              </button>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(189, 201, 204, 0.3)' }}>
              <Link
                to={`/admin/attendance/${qrModalEvent.id}`}
                className="neu-raised-sm"
                onClick={() => setQrModalEvent(null)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  color: '#006574',
                  backgroundColor: '#f6faff',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  how_to_reg
                </span>
                Buka Rekap Kehadiran
              </Link>

              <button
                type="button"
                onClick={() => setQrModalEvent(null)}
                className="neu-raised-sm"
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  backgroundColor: '#f6faff',
                  color: '#3d494b',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
