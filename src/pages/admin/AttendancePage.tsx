import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { exportToDocx } from '../../utils/exportDocx';
import { exportToExcel } from '../../utils/exportExcel';
import type { Event, Attendance } from '../../types';

const AttendancePage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState<'docx' | 'excel' | null>(null);

  // Edit modal state
  const [editModal, setEditModal] = useState(false);
  const [editAttendance, setEditAttendance] = useState<Attendance | null>(null);
  const [editName, setEditName] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Signature view modal
  const [signatureModal, setSignatureModal] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      const { data: attendanceData } = await supabase
        .from('attendances')
        .select('*')
        .eq('event_id', eventId)
        .order('attended_at', { ascending: true });

      setEvent(eventData);
      setAttendances(attendanceData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (attendance: Attendance) => {
    setEditAttendance(attendance);
    setEditName(attendance.name);
    setEditPosition(attendance.position || '');
    setEditEmail(attendance.email || '');
    setEditPhone(attendance.phone || '');
    setEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAttendance || !editName.trim()) return;

    setEditSubmitting(true);
    try {
      const { error } = await supabase
        .from('attendances')
        .update({
          name: editName.trim(),
          position: editPosition.trim() || null,
          email: editEmail.trim() || null,
          phone: editPhone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editAttendance.id);

      if (error) throw error;
      setEditModal(false);
      fetchData();
    } catch (err) {
      console.error('Error updating attendance:', err);
      alert('Gagal mengupdate data.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const deleteAttendance = async (attendance: Attendance) => {
    if (!confirm(`Hapus data kehadiran "${attendance.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('attendances')
        .delete()
        .eq('id', attendance.id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error('Error deleting attendance:', err);
    }
  };

  const handleExportDocx = async () => {
    if (!event) return;
    setExporting('docx');
    try {
      await exportToDocx(event, attendances);
    } catch (err) {
      console.error('Error exporting DOCX:', err);
      alert('Gagal mengekspor ke DOCX.');
    } finally {
      setExporting(null);
    }
  };

  const handleExportExcel = async () => {
    if (!event) return;
    setExporting('excel');
    try {
      exportToExcel(event, attendances);
    } catch (err) {
      console.error('Error exporting Excel:', err);
      alert('Gagal mengekspor ke Excel.');
    } finally {
      setExporting(null);
    }
  };

  const filteredAttendances = attendances.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.position || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="neu-inset" style={{ height: '32px', width: '320px', borderRadius: '8px' }} />
        <div className="neu-inset" style={{ height: '24px', width: '200px', borderRadius: '8px' }} />
        <div className="neu-raised" style={{ height: '300px', borderRadius: '16px', marginTop: '1rem' }} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="neu-raised" style={{ padding: '3rem', textAlign: 'center', borderRadius: '16px' }}>
        <h3 className="font-title-md" style={{ color: '#171c20' }}>Kegiatan Tidak Ditemukan</h3>
        <button
          className="neu-raised-sm"
          onClick={() => navigate('/admin/events')}
          style={{
            marginTop: '1rem',
            padding: '8px 18px',
            borderRadius: '8px',
            backgroundColor: '#008093',
            color: '#ffffff',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Kembali ke Daftar Kegiatan
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Breadcrumb & Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          className="neu-raised-sm"
          onClick={() => navigate('/admin/events')}
          title="Kembali"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#006574',
            backgroundColor: '#f6faff',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            arrow_back
          </span>
        </button>
        <Link to="/admin/events" style={{ color: '#3d494b', fontSize: '13px', textDecoration: 'none', fontWeight: 500 }}>
          Kelola Kegiatan
        </Link>
        <span style={{ color: '#6d797c', fontSize: '13px' }}>/</span>
        <span style={{ color: '#171c20', fontSize: '13px', fontWeight: 600 }}>{event.title}</span>
      </div>

      {/* Header Info & Export Buttons */}
      <div
        className="neu-raised"
        style={{
          padding: '1.5rem',
          borderRadius: '16px',
          backgroundColor: '#f6faff',
          border: '1px solid rgba(189, 201, 204, 0.4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        <div>
          <span
            className="neu-inset"
            style={{
              display: 'inline-flex',
              padding: '3px 10px',
              borderRadius: '9999px',
              color: '#006574',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            Daftar Kehadiran
          </span>
          <h1 className="font-headline-sm" style={{ color: '#171c20', margin: '0 0 8px', fontSize: '22px' }}>
            {event.title}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', color: '#3d494b', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ color: '#006574', fontSize: '18px' }}>
                calendar_today
              </span>
              <span>{formatDate(event.date)}</span>
            </div>
            {event.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ color: '#006574', fontSize: '18px' }}>
                  location_on
                </span>
                <span>{event.location}</span>
              </div>
            )}
            <div
              className="neu-inset"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 10px',
                borderRadius: '9999px',
                color: '#006574',
                fontWeight: 700,
                fontSize: '12px',
              }}
            >
              <span>{attendances.length} peserta tercatat</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Export */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="neu-raised"
            onClick={handleExportDocx}
            disabled={exporting !== null || attendances.length === 0}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              backgroundColor: '#006574',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '13px',
              border: 'none',
              cursor: attendances.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(0, 101, 116, 0.3)',
              opacity: attendances.length === 0 ? 0.6 : 1,
            }}
          >
            {exporting === 'docx' ? (
              <>
                <div className="spinner spinner-sm" style={{ borderTopColor: '#ffffff' }} />
                <span>Mengekspor...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  description
                </span>
                <span>Export Word (.docx)</span>
              </>
            )}
          </button>

          <button
            className="neu-raised"
            onClick={handleExportExcel}
            disabled={exporting !== null || attendances.length === 0}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '13px',
              border: 'none',
              cursor: attendances.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)',
              opacity: attendances.length === 0 ? 0.6 : 1,
            }}
          >
            {exporting === 'excel' ? (
              <>
                <div className="spinner spinner-sm" style={{ borderTopColor: '#ffffff' }} />
                <span>Mengekspor...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  table_chart
                </span>
                <span>Export Excel (.xlsx)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Search Filter */}
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
            placeholder="Cari nama, jabatan, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
        </div>
      </div>

      {/* Attendance Table */}
      <div
        className="neu-raised"
        style={{
          borderRadius: '16px',
          backgroundColor: '#f6faff',
          border: '1px solid rgba(189, 201, 204, 0.4)',
          overflow: 'hidden',
        }}
      >
        {filteredAttendances.length === 0 ? (
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
                person_off
              </span>
            </div>
            <h3 className="font-title-md" style={{ color: '#171c20', margin: '0 0 6px' }}>
              {search ? 'Peserta Tidak Ditemukan' : 'Belum Ada Peserta'}
            </h3>
            <p className="font-body-sm" style={{ color: '#3d494b', margin: 0, maxWidth: '400px', marginInline: 'auto' }}>
              {search
                ? 'Coba periksa kembali kata kunci pencarian.'
                : 'Belum ada peserta yang mengisi daftar hadir untuk kegiatan ini. Bagikan tautan kegiatan ke peserta.'}
            </p>
          </div>
        ) : (
          <div className="data-table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>No</th>
                  <th>Nama</th>
                  <th>Jabatan / Instansi</th>
                  <th>Email</th>
                  <th>No. Telp</th>
                  <th>TTD Digital</th>
                  <th>Waktu Hadir</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendances.map((att, index) => (
                  <tr key={att.id}>
                    <td style={{ color: '#6d797c', fontWeight: 600 }}>{index + 1}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#171c20', fontSize: '14px' }}>
                        {att.name}
                      </span>
                    </td>
                    <td style={{ color: '#3d494b' }}>{att.position || '-'}</td>
                    <td style={{ color: '#3d494b' }}>{att.email || '-'}</td>
                    <td style={{ color: '#3d494b' }}>{att.phone || '-'}</td>
                    <td>
                      {att.signature_url ? (
                        <button
                          className="neu-raised-sm"
                          onClick={() => setSignatureModal(att.signature_url)}
                          title="Lihat Tanda Tangan"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            color: '#006574',
                            backgroundColor: '#f6faff',
                            fontSize: '12px',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                            draw
                          </span>
                          <span>Lihat TTD</span>
                        </button>
                      ) : (
                        <span style={{ color: '#6d797c', fontSize: '12px' }}>-</span>
                      )}
                    </td>
                    <td style={{ color: '#3d494b', fontSize: '12px' }}>{formatTime(att.attended_at)} WIB</td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          className="neu-raised-sm"
                          onClick={() => openEditModal(att)}
                          title="Edit Peserta"
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
                          onClick={() => deleteAttendance(att)}
                          title="Hapus Peserta"
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

      {/* Edit Modal */}
      {editModal && editAttendance && (
        <div className="modal-overlay" onClick={() => setEditModal(false)}>
          <div
            className="modal-content neu-raised"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              backgroundColor: '#f6faff',
              borderRadius: '16px',
              padding: '2rem',
              border: '1px solid rgba(189, 201, 204, 0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 className="font-headline-sm" style={{ margin: 0, fontSize: '18px', color: '#171c20' }}>
                Edit Data Kehadiran
              </h3>
              <button
                className="neu-raised-sm"
                onClick={() => setEditModal(false)}
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

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#171c20', fontWeight: 600 }}>
                  Nama Lengkap <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="pln-input neu-inset"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#171c20', fontWeight: 600 }}>
                  Jabatan / Instansi
                </label>
                <input
                  type="text"
                  className="pln-input neu-inset"
                  value={editPosition}
                  onChange={(e) => setEditPosition(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#171c20', fontWeight: 600 }}>
                  Email
                </label>
                <input
                  type="email"
                  className="pln-input neu-inset"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#171c20', fontWeight: 600 }}>
                  No. Telepon / WhatsApp
                </label>
                <input
                  type="tel"
                  className="pln-input neu-inset"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="neu-raised-sm"
                  onClick={() => setEditModal(false)}
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
                  disabled={editSubmitting}
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
                  }}
                >
                  {editSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Signature View Modal */}
      {signatureModal && (
        <div className="modal-overlay" onClick={() => setSignatureModal(null)}>
          <div
            className="modal-content neu-raised"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '480px',
              backgroundColor: '#f6faff',
              borderRadius: '16px',
              padding: '2rem',
              border: '1px solid rgba(189, 201, 204, 0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: '#006574', fontSize: '22px' }}>
                  draw
                </span>
                <h3 className="font-headline-sm" style={{ margin: 0, fontSize: '18px', color: '#171c20' }}>
                  Tanda Tangan Digital
                </h3>
              </div>
              <button
                className="neu-raised-sm"
                onClick={() => setSignatureModal(null)}
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

            <div
              className="neu-inset"
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '1.5rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '180px',
              }}
            >
              <img
                src={signatureModal}
                alt="Tanda Tangan"
                style={{ maxWidth: '100%', maxHeight: '240px', objectFit: 'contain' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="neu-raised-sm"
                onClick={() => setSignatureModal(null)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  backgroundColor: '#f6faff',
                  color: '#006574',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
