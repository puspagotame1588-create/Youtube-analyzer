'use client';

/**
 * Business/application state for the private beta.
 *
 * Persistence: local storage adapter ("Local beta mode" — labeled in the UI).
 * The shape mirrors the Supabase schema in supabase/migrations so the
 * production switch is an adapter swap, not a data-model change.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_WEIGHTS, type FactorWeights, type SimProfile, type SimulationResult } from '@/lib/simulation/types';
import { simulate } from '@/lib/simulation/engine';
import { dataset } from '@/lib/data/seed';

export interface LocalAccount {
  id: string;
  email: string;
  displayName: string;
  ageConfirmed: boolean;
  createdAt: string;
  interfaceLanguage: 'en' | 'ja';
}

export interface SavedScenario {
  id: string;
  name: string;
  result: SimulationResult;
  routeNames: Record<string, string>;
  savedAt: string;
}

export interface TrackerItem {
  id: string;
  schoolId: string;
  status: 'interested' | 'preparing' | 'applied' | 'interview' | 'result';
  note: string;
  deadline?: string;
  addedAt: string;
}

export interface SupportTicket {
  id: string;
  category: 'onboarding' | 'schools' | 'careers' | 'documents' | 'technical' | 'feedback' | 'legal-referral' | 'other';
  message: string;
  email?: string;
  createdAt: string;
  status: 'open' | 'answered' | 'closed';
  escalated: boolean;
}

export interface CorrectionReport {
  id: string;
  recordType: 'school' | 'scholarship' | 'career' | 'job';
  recordId: string;
  message: string;
  createdAt: string;
  status: 'open' | 'reviewed';
}

export interface AppNotification {
  id: string;
  titleEn: string;
  titleJa: string;
  bodyEn: string;
  bodyJa: string;
  createdAt: string;
  read: boolean;
}

interface AppState {
  // auth (local beta mode)
  account: LocalAccount | null;
  signUp: (email: string, displayName: string, betaCode: string, ageConfirmed: boolean) => { ok: boolean; error?: string };
  signOut: () => void;
  deleteAccount: () => void;

  // current simulation (anonymous allowed)
  profileDraft: Partial<SimProfile>;
  setProfileDraft: (p: Partial<SimProfile>) => void;
  weights: FactorWeights;
  setWeights: (w: FactorWeights) => void;
  currentResult: SimulationResult | null;
  runSimulation: (profile: SimProfile) => SimulationResult;
  rerunWith: (patch: Partial<SimProfile>) => { result: SimulationResult; changed: string[] } | null;
  lastChange: { fieldChanged: string; from: string; to: string } | null;

  // saved scenarios (free tier: 1)
  scenarios: SavedScenario[];
  saveScenario: (name: string) => { ok: boolean; error?: string };
  deleteScenario: (id: string) => void;
  renameRoute: (scenarioId: string | null, routeId: string, name: string) => void;
  currentRouteNames: Record<string, string>;

  // schools
  shortlist: string[];
  toggleShortlist: (schoolId: string) => void;
  tracker: TrackerItem[];
  addToTracker: (schoolId: string) => void;
  updateTracker: (id: string, patch: Partial<TrackerItem>) => void;
  removeFromTracker: (id: string) => void;

  // support & trust
  tickets: SupportTicket[];
  submitTicket: (t: Omit<SupportTicket, 'id' | 'createdAt' | 'status' | 'escalated'>) => void;
  corrections: CorrectionReport[];
  submitCorrection: (c: Omit<CorrectionReport, 'id' | 'createdAt' | 'status'>) => void;

  notifications: AppNotification[];
  pushNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  markRead: (id: string) => void;

  exportData: () => string;
}

const uid = (): string => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const FREE_SCENARIO_LIMIT = 1;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      account: null,
      signUp: (email, displayName, betaCode, ageConfirmed) => {
        const expected = process.env.NEXT_PUBLIC_BETA_CODE ?? 'KANTO-BETA';
        if (!ageConfirmed) return { ok: false, error: 'age' };
        if (betaCode.trim().toUpperCase() !== expected.toUpperCase()) return { ok: false, error: 'beta-code' };
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: 'email' };
        set({
          account: {
            id: uid(),
            email,
            displayName: displayName || email.split('@')[0] || 'Explorer',
            ageConfirmed,
            createdAt: new Date().toISOString(),
            interfaceLanguage: 'en',
          },
        });
        get().pushNotification({
          titleEn: 'Welcome to the CareerVerse private beta',
          titleJa: 'CareerVerseプライベートベータへようこそ',
          bodyEn: 'Your data is stored on this device (local beta mode). You can export or delete it in Settings.',
          bodyJa: 'データはこの端末に保存されます（ローカルベータモード）。設定からエクスポート・削除ができます。',
        });
        return { ok: true };
      },
      signOut: () => set({ account: null }),
      deleteAccount: () =>
        set({
          account: null,
          scenarios: [],
          tracker: [],
          shortlist: [],
          tickets: [],
          notifications: [],
          corrections: [],
          currentResult: null,
          profileDraft: {},
        }),

      profileDraft: {},
      setProfileDraft: (p) => set({ profileDraft: { ...get().profileDraft, ...p } }),
      weights: DEFAULT_WEIGHTS,
      setWeights: (weights) => {
        set({ weights });
        const prof = get().currentResult?.profile;
        if (prof) {
          set({ currentResult: simulate(prof, dataset, { weights }) });
        }
      },
      currentResult: null,
      runSimulation: (profile) => {
        const result = simulate(profile, dataset, { weights: get().weights });
        set({ currentResult: result, profileDraft: profile, lastChange: null });
        return result;
      },
      lastChange: null,
      rerunWith: (patch) => {
        const prev = get().currentResult;
        if (!prev) return null;
        const nextProfile = { ...prev.profile, ...patch };
        const result = simulate(nextProfile, dataset, { weights: get().weights });
        const changedKey = Object.keys(patch)[0] ?? 'profile';
        const describe = (p: SimProfile): string => {
          switch (changedKey) {
            case 'budgetJpy': return `¥${p.budgetJpy.expected.toLocaleString()}`;
            case 'jlptCurrent': return p.jlptCurrent.toUpperCase();
            case 'jlptExpected': return (p.jlptExpected ?? 'none').toUpperCase();
            case 'location': return p.location;
            case 'field': return p.field;
            case 'desiredSalaryJpy': return p.desiredSalaryJpy ? `¥${p.desiredSalaryJpy.toLocaleString()}` : '—';
            default: return '';
          }
        };
        set({
          currentResult: result,
          lastChange: { fieldChanged: changedKey, from: describe(prev.profile), to: describe(nextProfile) },
        });
        const changed = result.routes
          .filter((r) => {
            const before = prev.routes.find((p) => p.id === r.id);
            return !before || before.scores.expected !== r.scores.expected;
          })
          .map((r) => r.id);
        return { result, changed };
      },

      scenarios: [],
      saveScenario: (name) => {
        const { account, currentResult, scenarios, currentRouteNames } = get();
        if (!account) return { ok: false, error: 'auth' };
        if (!currentResult) return { ok: false, error: 'no-result' };
        if (scenarios.length >= FREE_SCENARIO_LIMIT) return { ok: false, error: 'limit' };
        set({
          scenarios: [
            ...scenarios,
            { id: uid(), name, result: currentResult, routeNames: currentRouteNames, savedAt: new Date().toISOString() },
          ],
        });
        return { ok: true };
      },
      deleteScenario: (id) => set({ scenarios: get().scenarios.filter((s) => s.id !== id) }),
      currentRouteNames: {},
      renameRoute: (scenarioId, routeId, name) => {
        if (scenarioId) {
          set({
            scenarios: get().scenarios.map((s) =>
              s.id === scenarioId ? { ...s, routeNames: { ...s.routeNames, [routeId]: name } } : s,
            ),
          });
        } else {
          set({ currentRouteNames: { ...get().currentRouteNames, [routeId]: name } });
        }
      },

      shortlist: [],
      toggleShortlist: (schoolId) => {
        const list = get().shortlist;
        set({
          shortlist: list.includes(schoolId) ? list.filter((s) => s !== schoolId) : [...list, schoolId],
        });
      },
      tracker: [],
      addToTracker: (schoolId) => {
        if (get().tracker.some((t) => t.schoolId === schoolId)) return;
        set({
          tracker: [
            ...get().tracker,
            { id: uid(), schoolId, status: 'interested', note: '', addedAt: new Date().toISOString() },
          ],
        });
      },
      updateTracker: (id, patch) =>
        set({ tracker: get().tracker.map((t) => (t.id === id ? { ...t, ...patch } : t)) }),
      removeFromTracker: (id) => set({ tracker: get().tracker.filter((t) => t.id !== id) }),

      tickets: [],
      submitTicket: (t) => {
        const escalated = t.category === 'legal-referral' || t.category === 'documents';
        set({
          tickets: [
            ...get().tickets,
            { ...t, id: uid(), createdAt: new Date().toISOString(), status: 'open', escalated },
          ],
        });
      },
      corrections: [],
      submitCorrection: (c) =>
        set({
          corrections: [
            ...get().corrections,
            { ...c, id: uid(), createdAt: new Date().toISOString(), status: 'open' },
          ],
        }),

      notifications: [],
      pushNotification: (n) =>
        set({
          notifications: [
            { ...n, id: uid(), createdAt: new Date().toISOString(), read: false },
            ...get().notifications,
          ],
        }),
      markRead: (id) =>
        set({ notifications: get().notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }),

      exportData: () => {
        const { account, scenarios, tracker, shortlist, tickets, notifications, profileDraft, corrections } = get();
        return JSON.stringify(
          { exportedAt: new Date().toISOString(), account, profileDraft, scenarios, tracker, shortlist, tickets, corrections, notifications },
          null,
          2,
        );
      },
    }),
    {
      name: 'cv-app',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        account: s.account,
        profileDraft: s.profileDraft,
        weights: s.weights,
        currentResult: s.currentResult,
        currentRouteNames: s.currentRouteNames,
        scenarios: s.scenarios,
        shortlist: s.shortlist,
        tracker: s.tracker,
        tickets: s.tickets,
        corrections: s.corrections,
        notifications: s.notifications,
      }),
    },
  ),
);
