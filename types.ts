export interface Attendee {
  id: string;
  department: string;
  jobTitle: string;
  name: string; // The attendee's name
  contactName: string; // The department contact person
  phone: string; // The department contact phone
  isNotified: boolean;
  hasRsvp: boolean;
  status: 'present' | 'leave' | 'pending';
  leaveReason?: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string; // ISO Date string
  attendees: Attendee[];
  createdAt: number;
}

// Global definition for SheetJS since we load it via CDN
declare global {
  interface Window {
    XLSX: any;
  }
}

export enum FilterStatus {
  ALL = 'ALL',
  PRESENT = 'PRESENT',
  LEAVE = 'LEAVE',
  PENDING = 'PENDING',
  NOTIFIED = 'NOTIFIED',
  NOT_NOTIFIED = 'NOT_NOTIFIED',
  RSVP_YES = 'RSVP_YES',
  RSVP_NO = 'RSVP_NO'
}

export type SortField = 'department' | 'name' | 'jobTitle' | 'status' | 'contactName';
export type SortDirection = 'asc' | 'desc';