'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Users, TrendingUp, CheckCircle } from 'lucide-react';

interface TeacherRecord {
  teacherName: string;
  className: string;
  totalDays: number;
  presentDays: number;
  attendanceRate: number;
  markedOnTime: boolean;
}

interface TeachersData {
  totalTeachers: number;
  averageAttendanceRate: number;
  records: TeacherRecord[];
}

function complianceColor(rate: number): string {
  if (rate >= 90) return 'text-green-600';
  if (rate >= 75) return 'text-yellow-600';
  return 'text-red-600';
}

function complianceBadge(rate: number): string {
  if (rate >= 90) return 'bg-green-100 text-green-800 border border-green-300';
  if (rate >= 75) return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
  return 'bg-red-100 text-red-800 border border-red-300';
}

export default function HeadTeachersReportPage() {
  const router = useRouter();
  const [data, setData] = useState<TeachersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) {
      router.push('/login');
      return;
    }
    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'HEAD' && user.role !== 'ADMIN') {
        router.push('/login');
        return;
      }
    } catch {
      router.push('/login');
      return;
    }

    api
      .get('/reports/teachers')
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load teachers report.'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading teachers report…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Back link */}
      <Link
        href="/head"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold">Teacher Attendance Report</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data?.totalTeachers ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Attendance Compliance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${complianceColor(data?.averageAttendanceRate ?? 0)}`}>
              {data?.averageAttendanceRate?.toFixed(1) ?? 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-sm">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
          ≥ 90% Excellent
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-yellow-500" />
          ≥ 75% Fair
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
          &lt; 75% Poor
        </span>
      </div>

      {/* Per-Teacher Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Per-Teacher Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="text-right">Present Days</TableHead>
                <TableHead className="text-right">Total Days</TableHead>
                <TableHead className="text-right">Compliance Rate</TableHead>
                <TableHead className="text-center">On Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.records?.length ? (
                data.records.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{r.teacherName}</TableCell>
                    <TableCell>{r.className}</TableCell>
                    <TableCell className="text-right">{r.presentDays}</TableCell>
                    <TableCell className="text-right">{r.totalDays}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${complianceBadge(
                          r.attendanceRate
                        )}`}
                      >
                        {r.attendanceRate.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {r.markedOnTime ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No teacher records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
