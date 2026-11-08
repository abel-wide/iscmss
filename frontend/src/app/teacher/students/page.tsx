'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Student {
  id: string;
  studentCode: string;
  user: { fullName: string; email: string };
  class?: { name: string };
}

export default function TeacherStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchStudents = async () => {
      try {
        const res = await api.get('/students');
        setStudents(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [router]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <Button variant="outline" onClick={() => router.push('/teacher')}>
          ← Back to Dashboard
        </Button>
        
        <div className="mt-4 mb-6">
          <h1 className="text-2xl font-bold">My Students</h1>
          <p className="text-slate-500">View all students registered in the system</p>
        </div>

        <Card>
          <CardHeader><CardTitle>Student List</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {students.map((s) => (
                <div key={s.id} className="flex justify-between items-center p-4 border rounded-lg bg-white">
                  <div>
                    <p className="font-semibold">{s.user.fullName}</p>
                    <p className="text-sm text-slate-500">
                      {s.studentCode} • {s.class?.name || 'No Class'} • {s.user.email}
                    </p>
                  </div>
                </div>
              ))}
              {students.length === 0 && (
                <p className="text-slate-500">No students found.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}