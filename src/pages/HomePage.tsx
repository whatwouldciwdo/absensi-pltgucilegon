import { useState, useEffect, type FC } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { Event } from '../types';
import './AttendanceForm.css';

const HomePage: FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Clock state (identical to AttendanceForm)
  const [currentTime, setCurrentTime] = useState('');
  const [currentDateStr, setCurrentDateStr] = useState('');

  // Live clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const dateFormatted = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const timeFormatted =
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB';

      setCurrentDateStr(dateFormatted);
      setCurrentTime(timeFormatted);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchActiveEvents();
  }, []);

  const fetchActiveEvents = async () => {
    try {
      if (!isSupabaseConfigured) {
        setEvents([
          {
            id: 'demo-event-1',
            title: 'Rapat Koordinasi K3 & Lingkungan UBP Cilegon',
            date: new Date().toISOString().split('T')[0],
            time_start: '09:00:00',
            time_end: '12:00:00',
            location: 'Ruang Rapat Integritas Lantai 2',
            description: 'Evaluasi penerapan K3, Sistem Manajemen Mutu & Lingkungan',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .order('date', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (start: string | null, end: string | null) => {
    if (!start) return '-';
    const s = start.slice(0, 5);
    const e = end ? end.slice(0, 5) : '';
    return e ? `${s} - ${e} WIB` : `${s} WIB`;
  };

  return (
    <div className="pln-attendance-page">
      {/* ============================================================
          HEADER: Logo (kiri), PLN INDONESIA POWER / UBP CILEGON (tengah), Tanggal + Jam (kanan)
          ============================================================ */}
      <header className="pln-header">
        <div className="pln-header-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Sisi Kiri: Logo */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
              <img
                src="/logo-pln-ip.png"
                alt="Logo PLN Indonesia Power"
                style={{ height: '42px', width: 'auto', objectFit: 'contain' }}
              />
            </Link>
          </div>

          {/* Bagian Tengah: PLN INDONESIA POWER / UBP CILEGON */}
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <span
              className="font-title-md"
              style={{
                color: '#171c20',
                fontWeight: 800,
                lineHeight: 1.2,
                letterSpacing: '0.02em',
                fontSize: '17px',
              }}
            >
              PLN INDONESIA POWER
            </span>
            <span
              className="font-label-sm"
              style={{
                color: '#006574',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginTop: '1px',
              }}
            >
              UBP CILEGON
            </span>
          </div>

          {/* Sisi Kanan: Tanggal dan Jam */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }}>
            <span className="font-label-md" style={{ color: '#171c20', fontWeight: 600 }}>
              {currentDateStr || 'Senin, 14 Sep 2026'}
            </span>
            <span className="font-body-sm" style={{ color: '#3d494b', fontWeight: 500 }}>
              {currentTime || '12:00:00 WIB'}
            </span>
          </div>
        </div>
      </header>

      {/* ============================================================
          MAIN CONTENT
          ============================================================ */}
      <main className="pln-main">
        <div className="pln-content-wrap">
          {/* Welcome Banner Card */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div
              className="neu-raised"
              style={{
                width: '100%',
                padding: '1.5rem',
                borderRadius: '0.75rem',
                backgroundColor: '#f6faff',
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                borderLeft: '4px solid #006574',
              }}
            >
              <div
                className="neu-inset"
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  backgroundColor: '#f6faff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#006574',
                  flexShrink: 0,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
                  event_available
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="font-label-sm" style={{ color: '#006574', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '2px' }}>
                  Portal Presensi Digital
                </span>
                <h1 className="font-headline-sm" style={{ color: '#171c20', margin: 0 }}>
                  Daftar Kegiatan &amp; Agenda Kehadiran
                </h1>
                <p className="font-body-sm" style={{ color: '#3d494b', margin: '4px 0 0' }}>
                  Silakan pilih kegiatan aktif di bawah ini untuk mengisi formulir daftar hadir dan tanda tangan digital.
                </p>
              </div>
            </div>
          </div>

          {/* Events List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="neu-inset"
                    style={{
                      height: '130px',
                      borderRadius: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#3d494b',
                      fontSize: '13px',
                    }}
                  >
                    Memuat data kegiatan...
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <div
                className="neu-raised"
                style={{
                  padding: '3rem 1.5rem',
                  borderRadius: '0.75rem',
                  backgroundColor: '#f6faff',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <div
                  className="neu-inset"
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3d494b',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '30px' }}>
                    event_busy
                  </span>
                </div>
                <h3 className="font-title-md" style={{ color: '#171c20', margin: 0 }}>
                  Belum Ada Kegiatan Aktif
                </h3>
                <p className="font-body-sm" style={{ color: '#3d494b', margin: 0, maxWidth: '400px' }}>
                  Saat ini belum ada agenda kegiatan yang memerlukan presensi. Silakan hubungi admin pelaksana untuk informasi lebih lanjut.
                </p>
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="neu-raised"
                  style={{
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    backgroundColor: '#f6faff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  {/* Event Top: Tag & Title */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <span
                          className="neu-inset"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            color: '#006574',
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#006574' }} />
                          Kegiatan Aktif
                        </span>
                      </div>
                      <h2 className="font-title-md" style={{ color: '#171c20', fontSize: '18px', fontWeight: 700, margin: '0 0 6px' }}>
                        {event.title}
                      </h2>
                      {event.description && (
                        <p className="font-body-sm" style={{ color: '#3d494b', margin: '0 0 10px' }}>
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '1rem',
                      paddingTop: '0.5rem',
                      borderTop: '1px solid rgba(189, 201, 204, 0.4)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3d494b', fontSize: '13px' }}>
                      <span className="material-symbols-outlined" style={{ color: '#006574', fontSize: '18px' }}>
                        calendar_today
                      </span>
                      <span>{formatDate(event.date)}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3d494b', fontSize: '13px' }}>
                      <span className="material-symbols-outlined" style={{ color: '#006574', fontSize: '18px' }}>
                        schedule
                      </span>
                      <span>{formatTime(event.time_start, event.time_end)}</span>
                    </div>

                    {event.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3d494b', fontSize: '13px' }}>
                        <span className="material-symbols-outlined" style={{ color: '#006574', fontSize: '18px' }}>
                          location_on
                        </span>
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Button Action */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
                    <Link
                      to={`/attend/${event.id}`}
                      className="neu-raised"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 24px',
                        borderRadius: '0.75rem',
                        backgroundColor: '#008093',
                        color: '#f8fdff',
                        fontWeight: 700,
                        fontSize: '14px',
                        textDecoration: 'none',
                        boxShadow: '0 4px 16px rgba(0, 128, 147, 0.3)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>Isi Presensi</span>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                        arrow_forward
                      </span>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* ============================================================
          FOOTER: Identik dengan AttendanceForm + Link Portal Admin
          ============================================================ */}
      <footer className="pln-footer">
        <div className="pln-footer-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#006574' }} />
            <span className="font-body-sm" style={{ color: '#3d494b' }}>
              &copy; 2026 SIS PT PLN Indonesia Power UBP Cilegon. Hak Cipta Dilindungi.
            </span>
          </div>
          <Link
            to="/admin/login"
            style={{
              color: '#6d797c',
              fontSize: '12px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 500,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#006574' }}>
              admin_panel_settings
            </span>
            <span>Portal Admin</span>
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
