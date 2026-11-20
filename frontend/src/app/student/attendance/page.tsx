'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  method: string;
  class?: { name: string };
}

export default function StudentAttendancePage() {
  const router = useRouter();
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const userData = localStorage.getItem('user');
        if (!userData) {
          router.push('/login');
          return;
        }
        const user = JSON.parse(userData);
        const studentsRes = await api.get('/students');
        const myStudent = studentsRes.data.find((s: { user: { id: string } }) => s.user.id === user.id);

        if (myStudent) {
          const res = await api.get(`/attendance/student/${myStudent.id}`);
          setAttendances(res.data);
        }
      } catch (err) {
        console.error('Failed fetching attendance', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [router]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return (
          <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded text-xs font-semibold">
            <CheckCircle2 className="h-4 w-4" /> Present
          </span>
        );
      case 'ABSENT':
        return (
          <span className="flex items-center gap-1 text-red-700 bg-red-50 px-2 py-1 rounded text-xs font-semibold">
            <XCircle className="h-4 w-4" /> Absent
          </span>
        );
      case 'LATE':
        return (
          <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-1 rounded text-xs font-semibold">
            <Clock className="h-4 w-4" /> Late
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-1 rounded text-xs font-semibold">
            <AlertCircle className="h-4 w-4" /> Excused
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/student')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Portal
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Attendance Records</h1>
            <p className="text-slate-500">Daily verification conducted exclusively by your assigned Room Teacher</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-500">Loading attendance history...</div>
        ) : attendances.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border text-slate-500">
            No attendance recorded for your profile yet.
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Classroom Roll History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y border rounded-lg overflow-hidden">
                {attendances.map((rec) => (
                  <div key={rec.id} className="flex justify-between items-center p-4 bg-white hover:bg-slate-50">
                    <div>
                      <span className="font-semibold text-slate-900 block">
                        {new Date(rec.date).toLocaleDateString(undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="text-xs text-slate-400">Class: {rec.class?.name || 'Assigned Section'} | Method: Room Teacher Roll Call</span>
                    </div>
                    <div>{getStatusBadge(rec.status)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
