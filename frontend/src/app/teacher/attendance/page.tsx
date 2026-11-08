'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

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
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    api.get('/classes').then((res) => setClasses(res.data));
  }, [router]);

  const loadStudents = async (classId: string) => {
    setSelectedClass(classId);
    try {
      const res = await api.get('/students');
      // 'any' ን በ 'Student' ተካነዋል
      const filtered = res.data.filter((s: Student) => s.class?.id === classId);
      setStudents(filtered);
      const initial: Record<string, string> = {};
      filtered.forEach((s: Student) => (initial[s.id] = 'PRESENT'));
      setAttendance(initial);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    try {
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
      alert('Attendance saved successfully!');
    } catch (err: unknown) {
      // 'any' ን በ 'unknown' ተካነዋል
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Error saving attendance');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="outline" onClick={() => router.push('/teacher')}>← Back</Button>
        <h1 className="text-2xl font-bold my-4">Take Attendance</h1>

        <Card className="mb-6">
          <CardContent className="p-4 space-y-3">
            <div>
              <Label>Select Class</Label>
              <select
                className="w-full border rounded-md p-2 mt-1"
                value={selectedClass}
                onChange={(e) => loadStudents(e.target.value)}
              >
                <option value="">-- Select --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Date</Label>
              <input
                type="date"
                className="w-full border rounded-md p-2 mt-1"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {students.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Students</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {students.map((s) => (
                <div key={s.id} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-semibold">{s.user.fullName}</p>
                    <p className="text-sm text-slate-500">{s.studentCode}</p>
                  </div>
                  <select
                    className="border rounded-md p-2"
                    value={attendance[s.id] || 'PRESENT'}
                    onChange={(e) => setAttendance({ ...attendance, [s.id]: e.target.value })}
                  >
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="LATE">Late</option>
                    <option value="EXCUSED">Excused</option>
                  </select>
                </div>
              ))}
              <Button onClick={handleSubmit} className="w-full mt-4">Save Attendance</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}