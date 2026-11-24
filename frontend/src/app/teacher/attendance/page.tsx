'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Calendar,
  Users,
  CheckSquare,
} from 'lucide-react';

interface ClassData {
  id: string;
  name: string;
}

interface Student {
  id: string;
  user: { fullName: string };
  studentCode: string;
  class?: { id: string };
}

export default function AttendancePage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [date, setDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setDate(new Date().toISOString().split('T')[0]);
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    api.get('/classes')
      .then((res) => setClasses(Array.isArray(res.data) ? res.data : []))
      .catch(() => setClasses([]));
  }, [router]);

  const loadStudents = async (classId: string) => {
    setSelectedClass(classId);
    setSearchQuery('');
    setFeedback(null);
    if (!classId) {
      setStudents([]);
      return;
    }
    try {
      const res = await api.get('/students');
      const allStudents: Student[] = Array.isArray(res.data) ? res.data : [];
      const filtered = allStudents.filter((s) => s.class?.id === classId || !s.class);
      setStudents(filtered);
      const initial: Record<string, string> = {};
      filtered.forEach((s) => (initial[s.id] = 'PRESENT'));
      setAttendance(initial);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.user?.fullName?.toLowerCase().includes(q) ||
        s.studentCode?.toLowerCase().includes(q),
    );
  }, [students, searchQuery]);

  const markAllAs = (status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    const updated = { ...attendance };
    students.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendance(updated);
  };

  const countStatus = (status: string) => {
    return Object.values(attendance).filter((st) => st === status).length;
  };

  const handleSubmit = async () => {
    if (!selectedClass) {
      setFeedback({ type: 'error', text: 'Please select a class first.' });
      return;
    }
    if (students.length === 0) {
      setFeedback({ type: 'error', text: 'No students found in this class.' });
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);

      const payload = {
        attendances: students.map((s) => ({
          studentId: s.id,
          classId: selectedClass,
          date,
          status: attendance[s.id] || 'PRESENT',
          method: 'TEACHER',
        })),
      };

      await api.post('/attendance/bulk', payload);
      setFeedback({
        type: 'success',
        text: `Attendance for ${students.length} student(s) on ${date} saved successfully!`,
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setFeedback({
        type: 'error',
        text: error.response?.data?.message || 'Error saving attendance. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => router.push('/teacher')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <CheckSquare className="h-6 w-6 text-blue-600" /> Take Class Attendance
            </h1>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between shadow-sm ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="text-sm font-medium">{feedback.text}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-xs underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Selection Card */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-white border-b pb-4">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" /> 1. Select Class & Date
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">
                  Select Class
                </Label>
                <select
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  value={selectedClass}
                  onChange={(e) => loadStudents(e.target.value)}
                >
                  <option value="">-- Choose Class --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase text-slate-500 mb-1 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Date
                </Label>
                <Input
                  type="date"
                  className="w-full"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Attendance Roster */}
        {selectedClass && (
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-white border-b pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-800">
                    Student Attendance Roster
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    Total: {students.length} students enrolled
                  </p>
                </div>

                {/* Quick actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => markAllAs('PRESENT')}
                  >
                    All Present
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() => markAllAs('ABSENT')}
                  >
                    All Absent
                  </Button>
                </div>
              </div>

              {/* Status tally counters */}
              <div className="grid grid-cols-3 gap-3 pt-3">
                <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Present
                  </span>
                  <span className="font-bold text-sm text-emerald-900">
                    {countStatus('PRESENT')}
                  </span>
                </div>
                <div className="p-2.5 bg-red-50 rounded-lg border border-red-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-red-800 flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5" /> Absent
                  </span>
                  <span className="font-bold text-sm text-red-900">
                    {countStatus('ABSENT')}
                  </span>
                </div>
                <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-amber-800 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Late
                  </span>
                  <span className="font-bold text-sm text-amber-900">
                    {countStatus('LATE')}
                  </span>
                </div>
              </div>

              {/* Search within class */}
              <div className="relative pt-3">
                <Search className="absolute left-3 top-5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search student by name or code in this class..."
                  className="pl-9 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-2">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  {students.length === 0
                    ? 'No students found in this class.'
                    : 'No students match your search filter.'}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredStudents.map((s) => {
                    const currentStatus = attendance[s.id] || 'PRESENT';
                    return (
                      <div
                        key={s.id}
                        className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-sm text-slate-900">{s.user.fullName}</p>
                          <p className="text-xs text-slate-400">ID: {s.studentCode || 'N/A'}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const).map((st) => {
                            const isSelected = currentStatus === st;
                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => setAttendance({ ...attendance, [s.id]: st })}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-all ${
                                  isSelected
                                    ? st === 'PRESENT'
                                      ? 'bg-emerald-600 text-white border-emerald-600'
                                      : st === 'ABSENT'
                                      ? 'bg-red-600 text-white border-red-600'
                                      : st === 'LATE'
                                      ? 'bg-amber-500 text-white border-amber-500'
                                      : 'bg-purple-600 text-white border-purple-600'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {st}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {students.length > 0 && (
                <div className="pt-4">
                  <Button
                    onClick={handleSubmit}
                    className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base font-semibold"
                    disabled={saving}
                  >
                    {saving ? 'Saving Attendance...' : 'Save & Submit Attendance'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
