export const CAMPUS_LAT = 22.2863;
export const CAMPUS_LNG = 73.3641;

export const DEPARTMENTS = [
  'CSE', 'BCA', 'MCA', 'MBA', 'Pharmacy', 'Law',
  'Architecture', 'Design', 'Commerce', 'Medicine',
  'Fine Arts', 'Agriculture', 'Applied Sciences',
];

export const INTERESTS = [
  'Coding', 'Gaming', 'Music', 'Sports', 'Photography', 'Art',
  'Debate', 'Dance', 'Drama', 'Fitness', 'Books', 'Food',
  'Travel', 'Finance', 'Movies', 'Design', 'Research',
  'Teaching', 'Startups', 'NSS', 'Robotics',
];

export const CAMPUS_STATUSES = [
  { value: 'free',      label: 'Free to hang', color: '#10B981' },
  { value: 'studying',  label: 'Studying',      color: '#2563EB' },
  { value: 'at_mess',   label: 'At Mess',       color: '#F59E0B' },
  { value: 'at_gym',    label: 'At Gym',        color: '#F97316' },
  { value: 'in_class',  label: 'In Class',      color: '#94A3B8' },
  { value: 'in_hostel', label: 'In Hostel',     color: '#A855F7' },
];

export const MESS_NAMES = [
  'TAGORE - A MESS', 'TAGORE - B MESS', 'TAGORE - C MESS',
  'SHAKUNTALA BHAVAN - A MESS', 'SHAKUNTALA BHAVAN - B MESS',
  'TERESA BHAVAN - C MESS', 'TERESA BHAVAN - D MESS',
  'MEDICAL MESS', 'PIT MESS',
  'ATAL BHAVAN - A MESS', 'ATAL BHAVAN - B MESS',
  'AZAD MESS', 'SAROJINI C MESS 4', 'SHANTI SADAN MESS 2',
  'Rani Laxmi Bai B',
];

// Deterministic avatar color from user ID
export function userColor(userId) {
  const hue = (Number(userId) * 137.508) % 360;
  return `hsl(${hue}, 55%, 60%)`;
}

// Deterministic cover gradient from user ID
export function userCoverGradient(userId) {
  const hue = (Number(userId) * 137.508) % 360;
  return `linear-gradient(135deg, hsl(${hue},60%,85%) 0%, hsl(${(hue + 60) % 360},50%,90%) 100%)`;
}
