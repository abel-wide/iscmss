'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Attendance {
  id: string;
  date: string;
  status: string;
}

// 1. ዋናው አካል (ከ useParams ጋር)
function AttendanceContent() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;
  
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchAttendances = async () => {
      try {
        const res = await api.get(`/attendance/student/${studentId}`);
        setAttendances(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendances();
  }, [router, studentId]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-3xl mx-auto">
        <Button variant="outline" onClick={() => router.push('/parent')}>← Back</Button>
        <h1 className="text-2xl font-bold my-4">Attendance History</h1>

        <Card>
          <CardHeader><CardTitle>Records</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {attendances.map((a) => (
                <div key={a.id} className="flex justify-between items-center p-3 border rounded">
                  <p>{new Date(a.date).toLocaleDateString()}</p>
                  <span className={`px-2 py-1 rounded text-sm ${
                    a.status === 'PRESENT' ? 'bg-green-100 text-green-700' :
                    a.status === 'ABSENT' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {a.status}
                  </span>
                </div>
              ))}
              {attendances.length === 0 && <p className="text-slate-500">No attendance records.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// 2. ገጹ ሲጫን Suspense ን የሚጠቀም ዋና አካል
export default function ParentAttendancePage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <AttendanceContent />
    </Suspense>
  );
}