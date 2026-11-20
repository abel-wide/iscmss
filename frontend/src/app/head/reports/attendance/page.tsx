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
import { Input } from '@/components/ui/input';
import { ArrowLeft, Users, TrendingUp, UserCheck, UserX } from 'lucide-react';

interface AttendanceRecord {
  studentName: string;
  date: string;
  status: string;
  className: string;
}

interface ClassStat {
  classId: string;
  className: string;
  rate: number;
}

interface AttendanceData {
  totalStudents: number;
  averageAttendanceRate: number;
  presentToday: number;
  absentToday: number;
  records: AttendanceRecord[];
  classStats: ClassStat[];
}

export default function HeadAttendanceReportPage() {
  const router = useRouter();
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [classFilter, setClassFilter] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) {
      router.push('/login');
      return;
    }
    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'HEAD') {
        router.push('/login');
        return;
      }
    } catch {
      router.push('/login');
      return;
    }

    api
      .get('/reports/attendance')
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load attendance report.'))
      .finally(() => setLoading(false));
  }, [router]);

  const filteredRecords = data?.records.filter((r) =>
    classFilter ? r.className.toLowerCase().includes(classFilter.toLowerCase()) : true
  ) ?? [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading attendance report…</p>
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

      <h1 className="text-2xl font-bold">Attendance Report</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data?.totalStudents ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data?.averageAttendanceRate?.toFixed(1) ?? 0}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Present Today</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{data?.presentToday ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Absent Today</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{data?.absentToday ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Class-by-class attendance rate table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Rate by Class</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead className="text-right">Attendance Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.classStats.length ? (
                data.classStats.map((cs) => (
                  <TableRow key={cs.classId}>
                    <TableCell className="font-medium">{cs.className}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          cs.rate >= 90
                            ? 'text-green-600 font-semibold'
                            : cs.rate >= 75
                            ? 'text-yellow-600 font-semibold'
                            : 'text-red-600 font-semibold'
                        }
                      >
                        {cs.rate.toFixed(1)}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    No class data available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance Records</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Filter by class name…"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="max-w-xs"
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length ? (
                filteredRecords.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{r.studentName}</TableCell>
                    <TableCell>{r.className}</TableCell>
                    <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span
                        className={
                          r.status === 'PRESENT'
                            ? 'text-green-600 font-semibold'
                            : 'text-red-600 font-semibold'
                        }
                      >
                        {r.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No records found.
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
