export const INITIAL_MEETING_TITLE = "新建商务会议";

export const EMPTY_ATTENDEE = {
  department: "",
  jobTitle: "",
  name: "",
  contactName: "",
  phone: "",
  isNotified: false,
  hasRsvp: false,
  status: 'pending' as const,
  leaveReason: ""
};