/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

interface Student {
  id: string;
  studentCode: string;
  user: { fullName: string };
  class?: { name: string };
}

export default function ParentDashboard() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. የተጠቃሚውን መረጃ መጀመሪያ ላይ አንብብ
  const [user] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !user || user.role !== 'PARENT') {
      router.push('/login');
      return;
    }

    // 2. የልጁን መረጃ ከ localStorage ፈልግ
    let storedChild = localStorage.getItem('parentChild');
    
    // ካልተገኘ ለሙከራ የሚሆን ዳታ አስቀምጥ
    if (!storedChild) {
      const dummyChild = {
        id: 'dummy-id',
        studentCode: 'STU-2026-001',
        user: { fullName: 'Test Child' },
        class: { name: 'Grade 5A' },
      };
      localStorage.setItem('parentChild', JSON.stringify(dummyChild));
      storedChild = JSON.stringify(dummyChild);
    }

    setStudents([JSON.parse(storedChild)]);
    setLoading(false);
  }, [router, user]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Parent Portal</h1>
            <p className="text-slate-500">Welcome, {user?.fullName || 'Parent'}</p>
          </div>
          <Button variant="destructive" onClick={handleLogout}>Logout</Button>
        </div>

        <Card>
          <CardHeader><CardTitle>My Children</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {students.map((s) => (
                <div key={s.id} className="flex justify-between items-center p-4 border rounded-lg bg-white">
                  <div>
                    <p className="font-semibold">{s.user.fullName}</p>
                    <p className="text-sm text-slate-500">
                      {s.studentCode} • {s.class?.name || 'No Class'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => router.push(`/parent/attendance/${s.id}`)}>Attendance</Button>
                    <Button size="sm" onClick={() => router.push(`/parent/grades/${s.id}`)}>Grades</Button>
                    <Button size="sm" onClick={() => router.push('/parent/payments')}>Payments</Button>
                  </div>
                </div>
              ))}
              {students.length === 0 && <p className="text-slate-500">No children registered.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}