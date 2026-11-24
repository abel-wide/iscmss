'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Calendar, ChevronLeft, RefreshCw, Zap } from 'lucide-react';

interface ClassItem {
  id: string;
  name: string;
  section?: string;
}

interface TimetableEntry {
  id: string;
  day: string;
  period: number;
  startTime: string;
  endTime: string;
  subject: { name: string };
  teacher: { user: { name: string } };
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
};
const PERIODS = [1, 2, 3, 4, 5, 6];

export default function HeadTimetablePage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loadingTimetable, setLoadingTimetable] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    const parsed = JSON.parse(userData);
    if (parsed.role !== 'HEAD' && parsed.role !== 'ADMIN') { router.push('/login'); return; }

    api.get('/classes')
      .then((res) => setClasses(res.data))
      .catch(() => setClasses([]));
  }, [router]);

  const fetchTimetable = useCallback(async (classId: string) => {
    if (!classId) return;
    setLoadingTimetable(true);
    try {
      const res = await api.get(`/timetable/class/${classId}`);
      setTimetable(res.data || []);
    } catch {
      setTimetable([]);
    } finally {
      setLoadingTimetable(false);
    }
  }, []);

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setTimetable([]);
    if (classId) fetchTimetable(classId);
  };

  const handleGenerate = async () => {
    if (!selectedClassId) return;
    setGenerating(true);
    try {
      await api.post(`/timetable/generate/${selectedClassId}`);
      showToast('success', 'Timetable generated successfully!');
      await fetchTimetable(selectedClassId);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast('error', error.response?.data?.message || 'Failed to generate timetable');
    } finally {
      setGenerating(false);
    }
  };

  const getCell = (day: string, period: number): TimetableEntry | undefined =>
    timetable.find((e) => e.day === day && e.period === period);

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/head')}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" /> Timetable Management
            </h1>
            <p className="text-xs text-slate-500">View and generate class timetables</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Class Selector */}
        <Card>
          <CardContent className="p-5 flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label className="mb-1 block text-sm font-medium text-slate-700">Select Class</Label>
              <select
                className="w-full border border-slate-200 rounded-md p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-300 outline-none"
                value={selectedClassId}
                onChange={(e) => handleClassChange(e.target.value)}
              >
                <option value="">-- Choose a class --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.section ? ` (${c.section})` : ''}
                  </option>
                ))}
              </select>
            </div>
            {selectedClassId && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchTimetable(selectedClassId)}
                  disabled={loadingTimetable}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${loadingTimetable ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {generating ? 'Generating…' : 'Auto-Generate Timetable'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Timetable Grid */}
        {selectedClassId && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Weekly Timetable
                {selectedClass && (
                  <span className="ml-2 text-slate-500 font-normal">
                    — {selectedClass.name}{selectedClass.section ? ` (${selectedClass.section})` : ''}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {loadingTimetable ? (
                <div className="p-10 text-center text-slate-400 text-sm">Loading timetable…</div>
              ) : timetable.length === 0 ? (
                <div className="p-10 text-center space-y-3">
                  <p className="text-slate-500 text-sm">No timetable found for this class.</p>
                  <Button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    {generating ? 'Generating…' : 'Auto-Generate Timetable'}
                  </Button>
                </div>
              ) : (
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-200 px-3 py-2 text-left text-slate-600 font-semibold w-20">
                        Period
                      </th>
                      {DAYS.map((d) => (
                        <th
                          key={d}
                          className="border border-slate-200 px-3 py-2 text-center text-slate-600 font-semibold"
                        >
                          {DAY_LABELS[d]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERIODS.map((p) => (
                      <tr key={p} className="hover:bg-slate-50">
                        <td className="border border-slate-200 px-3 py-2 text-center font-semibold text-slate-700 bg-slate-50">
                          P{p}
                        </td>
                        {DAYS.map((d) => {
                          const cell = getCell(d, p);
                          return (
                            <td
                              key={d}
                              className="border border-slate-200 px-3 py-2 text-center align-top min-w-[120px]"
                            >
                              {cell ? (
                                <div className="space-y-0.5">
                                  <p className="font-semibold text-indigo-700 text-xs">
                                    {cell.subject.name}
                                  </p>
                                  <p className="text-slate-500 text-xs">{cell.teacher.user.name}</p>
                                  <p className="text-slate-400 text-xs">
                                    {cell.startTime}–{cell.endTime}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        )}

        {!selectedClassId && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-2">
            <Calendar className="h-12 w-12 opacity-30" />
            <p className="text-sm">Select a class above to view or generate its timetable.</p>
          </div>
        )}
      </main>
    </div>
  );
}
