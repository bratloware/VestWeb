export type InsightPeriod = 'today' | '7d' | '30d';

export interface SessionSummary {
  total: number;
  pending: number;
  confirmed: number;
  done: number;
}

export interface UpcomingSession {
  id: number;
  scheduled_at: string;
  status: 'pending' | 'confirmed';
  notes: string | null;
  student: { id: number; name: string; avatar_url: string | null; enrollment: string };
}

export interface ActivityEvent {
  type: 'session' | 'view' | 'comment';
  date: string;
  student: { id: number; name: string; avatar_url: string | null };
  meta: { scheduled_at?: string; status?: string; videoTitle?: string };
}

export interface VideoStat {
  id: number;
  title: string;
  thumbnail_url: string | null;
  status: 'published' | 'scheduled' | 'draft';
  published_at: string | null;
}

export interface InsightsData {
  pendingDoubts: number;
  activeStudents: number;
  avgRating: string | null;
  ratingCount: number;
  videoStats: {
    total: number;
    published: number;
    scheduled: number;
    draft: number;
    recent: VideoStat[];
  };
}

export interface AnnouncementItem {
  id: number;
  content: string;
  created_at: string;
  expires_at: string | null;
}
