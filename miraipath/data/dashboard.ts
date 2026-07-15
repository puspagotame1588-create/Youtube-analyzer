/**
 * Seeded demo data for the institution dashboard. All figures are fictional
 * sample data illustrating what a partner institution would see. Candidates
 * are anonymized: no personal details are exposed before student consent.
 */

export const dashboardKpis = {
  qualifiedInterest: 128,
  newMatchesThisWeek: 17,
  completeProfiles: 86,
  incompleteProfiles: 42,
  eventRegistrations: 34,
  informationRequests: 51,
  applicationIntent: 23,
};

export const languageLevelDistribution = [
  { level: "N1", students: 9 },
  { level: "N2", students: 41 },
  { level: "N3", students: 52 },
  { level: "N4", students: 19 },
  { level: "None yet", students: 7 },
];

export const budgetDistribution = [
  { range: "< ¥0.8M", students: 22 },
  { range: "¥0.8–1.0M", students: 35 },
  { range: "¥1.0–1.3M", students: 44 },
  { range: "¥1.3–1.6M", students: 18 },
  { range: "> ¥1.6M", students: 9 },
];

export const fieldInterestDistribution = [
  { field: "IT", value: 38 },
  { field: "Business", value: 31 },
  { field: "Hospitality", value: 20 },
  { field: "Design", value: 15 },
  { field: "Tourism", value: 12 },
  { field: "Care", value: 8 },
  { field: "Engineering", value: 4 },
];

export const sourceAttribution = [
  { source: "Language-school partners", value: 46 },
  { source: "Organic search", value: 31 },
  { source: "Shared Future Passports", value: 27 },
  { source: "Events", value: 14 },
  { source: "Other", value: 10 },
];

export const conversionFunnel = [
  { stage: "Viewed program", count: 412 },
  { stage: "Route-fit match", count: 128 },
  { stage: "Requested info", count: 51 },
  { stage: "Event registration", count: 34 },
  { stage: "Application intent", count: 23 },
];

export const topStudentConcerns = [
  { concern: "Can I apply with N3 if I pass N2 in December?", count: 19 },
  { concern: "Total first-year cost including fees", count: 17 },
  { concern: "Scholarship selection timing", count: 14 },
  { concern: "Part-time work while studying", count: 12 },
  { concern: "Dormitory or housing support", count: 9 },
];

export const topPrograms = [
  { program: "AI Application Development", interest: 44 },
  { program: "Digital Business Program", interest: 37 },
  { program: "Hotel Management", interest: 25 },
  { program: "Visual & UI Design", interest: 22 },
];

export interface DemoCandidate {
  id: string;
  location: string;
  japaneseLevel: string;
  education: string;
  desiredField: string;
  preferredStart: string;
  budgetRange: string;
  profileCompleteness: number;
  matchReason: string;
  consent: "granted" | "not_granted";
}

export const demoCandidates: DemoCandidate[] = [
  {
    id: "S-2041",
    location: "Tokyo (language school)",
    japaneseLevel: "N2",
    education: "High school (12 years)",
    desiredField: "IT",
    preferredStart: "2027-04",
    budgetRange: "¥1.0–1.3M",
    profileCompleteness: 95,
    matchReason: "Meets N3 requirement; budget covers first-year cost",
    consent: "granted",
  },
  {
    id: "S-1988",
    location: "Osaka (language school)",
    japaneseLevel: "N3",
    education: "High school (12 years)",
    desiredField: "Business",
    preferredStart: "2027-04",
    budgetRange: "¥0.8–1.0M",
    profileCompleteness: 88,
    matchReason: "Field match; needs N2 for recommendation route",
    consent: "granted",
  },
  {
    id: "S-2117",
    location: "Yokohama (language school)",
    japaneseLevel: "N2",
    education: "Bachelor (home country)",
    desiredField: "Business",
    preferredStart: "2027-04",
    budgetRange: "¥1.3–1.6M",
    profileCompleteness: 100,
    matchReason: "All stated requirements met; application intent declared",
    consent: "granted",
  },
  {
    id: "S-2203",
    location: "Fukuoka (language school)",
    japaneseLevel: "N3",
    education: "High school (12 years)",
    desiredField: "Hospitality",
    preferredStart: "2027-04",
    budgetRange: "¥0.8–1.0M",
    profileCompleteness: 72,
    matchReason: "Field match; attendance record not yet provided",
    consent: "not_granted",
  },
  {
    id: "S-2260",
    location: "Nagoya (language school)",
    japaneseLevel: "N4",
    education: "High school (12 years)",
    desiredField: "Design",
    preferredStart: "2027-10",
    budgetRange: "< ¥0.8M",
    profileCompleteness: 58,
    matchReason: "Interest registered; Japanese level below stated requirement",
    consent: "not_granted",
  },
  {
    id: "S-2314",
    location: "Tokyo (language school)",
    japaneseLevel: "N2",
    education: "Associate degree",
    desiredField: "IT",
    preferredStart: "2027-04",
    budgetRange: "¥1.0–1.3M",
    profileCompleteness: 91,
    matchReason: "Meets requirements; comparing with one other program",
    consent: "granted",
  },
];
