'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  BarChart2,
  CheckSquare,
  Award,
  DollarSign,
  TrendingUp,
  FileText,
  ChevronRight,
} from 'lucide-react';

const REPORT_CARDS = [
  {
    id: 'attendance',
    title: 'Student Attendance Report',
    description: 'Track daily attendance compliance, absenteeism rates, and section-by-section breakdown.',
    icon: CheckSquare,
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    iconColor: 'text-blue-600',
    path: '/head/reports/attendance',
    metrics: 'Attendance Rate • Absences • Present Students',
  },
  {
    id: 'academics',
    title: 'Academic Performance & Rankings',
    description: 'Analyze student grade distributions, GPA statistics, subject averages, and top academic achievers.',
    icon: Award,
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    iconColor: 'text-purple-600',
    path: '/head/reports/academics',
    metrics: 'Average GPA • Grade Distribution (A-F) • Top Achievers',
  },
  {
    id: 'fees',
    title: 'Fee Collection & Revenue Report',
    description: 'Detailed financial analytics on tuition fees, collected revenues, pending payments, and 5% late penalties.',
    icon: DollarSign,
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    iconColor: 'text-amber-600',
    path: '/head/reports/fees',
    metrics: 'Collected • Outstanding Balances • Overdue Penalties',
  },
  {
    id: 'teachers',
    title: 'Teacher Performance & Compliance',
    description: 'Monitor educator attendance marking timeliness, syllabus progression, and classroom management.',
    icon: TrendingUp,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconColor: 'text-emerald-600',
    path: '/head/reports/teachers',
    metrics: 'Marking Timeliness • Active Classes • Compliance Rates',
  },
];

export default function AdminReportsPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'ADMIN' && user.role !== 'HEAD') {
        router.push('/login');
      }
    } catch {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Admin Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white">
              <BarChart2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Institutional Analytical Reports</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Comprehensive academic, attendance, financial, and faculty analytics for institutional governance.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {REPORT_CARDS.map((r) => {
            const Icon = r.icon;
            return (
              <Card
                key={r.id}
                onClick={() => router.push(r.path)}
                className="hover:shadow-md transition cursor-pointer border-slate-200 group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-xl bg-slate-100 group-hover:bg-blue-50 transition">
                      <Icon className={`h-6 w-6 ${r.iconColor}`} />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                      Live Data
                    </span>
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900 pt-3 group-hover:text-blue-600 transition">
                    {r.title}
                  </CardTitle>
                  <CardDescription className="text-slate-500 text-sm">
                    {r.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    {r.metrics}
                  </span>
                  <div className="flex items-center text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition">
                    <span>View Analytics</span>
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Report Actions */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Need a custom export or audit report?</h3>
            <p className="text-slate-500 text-sm">
              All report datasets can be printed, exported, or filtered by specific academic terms and grade levels.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/payments')}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              <span>Payments Ledger</span>
            </Button>
            <Button
              onClick={() => router.push('/head/timetable')}
              className="gap-2"
            >
              <BarChart2 className="h-4 w-4" />
              <span>Timetable Analytics</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
