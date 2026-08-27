'use client';

import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  RotateCcw, 
  Check, 
  Edit2, 
  Sparkles, 
  AlertCircle, 
  FileText 
} from 'lucide-react';
import { 
  StatutoryReturnEntry, 
  saveCalendarOverride, 
  resetCalendarToDefaults 
} from '@/lib/compliance-calendar';

interface CalendarSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: StatutoryReturnEntry[];
  onCalendarUpdated: () => void;
}

export function CalendarSettingsModal({
  isOpen,
  onClose,
  entries,
  onCalendarUpdated,
}: CalendarSettingsModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editNote, setEditNote] = useState('');

  if (!isOpen) return null;

  const handleStartEdit = (entry: StatutoryReturnEntry) => {
    setEditingId(entry.id);
    setEditDate(entry.currentDueDate);
    setEditNote(entry.extensionNote || '');
  };

  const handleSave = (id: string) => {
    if (!editDate) return;
    saveCalendarOverride(id, editDate, editNote.trim() || undefined);
    setEditingId(null);
    onCalendarUpdated();
  };

  const handleResetAll = () => {
    if (window.confirm('Reset all statutory returns to official standard CGST Act due dates?')) {
      resetCalendarToDefaults();
      setEditingId(null);
      onCalendarUpdated();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/60">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Centralized Statutory Calendar Settings
              </h2>
              <p className="text-[11px] text-slate-500">
                Override statutory cut-offs whenever CBIC notifies filing extensions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body List */}
        <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar divide-y divide-slate-100 flex-1 space-y-2">
          {entries.map((entry) => {
            const isEditing = editingId === entry.id;

            return (
              <div key={entry.id} className="pt-2 first:pt-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl hover:bg-slate-50/70 transition-colors">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {entry.returnType}
                      </span>
                      {entry.isOverridden && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          Extended
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>{entry.period}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-mono text-slate-700 font-semibold">
                        {entry.currentDueDate}
                      </span>
                    </div>
                    {entry.extensionNote && (
                      <p className="text-[10.5px] text-amber-700 font-medium">
                        📌 {entry.extensionNote}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex items-center gap-1.5 self-end sm:self-center">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          placeholder="e.g. 25 Aug 2026"
                          className="px-2 py-1 text-xs border border-slate-300 rounded-lg outline-none focus:border-emerald-500 w-28 font-mono"
                        />
                        <button
                          onClick={() => handleSave(entry.id)}
                          className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                          title="Save date"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartEdit(entry)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3 text-slate-400" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="px-3 pb-2 pt-1 bg-slate-50/50 rounded-lg mt-1 space-y-1">
                    <input
                      type="text"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder="Optional Notification Remark (e.g. CBIC Notification No. 18/2026)"
                      className="w-full px-2.5 py-1 text-[11px] border border-slate-200 rounded-lg outline-none focus:border-emerald-500 bg-white"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <button
            onClick={handleResetAll}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All to Defaults</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
