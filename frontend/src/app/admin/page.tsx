'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  GraduationCap,
  School,
  UserCog,
  BarChart2,
  Briefcase,
  Bell,
  Search,
  LogOut,
} from 'lucide-react';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ teachers: 0, students: 0, classes: 0 });
  const [user, setUser] = useState<User | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [reminderStatus, setReminderStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [reminderMessage, setReminderMessage] = useState('');

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    setUser(parsedUser);

    const fetchStats = async () => {
      try {
        const [t, s, c] = await Promise.all([
          api.get('/users/teachers'),
          api.get('/students'),
          api.get('/classes'),
        ]);
        setStats({
          teachers: t.data.length,
          students: s.data.length,
          classes: c.data.length,
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/admin/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSendReminders = async () => {
    setReminderStatus('loading');
    setReminderMessage('');
    try {
      const res = await api.post('/payments/reminders');
      setReminderStatus('success');
      setReminderMessage(res.data?.message || 'Payment reminders sent successfully!');
    } catch (err) {
      console.error(err);
      setReminderStatus('error');
      setReminderMessage('Failed to send reminders. Please try again.');
    }
    setTimeout(() => setReminderStatus('idle'), 4000);
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
            <p className="text-slate-500 mt-1">Welcome back, {user?.fullName || 'Admin'}</p>
          </div>
          <Button variant="destructive" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Global Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5" /> Global Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-3">
              <Input
                placeholder="Search users, students, classes…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
              <Button type="submit">Search</Button>
            </form>
          </CardContent>
        </Card>

        {/* KPI Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Teachers</CardTitle>
              <Users className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-slate-800">{stats.teachers}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Students</CardTitle>
              <GraduationCap className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-slate-800">{stats.students}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Classes</CardTitle>
              <School className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-slate-800">{stats.classes}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-slate-700 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* User Management */}
            <Card
              className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-blue-400"
              onClick={() => router.push('/admin/users')}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
                <div className="p-3 bg-blue-100 rounded-full">
                  <UserCog className="h-8 w-8 text-blue-600" />
                </div>
                <p className="font-semibold text-slate-700">User Management</p>
                <p className="text-xs text-slate-500 text-center">Create and manage all system users</p>
              </CardContent>
            </Card>

            {/* Reports */}
            <Card
              className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-green-400"
              onClick={() => router.push('/admin/reports')}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
                <div className="p-3 bg-green-100 rounded-full">
                  <BarChart2 className="h-8 w-8 text-green-600" />
                </div>
                <p className="font-semibold text-slate-700">Reports</p>
                <p className="text-xs text-slate-500 text-center">View attendance, academic & fee reports</p>
              </CardContent>
            </Card>

            {/* Send Payment Reminders */}
            <Card className="border-2 hover:border-orange-400 hover:shadow-md transition-shadow">
              <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
                <div className="p-3 bg-orange-100 rounded-full">
                  <Bell className="h-8 w-8 text-orange-600" />
                </div>
                <p className="font-semibold text-slate-700">Payment Reminders</p>
                <Button
                  size="sm"
                  onClick={handleSendReminders}
                  disabled={reminderStatus === 'loading'}
                  className="mt-1 w-full"
                  variant={reminderStatus === 'success' ? 'outline' : 'default'}
                >
                  {reminderStatus === 'loading' ? 'Sending…' : 'Send Reminders'}
                </Button>
                {reminderStatus !== 'idle' && reminderStatus !== 'loading' && (
                  <p className={`text-xs text-center ${reminderStatus === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                    {reminderMessage}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Job Postings */}
            <Card
              className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-purple-400"
              onClick={() => router.push('/admin/jobs')}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Briefcase className="h-8 w-8 text-purple-600" />
                </div>
                <p className="font-semibold text-slate-700">Job Postings</p>
                <p className="text-xs text-slate-500 text-center">Manage staff recruitment postings</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Existing nav buttons */}
        <div>
          <h2 className="text-xl font-semibold text-slate-700 mb-4">Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" onClick={() => router.push('/admin/teachers')}>Manage Teachers</Button>
            <Button variant="outline" onClick={() => router.push('/admin/students')}>Manage Students</Button>
            <Button variant="outline" onClick={() => router.push('/admin/classes')}>Manage Classes</Button>
            <Button variant="outline" onClick={() => router.push('/admin/payments')}>View Payments</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
