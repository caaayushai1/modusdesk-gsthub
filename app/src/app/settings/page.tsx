'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  RotateCcw, 
  Check, 
  Edit2, 
  X, 
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { 
  StatutoryReturnEntry, 
  getActiveCalendar, 
  saveCalendarOverride, 
  addCustomReturn,
  deleteCustomReturn,
  resetCalendarToDefaults 
} from '@/lib/compliance-calendar';

export default function SettingsPage() {
  const [calendarEntries, setCalendarEntries] = useState<StatutoryReturnEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editNote, setEditNote] = useState('');
  
  // Add Return Modal / Form state
  const [isAddingReturn, setIsAddingReturn] = useState(false);
  const [newReturnName, setNewReturnName] = useState('');
  const [newCategory, setNewCategory] = useState<StatutoryReturnEntry['category']>('MONTHLY');
  const [newPeriod, setNewPeriod] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadCalendar = () => {
    setCalendarEntries(getActiveCalendar());
  };

  useEffect(() => {
    loadCalendar();
  }, []);

  const handleStartEdit = (entry: StatutoryReturnEntry) => {
    setEditingId(entry.id);
    setEditDate(entry.currentDueDate);
    setEditNote(entry.extensionNote || '');
    setSavedSuccess(false);
  };

  const handleSave = (id: string) => {
    if (!editDate) return;
    saveCalendarOverride(id, editDate, editNote.trim() || undefined);
    setEditingId(null);
    loadCalendar();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReturnName.trim() || !newDueDate.trim()) return;

    addCustomReturn(
      newReturnName.trim(),
      newCategory,
      newPeriod.trim() || 'Custom Period',
      newDueDate.trim()
    );

    setIsAddingReturn(false);
    setNewReturnName('');
    setNewPeriod('');
    setNewDueDate('');
    loadCalendar();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this custom return type?')) {
      deleteCustomReturn(id);
      loadCalendar();
    }
  };

  const handleResetAll = () => {
    if (window.confirm('Reset all statutory returns to standard CGST Act defaults?')) {
      resetCalendarToDefaults();
      setEditingId(null);
      loadCalendar();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl animate-in fade-in duration-200">
      {/* Simple Clean Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          Settings
        </h1>
        {savedSuccess && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            Calendar updated successfully
          </span>
        )}
      </div>

      {/* Statutory Calendar Management Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/60">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-[13px] font-bold text-slate-900">
                Statutory GST Compliance Calendar
              </h2>
              <p className="text-[11px] text-slate-500">
                Manage due dates, add new return types, and attach CBIC notification extension remarks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => setIsAddingReturn(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Return Type</span>
            </button>

            <button
              onClick={handleResetAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>

        {/* Add Return Form Popup / Inset */}
        {isAddingReturn && (
          <form onSubmit={handleAddCustom} className="p-4 bg-emerald-50/40 border-b border-emerald-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900">Add New Statutory Return Type</h3>
              <button
                type="button"
                onClick={() => setIsAddingReturn(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="space-y-1 sm:col-span-1">
                <label className="text-[10.5px] font-semibold text-slate-600">Return Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GSTR-5 / ITC-01"
                  value={newReturnName}
                  onChange={(e) => setNewReturnName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-semibold text-slate-600">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="QRMP">QRMP</option>
                  <option value="COMPOSITION">Composition</option>
                  <option value="ANNUAL">Annual</option>
                  <option value="OTHER">Other / Ad-hoc</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-semibold text-slate-600">Period / Frequency</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly (July 2026)"
                  value={newPeriod}
                  onChange={(e) => setNewPeriod(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-semibold text-slate-600">Due Date</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 20 Aug 2026"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingReturn(false)}
                className="px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
              >
                Save Return
              </button>
            </div>
          </form>
        )}

        {/* Table of returns */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-2.5 px-4">Return Type</th>
                <th className="py-2.5 px-4">Frequency</th>
                <th className="py-2.5 px-4">Default Statutory Date</th>
                <th className="py-2.5 px-4">Active Cut-Off Date</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {calendarEntries.map((entry) => {
                const isEditing = editingId === entry.id;

                return (
                  <React.Fragment key={entry.id}>
                    <tr className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{entry.returnType}</span>
                          {entry.isCustom && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              Custom
                            </span>
                          )}
                          {entry.isOverridden && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              Extended
                            </span>
                          )}
                        </div>
                        {entry.extensionNote && (
                          <p className="text-[10.5px] text-amber-700 font-normal mt-0.5">
                            📌 {entry.extensionNote}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {entry.period}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {entry.defaultDueDate}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900 text-[11.5px]">
                        {entry.currentDueDate}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
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
                              title="Save"
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
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleStartEdit(entry)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3 text-slate-400" />
                              <span>Edit</span>
                            </button>

                            {entry.isCustom && (
                              <button
                                onClick={() => handleDelete(entry.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete custom return"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                    {isEditing && (
                      <tr className="bg-slate-50/70 border-b border-slate-100">
                        <td colSpan={5} className="px-4 py-2">
                          <input
                            type="text"
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            placeholder="Optional Official Notification Note (e.g. CBIC Notification No. 15/2026)"
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-emerald-500 bg-white"
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
