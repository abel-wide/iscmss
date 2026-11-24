'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, GraduationCap, BookOpen, BarChart2, Bell, Clock, 
  CheckSquare, DollarSign, LogOut, TrendingUp, Award
} from 'lucide-react';

interface Stats {
  teachers: number;
  students: number;
  classes: number;
  pendingPayments: number;
  attendanceRate: string;
}

export default function HeadDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [stats, setStats] = useState<Stats>({
    teachers: 0, students: 0, classes: 0, pendingPayments: 0, attendanceRate: '0%'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    const parsed = JSON.parse(userData);
    if (parsed.role !== 'HEAD' && parsed.role !== 'ADMIN') { router.push('/login'); return; }
    setUser(parsed);

    const loadStats = async () => {
      try {
        const [teachersRes, studentsRes, classesRes, paymentsRes, attRes] = await Promise.all([
          api.get('/users/teachers').catch(() => ({ data: [] })),
          api.get('/students').catch(() => ({ data: [] })),
          api.get('/classes').catch(() => ({ data: [] })),
          api.get('/payments?status=PENDING').catch(() => ({ data: [] })),
          api.get('/reports/attendance').catch(() => ({ data: { metrics: { attendanceRate: 'N/A' } } })),
        ]);
        setStats({
          teachers: teachersRes.data.length,
          students: studentsRes.data.length,
          classes: classesRes.data.length,
          pendingPayments: paymentsRes.data.length,
          attendanceRate: attRes.data?.metrics?.attendanceRate || 'N/A',
        });
      } catch (err) {
        console.error('Head dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [router]);

  const handleLogout = () => { localStorage.clear(); router.push('/login'); };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-slate-500">Loading Head Dashboard...</div></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">School Head Dashboard</h1>
            <p className="text-sm text-slate-500">Welcome, {user?.fullName} — Principal & Academic Head</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Teachers', value: stats.teachers, icon: <Users className="h-5 w-5 text-blue-600" />, color: 'blue' },
            { label: 'Total Students', value: stats.students, icon: <GraduationCap className="h-5 w-5 text-emerald-600" />, color: 'emerald' },
            { label: 'Active Classes', value: stats.classes, icon: <BookOpen className="h-5 w-5 text-indigo-600" />, color: 'indigo' },
            { label: 'Pending Fees', value: stats.pendingPayments, icon: <DollarSign className="h-5 w-5 text-amber-600" />, color: 'amber' },
            { label: 'Attendance Rate', value: stats.attendanceRate, icon: <CheckSquare className="h-5 w-5 text-teal-600" />, color: 'teal' },
          ].map((s, i) => (
            <Card key={i} className="shadow-sm">
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center justify-between mb-2">{s.icon}<span className="text-xs text-slate-500 font-medium">{s.label}</span></div>
                <div className="text-2xl font-bold text-slate-900">{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Reports Access Section */}
        <div>
          <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-slate-600" /> Analytical Reports
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Attendance Report', desc: 'Absenteeism rates & trends by class', icon: <CheckSquare className="h-6 w-6" />, path: '/head/reports/attendance', color: 'bg-blue-50 text-blue-700' },
              { title: 'Academic Report', desc: 'Pass rates, subject averages & top performers', icon: <Award className="h-6 w-6" />, path: '/head/reports/academics', color: 'bg-purple-50 text-purple-700' },
              { title: 'Fee Collection Report', desc: 'Revenue recovery & outstanding balances', icon: <DollarSign className="h-6 w-6" />, path: '/head/reports/fees', color: 'bg-amber-50 text-amber-700' },
              { title: 'Teacher Performance', desc: 'Grade submissions & compliance overview', icon: <TrendingUp className="h-6 w-6" />, path: '/head/reports/teachers', color: 'bg-emerald-50 text-emerald-700' },
            ].map((r, i) => (
              <Card key={i} className="hover:shadow-md cursor-pointer transition" onClick={() => router.push(r.path)}>
                <CardHeader className="pb-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${r.color} mb-2`}>{r.icon}</div>
                  <CardTitle className="text-sm">{r.title}</CardTitle>
                </CardHeader>
                <CardContent><p className="text-xs text-slate-500">{r.desc}</p></CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-slate-600" /> Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-14 flex flex-col gap-1 text-sm" onClick={() => router.push('/admin')}>
              <Users className="h-4 w-4" /> User Management
            </Button>
            <Button variant="outline" className="h-14 flex flex-col gap-1 text-sm" onClick={() => router.push('/admin/students')}>
              <GraduationCap className="h-4 w-4" /> Student Enrollment
            </Button>
            <Button variant="outline" className="h-14 flex flex-col gap-1 text-sm" onClick={() => router.push('/admin/classes')}>
              <BookOpen className="h-4 w-4" /> Class Management
            </Button>
            <Button variant="outline" className="h-14 flex flex-col gap-1 text-sm" onClick={() => router.push('/head/announcements')}>
              <Bell className="h-4 w-4" /> Post Announcement
            </Button>
          </div>
        </div>

        {/* Timetable Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <Clock className="h-5 w-5 text-slate-600" />
            <CardTitle className="text-base">Timetable Management</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button variant="secondary" onClick={() => router.push('/head/timetable')}>View All Timetables</Button>
            <Button variant="outline" onClick={() => router.push('/head/timetable/generate')}>Auto-Generate Schedule</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
