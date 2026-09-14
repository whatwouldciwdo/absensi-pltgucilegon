import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import type { Event } from '../../types';

interface DashboardStats {
  totalEvents: number;
  activeEvents: number;
  totalAttendance: number;
  todayAttendance: number;
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    activeEvents: 0,
    totalAttendance: 0,
    todayAttendance: 0,
  });
  const [recentEvents, setRecentEvents] = useState<(Event & { attendance_count: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: events } = await supabase.from('events').select('*');
      const { data: attendances } = await supabase.from('attendances').select('*');

      const today = new Date().toISOString().split('T')[0];
      const todayAttendances = attendances?.filter(
        (a) => a.attended_at?.startsWith(today)
      );

      setStats({
        totalEvents: events?.length || 0,
        activeEvents: events?.filter((e) => e.is_active).length || 0,
        totalAttendance: attendances?.length || 0,
        todayAttendance: todayAttendances?.length || 0,
      });

      const recentEvts = (events || [])
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map((evt) => ({
          ...evt,
          attendance_count: attendances?.filter((a) => a.event_id === evt.id).length || 0,
        }));
      setRecentEvents(recentEvts);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ height: '32px', width: '240px', borderRadius: '8px' }} className="neu-inset" />
        <div className="grid grid-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="neu-raised" style={{ height: '120px', borderRadius: '12px' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="font-headline-sm" style={{ color: '#171c20', margin: '0 0 4px', fontSize: '24px' }}>
            Dashboard Administrator
          </h1>
          <p className="font-body-sm" style={{ color: '#3d494b', margin: 0 }}>
            Ringkasan data absensi dan kegiatan PT PLN Indonesia Power UBP Cilegon
          </p>
        </div>
        <Link
          to="/admin/events"
          className="neu-raised"
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
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(0, 128, 147, 0.3)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            add_circle
          </span>
          Buat Kegiatan Baru
        </Link>
      </div>

      {/* Stats Cards Neumorphic */}
      <div className="grid grid-4 gap-6 stagger-children">
        <div
          className="neu-raised"
          style={{
            padding: '1.25rem',
            borderRadius: '12px',
            backgroundColor: '#f6faff',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#3d494b' }}>Total Kegiatan</span>
            <div
              className="neu-inset"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#008093',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                event
              </span>
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#171c20', lineHeight: 1 }}>
            {stats.totalEvents}
          </div>
          <span style={{ fontSize: '11px', color: '#6d797c' }}>Semua agenda tercatat</span>
        </div>

        <div
          className="neu-raised"
          style={{
            padding: '1.25rem',
            borderRadius: '12px',
            backgroundColor: '#f6faff',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#3d494b' }}>Kegiatan Aktif</span>
            <div
              className="neu-inset"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#16a34a',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                check_circle
              </span>
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#16a34a', lineHeight: 1 }}>
            {stats.activeEvents}
          </div>
          <span style={{ fontSize: '11px', color: '#6d797c' }}>Dapat diakses peserta</span>
        </div>

        <div
          className="neu-raised"
          style={{
            padding: '1.25rem',
            borderRadius: '12px',
            backgroundColor: '#f6faff',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#3d494b' }}>Total Kehadiran</span>
            <div
              className="neu-inset"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#006574',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                group
              </span>
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#006574', lineHeight: 1 }}>
            {stats.totalAttendance}
          </div>
          <span style={{ fontSize: '11px', color: '#6d797c' }}>Total tanda tangan tersimpan</span>
        </div>

        <div
          className="neu-raised"
          style={{
            padding: '1.25rem',
            borderRadius: '12px',
            backgroundColor: '#f6faff',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#3d494b' }}>Kehadiran Hari Ini</span>
            <div
              className="neu-inset"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d97706',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                today
              </span>
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#d97706', lineHeight: 1 }}>
            {stats.todayAttendance}
          </div>
          <span style={{ fontSize: '11px', color: '#6d797c' }}>Presensi tanggal hari ini</span>
        </div>
      </div>

      {/* Recent Events Card */}
      <div
        className="neu-raised"
        style={{
          padding: '1.5rem',
          borderRadius: '16px',
          backgroundColor: '#f6faff',
          border: '1px solid rgba(189, 201, 204, 0.4)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: '#006574', fontSize: '22px' }}>
              history
            </span>
            <h2 className="font-title-md" style={{ color: '#171c20', margin: 0, fontSize: '18px' }}>
              Kegiatan Terbaru
            </h2>
          </div>
          <Link
            to="/admin/events"
            className="neu-raised-sm"
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              color: '#006574',
              backgroundColor: '#f6faff',
              fontSize: '12px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>Lihat Semua</span>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              chevron_right
            </span>
          </Link>
        </div>

        {recentEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p style={{ color: '#6d797c', fontSize: '14px', margin: '0 0 1rem' }}>
              Belum ada data kegiatan yang dibuat.
            </p>
            <Link
              to="/admin/events"
              className="neu-raised-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: '8px',
                backgroundColor: '#008093',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Buat Kegiatan
            </Link>
          </div>
        ) : (
          <div className="data-table-wrapper" style={{ boxShadow: 'none', borderRadius: '10px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kegiatan</th>
                  <th>Tanggal</th>
                  <th>Status</th>
                  <th>Peserta</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <span style={{ fontWeight: 600, color: '#171c20' }}>{event.title}</span>
                    </td>
                    <td style={{ color: '#3d494b' }}>{formatDate(event.date)}</td>
                    <td>
                      {event.is_active ? (
                        <span
                          className="neu-inset"
                          style={{
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            color: '#16a34a',
                            fontSize: '11px',
                            fontWeight: 700,
                          }}
                        >
                          Aktif
                        </span>
                      ) : (
                        <span
                          className="neu-inset"
                          style={{
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            color: '#dc2626',
                            fontSize: '11px',
                            fontWeight: 700,
                          }}
                        >
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className="neu-inset"
                        style={{
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          color: '#006574',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        {event.attendance_count} orang
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/admin/attendance/${event.id}`}
                        className="neu-raised-sm"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          color: '#006574',
                          backgroundColor: '#f6faff',
                          fontSize: '12px',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        Detail
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                          arrow_forward
                        </span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
