'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

interface ClassData {
  id: string;
  name: string;
  gradeLevel: number;
  _count?: { students: number };
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. 'user' ስቴትን መጀመሪያ ላይ በቀጥታ ከ localStorage አንብብ (ESLint እንዳይነሳ)
  const [user] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // የተጠቃሚው መረጃ ከሌለ ወይም ሮሉ ትክክል ካልሆነ ወደ ሎጊን መላክ
    if (!token || !user || (user.role !== 'TEACHER' && user.role !== 'ROOM_TEACHER')) {
      router.push('/login');
      return;
    }

    // 2. መረጃዎችን ከ Backend አምጣ
    const fetchClasses = async () => {
      try {
        const res = await api.get('/classes');
        setClasses(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false); // 'setLoading' በ async ተግባር ውስጥ ስለሆነ ESLint አይይዘውም
      }
    };
    fetchClasses();
  }, [router, user]); // 'user' ን በ dependency array ውስጥ ጨምረነዋል

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
            <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
            <p className="text-slate-500">Welcome, {user?.fullName || 'Teacher'}</p>
          </div>
          <Button variant="destructive" onClick={handleLogout}>Logout</Button>
        </div>

        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex items-center gap-3">
          <span className="text-xl">📋</span>
          <div>
            <p className="font-semibold text-sm">Attendance Policy Notice</p>
            <p className="text-xs text-amber-700">Per institutional policy, daily student attendance can only be marked by the designated Room Teacher assigned to that class (or an Admin override).</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Button onClick={() => router.push('/teacher/attendance')} className="h-20 text-base flex flex-col items-center justify-center gap-1">
            <span>📅</span>
            <span>Take Attendance</span>
          </Button>
          <Button onClick={() => router.push('/teacher/grades')} className="h-20 text-base flex flex-col items-center justify-center gap-1">
            <span>📝</span>
            <span>Enter Grades</span>
          </Button>
          <Button onClick={() => router.push('/teacher/timetable')} variant="outline" className="h-20 text-base flex flex-col items-center justify-center gap-1 bg-white">
            <span>🗓️</span>
            <span>Class Timetable</span>
          </Button>
          <Button onClick={() => router.push('/teacher/resources')} variant="outline" className="h-20 text-base flex flex-col items-center justify-center gap-1 bg-white">
            <span>📚</span>
            <span>Resources</span>
          </Button>
          <Button onClick={() => router.push('/teacher/students')} variant="outline" className="h-20 text-base flex flex-col items-center justify-center gap-1 bg-white">
            <span>👥</span>
            <span>Students</span>
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle>My Classes</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {classes.map((c) => (
                <div key={c.id} className="flex justify-between items-center p-4 border rounded-lg bg-white">
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-sm text-slate-500">Grade {c.gradeLevel} • {c._count?.students || 0} students</p>
                  </div>
                </div>
              ))}
              {classes.length === 0 && <p className="text-slate-500">No classes assigned.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}