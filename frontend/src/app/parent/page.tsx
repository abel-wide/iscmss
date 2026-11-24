'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  CreditCard,
  BookOpen,
  ClipboardList,
  FolderOpen,
  MessageSquare,
  Bell,
  LogOut,
} from 'lucide-react';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  parent?: { id: string; students?: { id: string }[] };
}

interface Student {
  id: string;
  studentCode: string;
  gpa?: number;
  attendanceRate?: number;
  user?: { fullName?: string; name?: string };
  class?: { name: string };
  parentId?: string;
}

interface Notification {
  id: string;
  message: string;
  createdAt: string;
  read: boolean;
}

const QUICK_LINKS = [
  { label: 'Payments', icon: CreditCard, path: '/parent/payments', color: 'text-blue-600 bg-blue-50' },
  { label: 'Grades', icon: BookOpen, path: '/parent/grades', color: 'text-green-600 bg-green-50' },
  { label: 'Attendance', icon: ClipboardList, path: '/parent/attendance', color: 'text-purple-600 bg-purple-50' },
  { label: 'Resources', icon: FolderOpen, path: '/parent/resources', color: 'text-orange-600 bg-orange-50' },
  { label: 'Chat', icon: MessageSquare, path: '/chat', color: 'text-pink-600 bg-pink-50' },
];

export default function ParentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (parsedUser: User) => {
    try {
      const parentId = parsedUser.parent?.id;

      // Fetch students linked to parent
      const studentsRes = await api.get(parentId ? `/students?parentId=${parentId}` : '/students');
      const allStudents: Student[] = studentsRes.data;

      // Filter to only this parent's students if parentId is known
      const myStudents = parentId
        ? allStudents.filter((s) => s.parentId === parentId)
        : allStudents.slice(0, 3); // fallback: show first 3 if no filtering possible

      setStudents(myStudents);

      // Fetch notifications
      if (parentId) {
        try {
          const notifRes = await api.get(`/notifications/parent/${parentId}`);
          setNotifications(notifRes.data.slice(0, 5));
        } catch {
          // Notifications might not be available
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser: User = JSON.parse(userData);
    if (parsedUser.role !== 'PARENT') {
      router.push('/login');
      return;
    }

    setUser(parsedUser);
    fetchData(parsedUser);
  }, [router, fetchData]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  if (loading) return <div className="p-8">Loading…</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Parent Portal</h1>
            <p className="text-slate-500 mt-1">Welcome, {user?.fullName || 'Parent'}</p>
          </div>
          <Button variant="destructive" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-lg font-semibold text-slate-700 mb-3">Quick Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {QUICK_LINKS.map((link) => (
              <Card
                key={link.label}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(link.path)}
              >
                <CardContent className="flex flex-col items-center justify-center p-4 gap-2">
                  <div className={`p-2 rounded-full ${link.color.split(' ')[1]}`}>
                    <link.icon className={`h-6 w-6 ${link.color.split(' ')[0]}`} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{link.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* My Children */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" /> My Children
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {students.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg bg-white gap-4"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{s.user?.fullName || s.user?.name}</p>
                    <p className="text-sm text-slate-500">
                      {s.studentCode} • {s.class?.name || 'No Class'}
                    </p>
                    <div className="flex gap-4 mt-2 text-sm">
                      {s.gpa !== undefined && (
                        <span className="text-blue-600 font-medium">GPA: {s.gpa?.toFixed(2)}</span>
                      )}
                      {s.attendanceRate !== undefined && (
                        <span className="text-green-600 font-medium">
                          Attendance: {s.attendanceRate?.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => router.push(`/parent/attendance/${s.id}`)}>
                      Attendance
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => router.push(`/parent/grades/${s.id}`)}>
                      Grades
                    </Button>
                    <Button size="sm" onClick={() => router.push('/parent/payments')}>
                      Payments
                    </Button>
                  </div>
                </div>
              ))}
              {students.length === 0 && (
                <p className="text-slate-500 text-center py-6">No children registered. Contact admin for assistance.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-slate-500 text-sm">No notifications at this time.</p>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${n.read ? 'bg-white' : 'bg-blue-50 border-blue-200'}`}
                  >
                    <Bell className={`h-4 w-4 mt-0.5 flex-shrink-0 ${n.read ? 'text-slate-400' : 'text-blue-500'}`} />
                    <div className="flex-1">
                      <p className="text-sm text-slate-700">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full">New</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
