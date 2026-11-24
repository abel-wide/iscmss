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
import { ArrowLeft, GraduationCap, BookOpen, Award } from 'lucide-react';

interface TopStudent {
  name: string;
  gpa: number;
  rank: number;
  className: string;
}

interface SubjectAverage {
  subjectName: string;
  average: number;
}

interface GradeDistribution {
  A: number;
  B: number;
  C: number;
  D: number;
  F: number;
}

interface AcademicsData {
  averageGPA: number;
  topStudents: TopStudent[];
  gradeDistribution: GradeDistribution;
  subjectAverages: SubjectAverage[];
}

const GRADE_COLORS: Record<string, string> = {
  A: 'text-green-600',
  B: 'text-blue-600',
  C: 'text-yellow-600',
  D: 'text-orange-600',
  F: 'text-red-600',
};

export default function HeadAcademicsReportPage() {
  const router = useRouter();
  const [data, setData] = useState<AcademicsData | null>(null);
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
      .get('/reports/academics')
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load academics report.'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading academics report…</p>
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

  const gradeEntries = data?.gradeDistribution
    ? (Object.entries(data.gradeDistribution) as [string, number][])
    : [];

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

      <h1 className="text-2xl font-bold">Academics Report</h1>

      {/* Average GPA KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average GPA</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data?.averageGPA?.toFixed(2) ?? '—'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Grade Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Grade Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-3">
            {gradeEntries.map(([grade, count]) => (
              <div
                key={grade}
                className="flex flex-col items-center justify-center rounded-lg border p-4"
              >
                <span className={`text-2xl font-bold ${GRADE_COLORS[grade] ?? ''}`}>{grade}</span>
                <span className="text-lg font-semibold mt-1">{count}</span>
                <span className="text-xs text-muted-foreground">students</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="text-right">GPA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.topStudents?.length ? (
                data.topStudents.map((s) => (
                  <TableRow key={s.rank}>
                    <TableCell className="font-medium">#{s.rank}</TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.className}</TableCell>
                    <TableCell className="text-right font-semibold text-blue-600">
                      {s.gpa.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No data available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Subject Averages */}
      <Card>
        <CardHeader>
          <CardTitle>Subject Averages</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead className="text-right">Average Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.subjectAverages?.length ? (
                data.subjectAverages.map((s, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{s.subjectName}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          s.average >= 80
                            ? 'text-green-600 font-semibold'
                            : s.average >= 60
                            ? 'text-yellow-600 font-semibold'
                            : 'text-red-600 font-semibold'
                        }
                      >
                        {s.average.toFixed(1)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    No data available.
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
