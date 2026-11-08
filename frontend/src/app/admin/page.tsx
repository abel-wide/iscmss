
/* eslint-disable react-hooks/set-state-in-effect */
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

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ teachers: 0, students: 0, classes: 0 });
  const [user, setUser] = useState<User | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);

    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    // 1. የተጠቃሚውን መረጃ ከ localStorage አንብብ
    if (!token || !userData) {
      router.push('/login');
      return () => clearTimeout(timer);
    }
    
    const parsedUser = JSON.parse(userData);
    
    // 2. Admin ካልሆነ ወደ Login መላክ (ወይም ወደራሱ ዳሽቦርድ)
    if (parsedUser.role !== 'ADMIN') {
      router.push('/login'); // ወይም ወደ '/parent' ወይም '/teacher' መላክ ይቻላል
      return () => clearTimeout(timer);
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

    return () => clearTimeout(timer);
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-slate-500">Welcome, {user?.fullName || 'Admin'}</p>
          </div>
          <Button variant="destructive" onClick={handleLogout}>Logout</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader><CardTitle>Total Teachers</CardTitle></CardHeader>
            <CardContent><p className="text-4xl font-bold">{stats.teachers}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Total Students</CardTitle></CardHeader>
            <CardContent><p className="text-4xl font-bold">{stats.students}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Total Classes</CardTitle></CardHeader>
            <CardContent><p className="text-4xl font-bold">{stats.classes}</p></CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button onClick={() => router.push('/admin/teachers')}>Manage Teachers</Button>
          <Button onClick={() => router.push('/admin/students')}>Manage Students</Button>
          <Button onClick={() => router.push('/admin/classes')}>Manage Classes</Button>
          <Button onClick={() => router.push('/admin/payments')}>View Payments</Button>
        </div>
      </div>
    </div>
  );
}