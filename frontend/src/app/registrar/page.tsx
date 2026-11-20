'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  CreditCard,
  BookOpen,
  UserPlus,
  LogOut,
  GraduationCap,
} from 'lucide-react';

interface Stats {
  totalStudents: number;
  pendingPayments: number;
  totalClasses: number;
}

export default function RegistrarDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    pendingPayments: 0,
    totalClasses: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem('user');
    if (!raw) { router.push('/login'); return; }
    try {
      const user = JSON.parse(raw);
      if (user.role !== 'REGISTRAR') { router.push('/login'); return; }
    } catch {
      router.push('/login');
    }
  }, [router]);

  const fetchStats = useCallback(async () => {
    try {
      const [studentsRes, pendingRes, classesRes] = await Promise.allSettled([
        api.get('/students'),
        api.get('/payments?status=PENDING'),
        api.get('/classes'),
      ]);
      setStats({
        totalStudents:
          studentsRes.status === 'fulfilled'
            ? (studentsRes.value.data as unknown[]).length
            : 0,
        pendingPayments:
          pendingRes.status === 'fulfilled'
            ? (pendingRes.value.data as unknown[]).length
            : 0,
        totalClasses:
          classesRes.status === 'fulfilled'
            ? (classesRes.value.data as unknown[]).length
            : 0,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const kpiCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Pending Payments',
      value: stats.pendingPayments,
      icon: CreditCard,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      title: 'Total Classes',
      value: stats.totalClasses,
      icon: BookOpen,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
  ];

  const navCards = [
    {
      title: 'Student Enrollment',
      description: 'Register and manage students',
      href: '/registrar/students',
      icon: UserPlus,
      color: 'text-blue-600',
      border: 'border-blue-200 hover:border-blue-400',
    },
    {
      title: 'Fee Management',
      description: 'Create invoices, track payments',
      href: '/registrar/payments',
      icon: CreditCard,
      color: 'text-purple-600',
      border: 'border-purple-200 hover:border-purple-400',
    },
    {
      title: 'Classes',
      description: 'View and manage school classes',
      href: '/admin/classes',
      icon: GraduationCap,
      color: 'text-green-600',
      border: 'border-green-200 hover:border-green-400',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registrar Portal</h1>
          <p className="text-sm text-gray-500">School Management System</p>
        </div>
        <Button variant="outline" onClick={handleLogout} className="gap-2">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* KPI Stats */}
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {kpiCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.title} className="border shadow-sm">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className={`p-3 rounded-full ${card.bg}`}>
                      <Icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{card.title}</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {loading ? '...' : card.value}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Navigation Cards */}
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {navCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card
                  key={card.title}
                  className={`border-2 cursor-pointer transition-all ${card.border} hover:shadow-md`}
                  onClick={() => router.push(card.href)}
                >
                  <CardHeader className="pb-2">
                    <Icon className={`h-8 w-8 ${card.color} mb-2`} />
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">{card.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Quick Actions</h2>
          <div className="flex gap-3 flex-wrap">
            <Button
              className="gap-2 bg-blue-600 hover:bg-blue-700"
              onClick={() => router.push('/registrar/students')}
            >
              <UserPlus className="h-4 w-4" />
              Register New Student
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => router.push('/registrar/payments')}
            >
              <CreditCard className="h-4 w-4" />
              Create Invoice
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
