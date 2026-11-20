'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, GraduationCap, Calendar, CheckSquare, Clock, FileText } from 'lucide-react';

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; fullName: string; email: string } | null>(null);
  const [studentProfile, setStudentProfile] = useState<{
    id: string;
    studentCode: string;
    class?: { id: string; name: string };
  } | null>(null);
  const [stats, setStats] = useState({ subjects: 0, attendanceRate: '0%', gpa: 0 });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'STUDENT') {
      router.push('/login');
      return;
    }
    setUser(parsedUser);

    const loadStudentData = async () => {
      try {
        const studentRes = await api.get('/students');
        const myStudent = studentRes.data.find((s: { user: { id: string } }) => s.user.id === parsedUser.id);
        if (myStudent) {
          setStudentProfile(myStudent);

          // Report card data for GPA and grades
          const [rcRes, attRes] = await Promise.all([
            api.get(`/grades/report-card/${myStudent.id}`).catch(() => null),
            api.get(`/attendance/student/${myStudent.id}`).catch(() => null),
          ]);

          let rate = '100%';
          if (attRes && attRes.data && attRes.data.length > 0) {
            const present = attRes.data.filter((a: { status: string }) => a.status === 'PRESENT').length;
            rate = `${((present / attRes.data.length) * 100).toFixed(0)}%`;
          }

          setStats({
            subjects: rcRes?.data?.academicPerformance?.totalSubjects || 0,
            attendanceRate: rate,
            gpa: rcRes?.data?.academicPerformance?.gpa || 0,
          });
        }
      } catch (err) {
        console.error('Failed loading student dashboard', err);
      }
    };

    loadStudentData();
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Student Portal</h1>
            <p className="text-slate-500">
              Welcome back, <span className="font-semibold text-slate-800">{user?.fullName}</span> | Code:{' '}
              <span className="font-mono text-blue-600">{studentProfile?.studentCode || 'N/A'}</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Class Section: <span className="font-medium text-slate-600">{studentProfile?.class?.name || 'Assigned Class'}</span>
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        {/* Quick KPI Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-blue-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Current GPA</CardTitle>
              <GraduationCap className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">{stats.gpa} / 4.0</div>
              <p className="text-xs text-slate-500 mt-1">Based on latest semester results</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Attendance Rate</CardTitle>
              <CheckSquare className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-700">{stats.attendanceRate}</div>
              <p className="text-xs text-slate-500 mt-1">Verified daily by Room Teacher</p>
            </CardContent>
          </Card>

          <Card className="border-indigo-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Enrolled Subjects</CardTitle>
              <BookOpen className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-700">{stats.subjects} Subjects</div>
              <p className="text-xs text-slate-500 mt-1">Active curriculum coursework</p>
            </CardContent>
          </Card>
        </div>

        {/* Student Feature Navigation Modules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/student/resources')}>
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg">24/7 Learning Hub</CardTitle>
                <p className="text-xs text-slate-500">Digital library: lesson notes, ebooks & videos</p>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full">
                Open Learning Hub
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/student/grades')}>
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="p-3 bg-purple-100 text-purple-700 rounded-lg">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg">Grades & Report Card</CardTitle>
                <p className="text-xs text-slate-500">View scores and printable digital report cards</p>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full">
                View Report Card
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/student/exams')}>
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-lg">
                <CheckSquare className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg">Objective Exams & Quizzes</CardTitle>
                <p className="text-xs text-slate-500">Take automated objective tests with instant marking</p>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full">
                Take Exams
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/student/timetable')}>
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="p-3 bg-teal-100 text-teal-700 rounded-lg">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg">Class Timetable</CardTitle>
                <p className="text-xs text-slate-500">Weekly schedule of subject periods</p>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full">
                View Timetable
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/student/attendance')}>
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-lg">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg">Attendance History</CardTitle>
                <p className="text-xs text-slate-500">Room-Teacher verified records & status</p>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full">
                View Attendance
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
