export interface Event {
  id: string;
  title: string;
  date: string;
  time_start: string | null;
  time_end: string | null;
  location: string | null;
  description: string | null;
  slug?: string | null;
  qr_code_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  event_id: string;
  name: string;
  position: string | null;
  email: string | null;
  phone: string | null;
  address?: string | null;
  signature_url: string | null;
  attended_at: string;
  created_at: string;
  updated_at: string;
}

export interface EventWithCount extends Event {
  attendance_count: number;
}
