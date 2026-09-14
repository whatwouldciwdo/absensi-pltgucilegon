import React from 'react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title = 'Absensi Berhasil!',
  message = 'Terima kasih telah mengisi daftar hadir. Data kehadiran Anda telah tercatat.',
}) => {
  if (!isOpen) return null;

  return (
    <div className="success-overlay" onClick={onClose}>
      <div className="success-card" onClick={(e) => e.stopPropagation()}>
        <div className="success-icon-container">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="success-title">{title}</h2>
        <p className="success-message">{message}</p>
        <button className="btn btn-primary btn-lg w-full" onClick={onClose}>
          Kembali ke Beranda
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;
