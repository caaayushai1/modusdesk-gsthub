'use client';

export interface StatutoryReturnEntry {
  id: string;
  returnType: string;
  category: 'MONTHLY' | 'QRMP' | 'COMPOSITION' | 'ANNUAL' | 'OTHER';
  period: string;
  defaultDueDate: string;
  defaultTimestamp: number;
  currentDueDate: string;
  currentTimestamp: number;
  isOverridden: boolean;
  isCustom?: boolean;
  extensionNote?: string;
}

export const DEFAULT_STATUTORY_CALENDAR: StatutoryReturnEntry[] = [
  {
    id: 'gstr-7',
    returnType: 'GSTR-7 (TDS under GST)',
    category: 'MONTHLY',
    period: 'Monthly (July 2026)',
    defaultDueDate: '10 Aug 2026',
    defaultTimestamp: new Date('2026-08-10').getTime(),
    currentDueDate: '10 Aug 2026',
    currentTimestamp: new Date('2026-08-10').getTime(),
    isOverridden: false,
  },
  {
    id: 'gstr-8',
    returnType: 'GSTR-8 (TCS by E-Commerce)',
    category: 'MONTHLY',
    period: 'Monthly (July 2026)',
    defaultDueDate: '10 Aug 2026',
    defaultTimestamp: new Date('2026-08-10').getTime(),
    currentDueDate: '10 Aug 2026',
    currentTimestamp: new Date('2026-08-10').getTime(),
    isOverridden: false,
  },
  {
    id: 'gstr-1-monthly',
    returnType: 'GSTR-1 (Monthly Outward)',
    category: 'MONTHLY',
    period: 'Monthly (July 2026)',
    defaultDueDate: '11 Aug 2026',
    defaultTimestamp: new Date('2026-08-11').getTime(),
    currentDueDate: '11 Aug 2026',
    currentTimestamp: new Date('2026-08-11').getTime(),
    isOverridden: false,
  },
  {
    id: 'iff-qrmp',
    returnType: 'IFF (QRMP Invoice Facility)',
    category: 'QRMP',
    period: 'QRMP Month 1 (July 2026)',
    defaultDueDate: '13 Aug 2026',
    defaultTimestamp: new Date('2026-08-13').getTime(),
    currentDueDate: '13 Aug 2026',
    currentTimestamp: new Date('2026-08-13').getTime(),
    isOverridden: false,
  },
  {
    id: 'gstr-1-qrmp',
    returnType: 'GSTR-1 (Quarterly QRMP)',
    category: 'QRMP',
    period: 'Q1 (Apr - Jun 2026)',
    defaultDueDate: '13 Jul 2026',
    defaultTimestamp: new Date('2026-07-13').getTime(),
    currentDueDate: '13 Jul 2026',
    currentTimestamp: new Date('2026-07-13').getTime(),
    isOverridden: false,
  },
  {
    id: 'cmp-08',
    returnType: 'CMP-08 (Composition Statement)',
    category: 'COMPOSITION',
    period: 'Q1 (Apr - Jun 2026)',
    defaultDueDate: '18 Jul 2026',
    defaultTimestamp: new Date('2026-07-18').getTime(),
    currentDueDate: '18 Jul 2026',
    currentTimestamp: new Date('2026-07-18').getTime(),
    isOverridden: false,
  },
  {
    id: 'gstr-3b-monthly',
    returnType: 'GSTR-3B (Monthly Summary)',
    category: 'MONTHLY',
    period: 'Monthly (July 2026)',
    defaultDueDate: '20 Aug 2026',
    defaultTimestamp: new Date('2026-08-20').getTime(),
    currentDueDate: '20 Aug 2026',
    currentTimestamp: new Date('2026-08-20').getTime(),
    isOverridden: false,
  },
  {
    id: 'gstr-3b-qrmp-grp1',
    returnType: 'GSTR-3B (QRMP State Group 1)',
    category: 'QRMP',
    period: 'Q1 (Apr - Jun 2026)',
    defaultDueDate: '22 Jul 2026',
    defaultTimestamp: new Date('2026-07-22').getTime(),
    currentDueDate: '22 Jul 2026',
    currentTimestamp: new Date('2026-07-22').getTime(),
    isOverridden: false,
  },
  {
    id: 'gstr-3b-qrmp-grp2',
    returnType: 'GSTR-3B (QRMP State Group 2)',
    category: 'QRMP',
    period: 'Q1 (Apr - Jun 2026)',
    defaultDueDate: '24 Jul 2026',
    defaultTimestamp: new Date('2026-07-24').getTime(),
    currentDueDate: '24 Jul 2026',
    currentTimestamp: new Date('2026-07-24').getTime(),
    isOverridden: false,
  },
  {
    id: 'pmt-06',
    returnType: 'PMT-06 (QRMP Monthly Challan)',
    category: 'QRMP',
    period: 'QRMP Month 1 (July 2026)',
    defaultDueDate: '25 Aug 2026',
    defaultTimestamp: new Date('2026-08-25').getTime(),
    currentDueDate: '25 Aug 2026',
    currentTimestamp: new Date('2026-08-25').getTime(),
    isOverridden: false,
  },
  {
    id: 'itc-04',
    returnType: 'ITC-04 (Job Work Statement)',
    category: 'OTHER',
    period: 'H1 (Apr - Sep 2026)',
    defaultDueDate: '25 Oct 2026',
    defaultTimestamp: new Date('2026-10-25').getTime(),
    currentDueDate: '25 Oct 2026',
    currentTimestamp: new Date('2026-10-25').getTime(),
    isOverridden: false,
  },
  {
    id: 'gstr-9-9c',
    returnType: 'GSTR-9 & 9C (Annual Return & Reco)',
    category: 'ANNUAL',
    period: 'FY 2025-26',
    defaultDueDate: '31 Dec 2026',
    defaultTimestamp: new Date('2026-12-31').getTime(),
    currentDueDate: '31 Dec 2026',
    currentTimestamp: new Date('2026-12-31').getTime(),
    isOverridden: false,
  },
  {
    id: 'gstr-4',
    returnType: 'GSTR-4 (Composition Annual)',
    category: 'COMPOSITION',
    period: 'FY 2025-26',
    defaultDueDate: '30 Apr 2027',
    defaultTimestamp: new Date('2027-04-30').getTime(),
    currentDueDate: '30 Apr 2027',
    currentTimestamp: new Date('2027-04-30').getTime(),
    isOverridden: false,
  },
];

const OVERRIDES_STORAGE_KEY = 'gsthub_calendar_overrides';
const CUSTOM_RETURNS_STORAGE_KEY = 'gsthub_custom_returns';

export function getActiveCalendar(): StatutoryReturnEntry[] {
  if (typeof window === 'undefined') {
    return [...DEFAULT_STATUTORY_CALENDAR].sort((a, b) => a.currentTimestamp - b.currentTimestamp);
  }

  try {
    const rawOverrides = localStorage.getItem(OVERRIDES_STORAGE_KEY);
    const rawCustom = localStorage.getItem(CUSTOM_RETURNS_STORAGE_KEY);

    const overrides: Record<string, { dueDate: string; extensionNote?: string }> = rawOverrides ? JSON.parse(rawOverrides) : {};
    const customReturns: StatutoryReturnEntry[] = rawCustom ? JSON.parse(rawCustom) : [];

    const baseMerged = DEFAULT_STATUTORY_CALENDAR.map((entry) => {
      const override = overrides[entry.id];
      if (override && override.dueDate) {
        const parsed = new Date(override.dueDate);
        return {
          ...entry,
          currentDueDate: override.dueDate,
          currentTimestamp: isNaN(parsed.getTime()) ? entry.defaultTimestamp : parsed.getTime(),
          isOverridden: true,
          extensionNote: override.extensionNote,
        };
      }
      return entry;
    });

    const customMerged = customReturns.map((entry) => {
      const override = overrides[entry.id];
      if (override && override.dueDate) {
        const parsed = new Date(override.dueDate);
        return {
          ...entry,
          currentDueDate: override.dueDate,
          currentTimestamp: isNaN(parsed.getTime()) ? entry.defaultTimestamp : parsed.getTime(),
          isOverridden: true,
          extensionNote: override.extensionNote,
          isCustom: true,
        };
      }
      return { ...entry, isCustom: true };
    });

    const all = [...baseMerged, ...customMerged];
    return all.sort((a, b) => a.currentTimestamp - b.currentTimestamp);
  } catch {
    return [...DEFAULT_STATUTORY_CALENDAR].sort((a, b) => a.currentTimestamp - b.currentTimestamp);
  }
}

export function saveCalendarOverride(id: string, dueDate: string, extensionNote?: string) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(OVERRIDES_STORAGE_KEY);
    const overrides: Record<string, { dueDate: string; extensionNote?: string }> = raw ? JSON.parse(raw) : {};
    overrides[id] = { dueDate, extensionNote };
    localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
  } catch (err) {
    console.error('Failed to save calendar override:', err);
  }
}

export function addCustomReturn(returnType: string, category: StatutoryReturnEntry['category'], period: string, dueDate: string) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(CUSTOM_RETURNS_STORAGE_KEY);
    const customList: StatutoryReturnEntry[] = raw ? JSON.parse(raw) : [];

    const id = `custom-${Date.now()}`;
    const parsed = new Date(dueDate);
    const timestamp = isNaN(parsed.getTime()) ? Date.now() : parsed.getTime();

    const newEntry: StatutoryReturnEntry = {
      id,
      returnType: returnType.trim(),
      category,
      period: period.trim(),
      defaultDueDate: dueDate.trim(),
      defaultTimestamp: timestamp,
      currentDueDate: dueDate.trim(),
      currentTimestamp: timestamp,
      isOverridden: false,
      isCustom: true,
    };

    customList.push(newEntry);
    localStorage.setItem(CUSTOM_RETURNS_STORAGE_KEY, JSON.stringify(customList));
  } catch (err) {
    console.error('Failed to add custom return:', err);
  }
}

export function deleteCustomReturn(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(CUSTOM_RETURNS_STORAGE_KEY);
    if (!raw) return;
    const customList: StatutoryReturnEntry[] = JSON.parse(raw);
    const filtered = customList.filter((item) => item.id !== id);
    localStorage.setItem(CUSTOM_RETURNS_STORAGE_KEY, JSON.stringify(filtered));

    // Also remove override if any
    const rawOverrides = localStorage.getItem(OVERRIDES_STORAGE_KEY);
    if (rawOverrides) {
      const overrides = JSON.parse(rawOverrides);
      delete overrides[id];
      localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
    }
  } catch (err) {
    console.error('Failed to delete custom return:', err);
  }
}

export function resetCalendarToDefaults() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(OVERRIDES_STORAGE_KEY);
    localStorage.removeItem(CUSTOM_RETURNS_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to reset calendar:', err);
  }
}
