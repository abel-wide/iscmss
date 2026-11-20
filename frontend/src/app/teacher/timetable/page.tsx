'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ChevronLeft, AlertCircle } from 'lucide-react';

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
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
};
const PERIODS = [1, 2, 3, 4, 5, 6];

export default function TeacherTimetablePage() {
  const router = useRouter();
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [noClass, setNoClass] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }

    let parsed: { role?: string; teacher?: { classId?: string } };
    try {
      parsed = JSON.parse(userData);
    } catch {
      router.push('/login');
      return;
    }

    const allowedRoles = ['TEACHER', 'ROOM_TEACHER'];
    if (!parsed.role || !allowedRoles.includes(parsed.role)) {
      router.push('/login');
      return;
    }

    const loadTimetable = async () => {
      let classId = parsed.teacher?.classId;

      // Fallback: fetch profile from API if not in localStorage
      if (!classId) {
        try {
          const meRes = await api.get('/auth/me');
          classId = meRes.data?.teacher?.classId;
        } catch {
          // ignore, will show no-class state
        }
      }

      if (!classId) {
        setNoClass(true);
        setLoading(false);
        return;
      }

      try {
        const res = await api.get(`/timetable/class/${classId}`);
        setTimetable(res.data || []);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        setError(error.response?.data?.message || 'Failed to load timetable.');
      } finally {
        setLoading(false);
      }
    };

    loadTimetable();
  }, [router]);

  const getCell = (day: string, period: number): TimetableEntry | undefined =>
    timetable.find((e) => e.day === day && e.period === period);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/teacher')}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" /> My Timetable
            </h1>
            <p className="text-xs text-slate-500">Your weekly class schedule</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm">Loading timetable…</div>
        ) : noClass ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3">
            <AlertCircle className="h-12 w-12 text-amber-400" />
            <p className="text-base font-medium">You are not assigned to a class</p>
            <p className="text-sm text-slate-400">
              Please contact your school head to get assigned to a class.
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-red-500 space-y-3">
            <AlertCircle className="h-12 w-12" />
            <p className="text-sm">{error}</p>
          </div>
        ) : timetable.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-2">
            <Calendar className="h-12 w-12 opacity-30" />
            <p className="text-sm">No timetable has been generated for your class yet.</p>
          </div>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Weekly Schedule</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-indigo-50">
                    <th className="border border-slate-200 px-3 py-2.5 text-left text-slate-600 font-semibold w-20 bg-slate-100">
                      Period
                    </th>
                    {DAYS.map((d) => (
                      <th
                        key={d}
                        className="border border-slate-200 px-3 py-2.5 text-center text-indigo-700 font-semibold"
                      >
                        {DAY_LABELS[d]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map((p) => (
                    <tr key={p} className="hover:bg-slate-50">
                      <td className="border border-slate-200 px-3 py-2.5 text-center font-semibold text-slate-600 bg-slate-50">
                        Period {p}
                      </td>
                      {DAYS.map((d) => {
                        const cell = getCell(d, p);
                        return (
                          <td
                            key={d}
                            className="border border-slate-200 px-3 py-2.5 text-center align-top min-w-[140px]"
                          >
                            {cell ? (
                              <div className="space-y-1">
                                <p className="font-semibold text-indigo-700 text-xs">
                                  {cell.subject.name}
                                </p>
                                <p className="text-slate-400 text-xs">
                                  {cell.startTime}–{cell.endTime}
                                </p>
                              </div>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
