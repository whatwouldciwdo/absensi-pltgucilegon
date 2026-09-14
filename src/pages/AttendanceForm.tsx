import { useState, useEffect, useRef, useCallback, type FC, type FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { Event } from '../types';
import './AttendanceForm.css';

const AttendanceForm: FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  // Data states
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [queueNumber, setQueueNumber] = useState('042');
  const [uid, setUid] = useState('7F-202410-042');

  // Form input states
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [isSignatureEmpty, setIsSignatureEmpty] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Clock state
  const [currentTime, setCurrentTime] = useState('');
  const [currentDateStr, setCurrentDateStr] = useState('');

  // Custom modal states (replacing native alert)
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredName, setRegisteredName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Signature canvas ref
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(500);

  // Live ticking clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const dateFormatted = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const timeFormatted = now.toLocaleTimeString('id-ID', {
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

  // Responsive canvas size
  useEffect(() => {
    const handleResize = () => {
      if (canvasContainerRef.current) {
        setCanvasWidth(canvasContainerRef.current.offsetWidth);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch event and count
  useEffect(() => {
    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      if (!isSupabaseConfigured) {
        // Fallback demo data
        setEvent({
          id: eventId || 'demo-event-1',
          title: 'Rapat Koordinasi & Pemeliharaan Kelistrikan UIW',
          date: new Date().toISOString().split('T')[0],
          time_start: '08:30:00',
          time_end: '12:00:00',
          location: 'Auditorium Lt. 4 Gedung PLN UIW Disjaya',
          description: 'Koordinasi kesiapan sistem kelistrikan dan pemeliharaan rutin',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        setQueueNumber('042');
        setUid(`7F-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-042`);
        setLoading(false);
        return;
      }

      // Check if eventId is a valid UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId || '');

      let eventData: Event | null = null;

      // 1. If valid UUID, look up directly by ID
      if (isUuid) {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .maybeSingle();
        if (!error && data) {
          eventData = data;
        }
      }

      // 2. If not found, try looking up by column slug in Supabase
      if (!eventData) {
        try {
          const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('slug', eventId)
            .maybeSingle();
          if (!error && data) {
            eventData = data;
          }
        } catch {
          // ignore column missing
        }
      }

      // 3. Fallback: check localStorage slug mapping
      if (!eventData) {
        const storedId = localStorage.getItem(`pln_id_by_slug_${eventId}`);
        if (storedId) {
          const { data } = await supabase
            .from('events')
            .select('*')
            .eq('id', storedId)
            .maybeSingle();
          if (data) eventData = data;
        }
      }

      // 4. Fallback: match by title slug (e.g. "test2" -> matches title "test2")
      if (!eventData) {
        const { data: allEvents } = await supabase
          .from('events')
          .select('*');

        if (allEvents && allEvents.length > 0) {
          const searchKey = (eventId || '').toLowerCase().trim();
          const matched = allEvents.find((evt) => {
            const titleSlug = evt.title
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/[\s_]+/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-+|-+$/g, '');
            return Boolean(searchKey) && (titleSlug === searchKey || evt.id.toLowerCase().startsWith(searchKey));
          });
          if (matched) eventData = matched;
        }
      }

      if (!eventData) {
        throw new Error('Kegiatan tidak ditemukan atau sudah tidak aktif.');
      }

      setEvent(eventData);

      // Get count of attendees using actual event UUID
      const actualEventId = eventData.id;
      const { count } = await supabase
        .from('attendances')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', actualEventId);

      const nextNum = String((count || 0) + 1).padStart(3, '0');
      setQueueNumber(nextNum);
      const ym = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      setUid(`7F-${ym}-${nextNum}`);
    } catch (err) {
      console.error('Error fetching event details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureEnd = useCallback(() => {
    if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
      setIsSignatureEmpty(false);
      setSignatureDataUrl(sigCanvasRef.current.toDataURL('image/png'));
      if (errors.signature) {
        setErrors((prev) => ({ ...prev, signature: '' }));
      }
    }
  }, [errors.signature]);

  const clearSignature = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear();
      setIsSignatureEmpty(true);
      setSignatureDataUrl(null);
    }
  };

  const resetForm = () => {
    setName('');
    setPosition('');
    setPhone('');
    setEmail('');
    setAddress('');
    setErrors({});
    clearSignature();
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Nama lengkap & gelar wajib diisi';
    if (!position.trim()) newErrors.position = 'Jabatan / instansi wajib diisi';
    if (!phone.trim()) newErrors.phone = 'Nomor telepon / WhatsApp wajib diisi';
    if (!email.trim()) newErrors.email = 'Alamat email wajib diisi';
    if (isSignatureEmpty || !signatureDataUrl) newErrors.signature = 'Tanda tangan digital wajib dibubuhkan';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate() || !eventId) return;

    setSubmitting(true);
    try {
      if (!isSupabaseConfigured) {
        // Preview mode simulation
        await new Promise((resolve) => setTimeout(resolve, 600));
        setRegisteredName(name.trim());
        setShowSuccessModal(true);
        return;
      }

      let signatureUrl: string | null = null;

      // Upload signature if image exists
      if (signatureDataUrl) {
        try {
          const res = await fetch(signatureDataUrl);
          const blob = await res.blob();
          const currentEventId = event?.id || eventId;
          const fileName = `signatures/${currentEventId}/${Date.now()}_${name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;

          const { error: uploadError } = await supabase.storage
            .from('signatures')
            .upload(fileName, blob, { contentType: 'image/png' });

          if (uploadError) {
            console.warn('Could not upload to storage, saving inline signature data:', uploadError);
            signatureUrl = signatureDataUrl;
          } else {
            const { data: urlData } = supabase.storage
              .from('signatures')
              .getPublicUrl(fileName);
            signatureUrl = urlData.publicUrl;
          }
        } catch {
          signatureUrl = signatureDataUrl;
        }
      }

      // Insert record
      const payload: Record<string, unknown> = {
        event_id: event?.id || eventId,
        name: name.trim(),
        position: position.trim(),
        email: email.trim(),
        phone: phone.trim(),
        signature_url: signatureUrl,
      };

      if (address.trim()) {
        payload.address = address.trim();
      }

      const { error: insertError } = await supabase.from('attendances').insert(payload);

      if (insertError) {
        // Fallback without address if column not yet added
        if (insertError.message?.includes('address')) {
          delete payload.address;
          const { error: retryError } = await supabase.from('attendances').insert(payload);
          if (retryError) throw retryError;
        } else {
          throw insertError;
        }
      }

      setRegisteredName(name.trim());
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error submitting presensi:', err);
      setErrorMessage('Gagal menyimpan presensi. Silakan periksa koneksi internet Anda dan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (start?: string | null, end?: string | null) => {
    if (!start) return '';
    const s = start.slice(0, 5);
    const e = end ? end.slice(0, 5) : '';
    return e ? `${s} - ${e} WIB` : `${s} WIB`;
  };

  if (loading) {
    return (
      <div className="pln-attendance-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: '3px solid rgba(0, 101, 116, 0.2)',
              borderTopColor: '#006574',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <p style={{ color: '#3d494b', fontSize: '14px', fontWeight: 500 }}>
            Memuat Formulir Presensi...
          </p>
        </div>
      </div>
    );
  }

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
          {/* 1. Event Info & Scan Success Notification Banner */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div
              className="neu-raised"
              style={{
                width: '100%',
                padding: '1.25rem',
                borderRadius: '0.75rem',
                backgroundColor: '#f6faff',
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                borderLeft: '4px solid #006574',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '260px' }}>
                <div
                  className="neu-inset"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#f6faff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#006574',
                    flexShrink: 0,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>
                    verified
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span className="font-label-sm" style={{ color: '#006574', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                      Form Kehadiran
                    </span>
                  </div>
                  <span className="font-title-md" style={{ color: '#171c20', fontWeight: 700 }}>
                    {event?.title || 'Kegiatan PLN'}
                  </span>
                  <span className="font-body-sm" style={{ color: '#3d494b', marginTop: '2px' }}>
                    {event?.location ? `${event.location} • ` : ''}
                    {formatDate(event?.date)}
                    {event?.time_start ? ` • ${formatTime(event.time_start, event.time_end)}` : ''}
                  </span>
                </div>
              </div>

              {/* No. Urut Badge */}
              <div
                className="neu-inset"
                style={{
                  padding: '6px 14px',
                  borderRadius: '0.75rem',
                  backgroundColor: '#f6faff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  alignSelf: 'flex-start',
                }}
              >
                <span className="font-label-sm" style={{ color: '#3d494b' }}>
                  No. Urut:
                </span>
                <span className="font-title-md" style={{ color: '#006574', fontWeight: 700, fontFamily: 'monospace' }}>
                  #{queueNumber}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Main Attendance Form Card */}
          <div
            className="neu-raised"
            style={{
              padding: '1.5rem',
              borderRadius: '0.75rem',
              backgroundColor: '#f6faff',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}
          >
            {/* Form Title & Step Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(189, 201, 204, 0.6)',
                paddingBottom: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#006574',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                >
                  1
                </div>
                <div>
                  <h1 className="font-headline-sm" style={{ color: '#171c20', margin: 0 }}>
                    Formulir Presensi Kehadiran
                  </h1>
                  <p className="font-body-sm" style={{ color: '#3d494b', margin: '2px 0 0' }}>
                    Silakan isi identitas dan sertakan tanda tangan digital Anda
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Row 1: Nomor Registrasi & Nama Lengkap */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1.25rem',
                }}
              >
                {/* No Registrasi */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="font-label-md" style={{ color: '#171c20', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ color: '#006574', fontSize: '18px' }}>
                      confirmation_number
                    </span>
                    Nomor Registrasi / Presensi
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="#PLNIP-CLG"
                    className="pln-input neu-inset readonly"
                    style={{ fontFamily: 'monospace', fontWeight: 600, color: '#006574' }}
                  />
                </div>

                {/* Nama Lengkap */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="font-label-md" style={{ color: '#171c20', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ color: '#006574', fontSize: '18px' }}>
                      person
                    </span>
                    Nama Lengkap &amp; Gelar <span style={{ color: '#bb0307' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso, S.T., M.Eng."
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    className="pln-input neu-inset"
                  />
                  {errors.name && (
                    <span style={{ color: '#bb0307', fontSize: '11px', fontWeight: 500 }}>
                      {errors.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Row 2: Jabatan / Instansi & No Telp */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1.25rem',
                }}
              >
                {/* Jabatan */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="font-label-md" style={{ color: '#171c20', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ color: '#006574', fontSize: '18px' }}>
                      badge
                    </span>
                    Jabatan / Instansi <span style={{ color: '#bb0307' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Manajer Operasi / PT PLN (Persero)"
                    value={position}
                    onChange={(e) => {
                      setPosition(e.target.value);
                      if (errors.position) setErrors((prev) => ({ ...prev, position: '' }));
                    }}
                    className="pln-input neu-inset"
                  />
                  {errors.position && (
                    <span style={{ color: '#bb0307', fontSize: '11px', fontWeight: 500 }}>
                      {errors.position}
                    </span>
                  )}
                </div>

                {/* No Telepon */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="font-label-md" style={{ color: '#171c20', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ color: '#006574', fontSize: '18px' }}>
                      call
                    </span>
                    No. Telp / WhatsApp <span style={{ color: '#bb0307' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081234567890"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                    }}
                    className="pln-input neu-inset"
                  />
                  {errors.phone && (
                    <span style={{ color: '#bb0307', fontSize: '11px', fontWeight: 500 }}>
                      {errors.phone}
                    </span>
                  )}
                </div>
              </div>

              {/* Row 3: Email & Alamat Domisili */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1.25rem',
                }}
              >
                {/* Email */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="font-label-md" style={{ color: '#171c20', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ color: '#006574', fontSize: '18px' }}>
                      mail
                    </span>
                    Alamat Email Aktif <span style={{ color: '#bb0307' }}>*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Contoh: nama@plnindonesiapower.co.id"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    className="pln-input neu-inset"
                  />
                  {errors.email && (
                    <span style={{ color: '#bb0307', fontSize: '11px', fontWeight: 500 }}>
                      {errors.email}
                    </span>
                  )}
                </div>

                {/* Alamat Domisili */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="font-label-md" style={{ color: '#171c20', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ color: '#006574', fontSize: '18px' }}>
                      home_pin
                    </span>
                    Alamat Domisili / Kantor
                  </label>
                  <input
                    type="text"
                    placeholder="Kota / Unit Kerja Kantor Domisili"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="pln-input neu-inset"
                  />
                </div>
              </div>

              {/* Row 4: Signature Pad */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label className="font-label-md" style={{ color: '#171c20', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ color: '#006574', fontSize: '18px' }}>
                      draw
                    </span>
                    Tanda Tangan Digital <span style={{ color: '#bb0307' }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="neu-raised-sm"
                    style={{
                      padding: '4px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#f6faff',
                      color: '#3d494b',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      transition: 'all 0.15s',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      ink_eraser
                    </span>
                    Hapus / Bersihkan
                  </button>
                </div>

                {/* Neumorphic Canvas Box */}
                <div
                  ref={canvasContainerRef}
                  className="neu-inset pln-sig-container"
                  style={{
                    border: errors.signature ? '1px solid #bb0307' : '1px solid transparent',
                  }}
                >
                  {/* Watermark */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                      opacity: 0.08,
                      zIndex: 1,
                    }}
                  >
                    <span className="font-display-lg" style={{ color: '#171c20', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      TANDA TANGAN
                    </span>
                  </div>

                  {/* Dashed Guideline */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '24px',
                      right: '24px',
                      bottom: '32px',
                      borderBottom: '1px dashed rgba(189, 201, 204, 0.7)',
                      pointerEvents: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      color: 'rgba(61, 73, 75, 0.4)',
                      fontSize: '11px',
                      fontWeight: 600,
                      zIndex: 2,
                    }}
                  >
                    <span>Goreskan tanda tangan di sini</span>
                    <span>Digital Signature Pad</span>
                  </div>

                  {/* Interactive Drawing Canvas */}
                  <SignatureCanvas
                    ref={sigCanvasRef}
                    penColor="#006574"
                    backgroundColor="transparent"
                    canvasProps={{
                      width: canvasWidth,
                      height: 160,
                      className: 'pln-sig-canvas',
                    }}
                    onEnd={handleSignatureEnd}
                  />

                  {/* Footer status bar inside canvas container */}
                  <div
                    style={{
                      position: 'relative',
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '4px',
                      pointerEvents: 'none',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'monospace', fontSize: '11px', color: '#3d494b' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#006574' }}>
                        verified
                      </span>
                      UID: {uid}
                    </span>
                    <span style={{ color: '#006574', fontWeight: 600, fontSize: '11px' }}>
                      {!isSignatureEmpty ? 'Tanda Tangan Terisi' : 'Valid & Tersimpan Otomatis'}
                    </span>
                  </div>
                </div>

                {errors.signature && (
                  <span style={{ color: '#bb0307', fontSize: '11px', fontWeight: 500 }}>
                    {errors.signature}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '1rem',
                  paddingTop: '0.75rem',
                }}
              >
                <button
                  type="button"
                  onClick={resetForm}
                  className="neu-raised-sm"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '0.75rem',
                    backgroundColor: '#f6faff',
                    color: '#3d494b',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    restart_alt
                  </span>
                  Bersihkan Form
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="neu-raised"
                  style={{
                    padding: '10px 28px',
                    borderRadius: '0.75rem',
                    backgroundColor: '#008093',
                    color: '#f8fdff',
                    border: 'none',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: 700,
                    boxShadow: '0 6px 20px rgba(0, 128, 147, 0.35)',
                    opacity: submitting ? 0.7 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  {submitting ? (
                    <>
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          border: '2px solid rgba(255,255,255,0.4)',
                          borderTopColor: '#ffffff',
                          animation: 'spin 0.6s linear infinite',
                        }}
                      />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                        send
                      </span>
                      <span>Simpan Presensi Kehadiran</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Micro Footer Note */}
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <p className="font-body-sm" style={{ color: '#3d494b', margin: 0 }}>
              Butuh bantuan absensi atau penggantian data? Hubungi panitia pelaksana atau sekretariat acara di lokasi.
            </p>
          </div>
        </div>
      </main>

      {/* ============================================================
          FOOTER
          ============================================================ */}
      <footer className="pln-footer">
        <div className="pln-footer-inner" style={{ justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#006574' }} />
            <span className="font-body-sm" style={{ color: '#3d494b' }}>
              &copy; 2026 SIS PT PLN Indonesia Power UBP Cilegon. Hak Cipta Dilindungi.
            </span>
          </div>
        </div>
      </footer>

      {/* ============================================================
          CUSTOM NON-NATIVE SUCCESS MODAL
          ============================================================ */}
      {showSuccessModal && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 9999, animation: 'fadeIn 0.2s ease-out' }}
        >
          <div
            className="neu-raised"
            style={{
              maxWidth: '460px',
              width: '100%',
              backgroundColor: '#f6faff',
              borderRadius: '24px',
              padding: '2.5rem 2rem 2rem',
              textAlign: 'center',
              border: '1px solid rgba(189, 201, 204, 0.5)',
              boxShadow: '-12px -12px 30px #ffffff, 12px 12px 30px rgba(163, 177, 198, 0.45), 0 20px 45px rgba(0, 101, 116, 0.15)',
              animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              position: 'relative',
            }}
          >
            {/* Success Icon Badge */}
            <div
              className="neu-inset"
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                margin: '0 auto 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f6faff',
                border: '2px solid rgba(0, 128, 147, 0.25)',
              }}
            >
              <span 
                className="material-symbols-outlined" 
                style={{ fontSize: '42px', color: '#008093' }}
              >
                check_circle
              </span>
            </div>

            {/* Status Pill */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '20px', backgroundColor: 'rgba(0, 128, 147, 0.1)', color: '#006574', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '1rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#008093' }}></span>
              PRESENSI BERHASIL DISIMPAN
            </div>

            {/* Title & Greeting */}
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '20px', fontWeight: 800, color: '#171c20', lineHeight: 1.3 }}>
              Terima Kasih, {registeredName}!
            </h3>
            <p style={{ margin: '0 0 1.5rem', fontSize: '13.5px', color: '#4b5563', lineHeight: 1.6 }}>
              Data kehadiran dan tanda tangan digital Anda telah resmi tercatat pada sistem presensi kegiatan ini.
            </p>

            {/* Event Summary Details (Neumorphic Inset Card) */}
            <div
              className="neu-inset"
              style={{
                backgroundColor: '#edf3f9',
                borderRadius: '16px',
                padding: '1.1rem 1.25rem',
                textAlign: 'left',
                marginBottom: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                border: '1px solid rgba(189, 201, 204, 0.3)',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: '#6d797c', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Kegiatan / Acara
                </span>
                <p style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 700, color: '#006574' }}>
                  {event?.title || 'Kegiatan PLN Indonesia Power'}
                </p>
              </div>

              <div style={{ height: '1px', backgroundColor: 'rgba(189, 201, 204, 0.35)' }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#6d797c', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                    Waktu Tercatat
                  </span>
                  <p style={{ margin: '2px 0 0', fontSize: '12.5px', fontWeight: 600, color: '#171c20' }}>
                    {currentTime || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: '#6d797c', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                    Status
                  </span>
                  <div style={{ margin: '2px 0 0', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '12px', fontWeight: 700 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>verified</span>
                    Tercatat Sah
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Action Button */}
            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                navigate('/');
              }}
              className="neu-raised"
              style={{
                width: '100%',
                padding: '13px 20px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #008093 0%, #006574 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 20px rgba(0, 101, 116, 0.35)',
                transition: 'all 0.2s ease',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                check
              </span>
              <span>OK, Selesai</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          CUSTOM NON-NATIVE ERROR MODAL
          ============================================================ */}
      {errorMessage && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 9999, animation: 'fadeIn 0.2s ease-out' }}
        >
          <div
            className="neu-raised"
            style={{
              maxWidth: '440px',
              width: '100%',
              backgroundColor: '#f6faff',
              borderRadius: '24px',
              padding: '2.5rem 2rem 2rem',
              textAlign: 'center',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              boxShadow: '-12px -12px 30px #ffffff, 12px 12px 30px rgba(163, 177, 198, 0.45), 0 20px 45px rgba(220, 38, 38, 0.15)',
              animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <div
              className="neu-inset"
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                margin: '0 auto 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fef2f2',
                border: '2px solid rgba(220, 38, 38, 0.25)',
              }}
            >
              <span 
                className="material-symbols-outlined" 
                style={{ fontSize: '40px', color: '#dc2626' }}
              >
                error
              </span>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '20px', backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#dc2626', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '1rem' }}>
              GAGAL MENYIMPAN
            </div>

            <h3 style={{ margin: '0 0 0.5rem', fontSize: '19px', fontWeight: 800, color: '#171c20' }}>
              Terjadi Kendala
            </h3>
            <p style={{ margin: '0 0 1.5rem', fontSize: '13.5px', color: '#4b5563', lineHeight: 1.6 }}>
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() => setErrorMessage('')}
              className="neu-raised"
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 6px 18px rgba(220, 38, 38, 0.3)',
              }}
            >
              <span>Tutup & Coba Lagi</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceForm;
