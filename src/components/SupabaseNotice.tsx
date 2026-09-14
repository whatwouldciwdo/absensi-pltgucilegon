import React, { useState } from 'react';
import { isSupabaseConfigured } from '../lib/supabaseClient';

export const SupabaseNotice: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (isSupabaseConfigured || dismissed) {
    return null;
  }

  return (
    <div
      style={{
        background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.2))',
        borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
        padding: '12px 16px',
        color: '#fbbf24',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        position: 'sticky',
        top: 0,
        zIndex: 9999,
        backdropFilter: 'blur(8px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px' }}>⚡</span>
        <span>
          <strong>Mode Pratinjau:</strong> Supabase belum dikonfigurasi. Buka file{' '}
          <code
            style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '2px 6px',
              borderRadius: '4px',
              color: '#fef3c7',
            }}
          >
            .env
          </code>{' '}
          dan isi <code style={{ color: '#fef3c7' }}>VITE_SUPABASE_URL</code> serta{' '}
          <code style={{ color: '#fef3c7' }}>VITE_SUPABASE_ANON_KEY</code> Anda.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'none',
          border: 'none',
          color: '#fbbf24',
          cursor: 'pointer',
          padding: '4px 8px',
          fontSize: '16px',
          lineHeight: 1,
        }}
        title="Tutup pemberitahuan"
      >
        ✕
      </button>
    </div>
  );
};

export default SupabaseNotice;
