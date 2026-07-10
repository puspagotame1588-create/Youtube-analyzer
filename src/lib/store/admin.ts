'use client';

/**
 * Admin working state (local beta mode): verification overrides, draft
 * records, audit log. Mirrors the production tables (verification_reviews,
 * audit_events) defined in the Supabase migration.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { VerificationStatus } from '@/lib/data/types';

export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  recordType?: string;
  recordId?: string;
  createdAt: string;
}

export interface DraftRecord {
  id: string;
  type: 'school' | 'scholarship' | 'career' | 'job';
  nameEn: string;
  nameJa: string;
  sourceUrl: string;
  note: string;
  status: 'draft' | 'reviewed' | 'published' | 'rejected';
  createdAt: string;
}

interface AdminState {
  overrides: Record<string, VerificationStatus>;
  setOverride: (recordId: string, status: VerificationStatus) => void;
  drafts: DraftRecord[];
  addDraft: (d: Omit<DraftRecord, 'id' | 'createdAt' | 'status'>) => void;
  setDraftStatus: (id: string, status: DraftRecord['status']) => void;
  audit: AuditEvent[];
  log: (action: string, recordType?: string, recordId?: string) => void;
  reviewedCorrections: string[];
  markCorrectionReviewed: (id: string) => void;
}

const uid = (): string => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      overrides: {},
      setOverride: (recordId, status) => {
        set({ overrides: { ...get().overrides, [recordId]: status } });
        get().log(`set-verification:${status}`, 'record', recordId);
      },
      drafts: [],
      addDraft: (d) => {
        set({
          drafts: [
            ...get().drafts,
            { ...d, id: uid(), status: 'draft', createdAt: new Date().toISOString() },
          ],
        });
        get().log('add-draft', d.type, d.nameEn);
      },
      setDraftStatus: (id, status) => {
        set({ drafts: get().drafts.map((d) => (d.id === id ? { ...d, status } : d)) });
        get().log(`draft:${status}`, 'draft', id);
      },
      audit: [],
      log: (action, recordType, recordId) =>
        set({
          audit: [
            { id: uid(), actor: 'admin', action, recordType, recordId, createdAt: new Date().toISOString() },
            ...get().audit,
          ].slice(0, 200),
        }),
      reviewedCorrections: [],
      markCorrectionReviewed: (id) => {
        set({ reviewedCorrections: [...get().reviewedCorrections, id] });
        get().log('correction-reviewed', 'correction', id);
      },
    }),
    { name: 'cv-admin-data', storage: createJSONStorage(() => localStorage) },
  ),
);
