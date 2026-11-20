'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarDays, AlertTriangle, Info } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface TimetableEntry {
  id: string;
  day: string; // e.g. 'MONDAY'
  period: number;
  startTime: string;
  endTime: string;
  subject: { name: string };
  teacher: { user: { name: string } };
}

// ── Constants ──────────────────────────────────────────────────────────────────

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const;
const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
};

const PERIODS = [1, 2, 3, 4, 5, 6];

// ── Page ───────────────────────────────────────────────────────────────────────

export default function StudentTimetablePage() {
  const router = useRouter();

  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [classId, setClassId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Auth guard & fetch ─────────────────────────────────────────────────────

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(userData);
    if (user.role !== 'STUDENT') {
      router.push('/login');
      return;
    }

    const cid: string | undefined = user.student?.classId;
    setClassId(cid ?? null);

    if (!cid) {
      setLoading(false);
      return;
    }

    const fetchTimetable = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/timetable/class/${cid}`);
        setTimetable(res.data);
      } catch {
        setError('Failed to load timetable. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, [router]);

  // ── Build lookup: period × day → entry ────────────────────────────────────

  const cellMap: Record<string, TimetableEntry> = {};
  for (const entry of timetable) {
    cellMap[`${entry.period}-${entry.day}`] = entry;
  }

  // ── Gather unique time labels per period (from data, fallback to period #) ──

  const periodTimes: Record<number, { start: string; end: string }> = {};
  for (const entry of timetable) {
    if (!periodTimes[entry.period]) {
      periodTimes[entry.period] = { start: entry.startTime, end: entry.endTime };
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/student')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Portal
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <CalendarDays className="h-7 w-7 text-blue-600" />
              Weekly Timetable
            </h1>
            <p className="text-slate-500">Your class schedule for the current term</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="text-center py-16 text-slate-500">Loading timetable...</div>
        ) : classId === null ? (
          /* No class assigned */
          <Card className="border border-amber-200 bg-amber-50">
            <CardContent className="p-8 text-center space-y-3">
              <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
              <p className="text-amber-800 font-semibold text-lg">
                You are not assigned to a class yet
              </p>
              <p className="text-amber-700 text-sm">
                Please contact your administrator to be assigned to a class.
              </p>
            </CardContent>
          </Card>
        ) : timetable.length === 0 ? (
          /* Empty timetable */
          <Card>
            <CardContent className="p-10 text-center space-y-3">
              <Info className="h-10 w-10 text-slate-400 mx-auto" />
              <p className="text-slate-600 font-semibold text-lg">No timetable available</p>
              <p className="text-slate-400 text-sm">
                Your class timetable has not been set up yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          /* Timetable grid */
          <Card className="overflow-hidden shadow-sm">
            <CardHeader className="border-b bg-white pb-4">
              <CardTitle className="text-base text-slate-700">Class Schedule Grid</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm border-collapse min-w-[640px]">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wide w-24 border-r border-slate-700">
                      Period
                    </th>
                    {DAYS.map((day) => (
                      <th
                        key={day}
                        className="py-3 px-4 text-center font-semibold text-xs uppercase tracking-wide border-r border-slate-700 last:border-r-0"
                      >
                        {DAY_LABELS[day]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map((period, pi) => {
                    const times = periodTimes[period];
                    return (
                      <tr
                        key={period}
                        className={pi % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                      >
                        {/* Period label */}
                        <td className="py-3 px-4 border-r border-slate-200 align-top">
                          <span className="font-bold text-slate-700 block">P{period}</span>
                          {times && (
                            <span className="text-xs text-slate-400 block leading-tight">
                              {times.start}–{times.end}
                            </span>
                          )}
                        </td>

                        {/* Day cells */}
                        {DAYS.map((day) => {
                          const entry = cellMap[`${period}-${day}`];
                          return (
                            <td
                              key={day}
                              className="py-3 px-4 border-r border-slate-200 last:border-r-0 align-top text-center"
                            >
                              {entry ? (
                                <div className="inline-block text-left">
                                  <span className="block font-semibold text-slate-900 text-sm leading-snug">
                                    {entry.subject.name}
                                  </span>
                                  <span className="block text-xs text-slate-500 mt-0.5">
                                    {entry.teacher.user.name}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-300 font-medium">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
