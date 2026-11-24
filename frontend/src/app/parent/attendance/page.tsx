'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  UserCheck,
} from 'lucide-react';

interface Student {
  id: string;
  studentCode: string;
  user: { fullName: string };
  class?: { name: string };
  parentId?: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  method: string;
}

export default function ParentAttendancePage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const loadAttendance = useCallback(async (sid: string) => {
    setSelectedStudentId(sid);
    setLoadingRecords(true);
    try {
      const res = await api.get(`/attendance/student/${sid}`).catch(() => ({ data: [] }));
      setRecords(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userStr);
    const parentId = user.parent?.id;

    api.get(parentId ? `/students?parentId=${parentId}` : '/students')
      .then((res) => {
        const list: Student[] = Array.isArray(res.data) ? res.data : [];
        const myStudents = parentId ? list.filter((s) => s.parentId === parentId) : list;
        setStudents(myStudents);
        if (myStudents.length > 0) {
          loadAttendance(myStudents[0].id);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [router, loadAttendance]);

  const selectedChild = students.find((s) => s.id === selectedStudentId);

  // Statistics
  const totalDays = records.length;
  const presentDays = records.filter((r) => r.status === 'PRESENT').length;
  const absentDays = records.filter((r) => r.status === 'ABSENT').length;
  const lateDays = records.filter((r) => r.status === 'LATE').length;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/parent')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-purple-600" /> Child Attendance Monitoring
          </h1>
        </div>

        {/* Children selector tabs */}
        {students.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-xs font-semibold uppercase text-slate-500 mr-2 flex items-center gap-1">
              <UserCheck className="h-3.5 w-3.5" /> Child:
            </span>
            {students.map((child) => (
              <Button
                key={child.id}
                size="sm"
                variant={selectedStudentId === child.id ? 'default' : 'outline'}
                className={selectedStudentId === child.id ? 'bg-purple-600 hover:bg-purple-700' : ''}
                onClick={() => loadAttendance(child.id)}
              >
                {child.user?.fullName} ({child.studentCode})
              </Button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-slate-500">Loading attendance data...</div>
        ) : students.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">
            No children registered under this account.
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-slate-500 uppercase">
                    Attendance Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-purple-700">{attendanceRate}%</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-emerald-600 uppercase">
                    Present Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-emerald-600">{presentDays}</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-red-600 uppercase">
                    Absent Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-600">{absentDays}</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-amber-600 uppercase">
                    Late Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-amber-600">{lateDays}</p>
                </CardContent>
              </Card>
            </div>

            {/* Attendance Roster */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="bg-white border-b pb-4">
                <CardTitle className="text-base font-semibold text-slate-800 flex items-center justify-between">
                  <span>Attendance History</span>
                  <span className="text-xs text-slate-500 font-normal">
                    {records.length} logged sessions
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loadingRecords ? (
                  <div className="text-center py-12 text-slate-500">Loading records...</div>
                ) : records.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    No attendance records found for this student.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {records.map((r) => (
                      <div
                        key={r.id}
                        className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-900">
                              {new Date(r.date).toLocaleDateString(undefined, {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                            <p className="text-xs text-slate-400">Method: {r.method || 'Teacher'}</p>
                          </div>
                        </div>

                        <div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              r.status === 'PRESENT'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.status === 'ABSENT'
                                ? 'bg-red-100 text-red-800'
                                : r.status === 'LATE'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {r.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
