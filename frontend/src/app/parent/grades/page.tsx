'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  BookOpen,
  Award,
  GraduationCap,
  TrendingUp,
  UserCheck,
} from 'lucide-react';

interface Student {
  id: string;
  studentCode: string;
  user: { fullName: string };
  class?: { name: string };
  parentId?: string;
}

interface Mark {
  id: string;
  assessment: number;
  finalExam: number;
  total: number;
  subject: { name: string; code: string };
}

interface ReportCard {
  student: { fullName: string; studentCode: string };
  academicPerformance: {
    gpa: string;
    totalSubjects: number;
    rank?: number;
    totalStudentsInClass?: number;
  };
}

export default function ParentAllGradesPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [marks, setMarks] = useState<Mark[]>([]);
  const [reportCard, setReportCard] = useState<ReportCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMarks, setLoadingMarks] = useState(false);

  const loadStudentMarks = useCallback(async (sid: string) => {
    setSelectedStudentId(sid);
    setLoadingMarks(true);
    try {
      const [marksRes, reportRes] = await Promise.all([
        api.get(`/grades/student/${sid}`).catch(() => ({ data: [] })),
        api.get(`/grades/report-card/${sid}`).catch(() => ({ data: null })),
      ]);
      setMarks(Array.isArray(marksRes.data) ? marksRes.data : []);
      setReportCard(reportRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMarks(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userStr);
    const parentId = user.parent?.id;

    api.get(parentId ? `/students?parentId=${parentId}` : '/students')
      .then((res) => {
        const list: Student[] = Array.isArray(res.data) ? res.data : [];
        const myStudents = parentId ? list.filter((s) => s.parentId === parentId) : list;
        setStudents(myStudents);
        if (myStudents.length > 0) {
          loadStudentMarks(myStudents[0].id);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [router, loadStudentMarks]);

  const getBadge = (total: number) => {
    if (total >= 90) return { letter: 'A', bg: 'bg-emerald-100 text-emerald-800' };
    if (total >= 80) return { letter: 'B', bg: 'bg-blue-100 text-blue-800' };
    if (total >= 70) return { letter: 'C', bg: 'bg-purple-100 text-purple-800' };
    if (total >= 60) return { letter: 'D', bg: 'bg-amber-100 text-amber-800' };
    return { letter: 'F', bg: 'bg-red-100 text-red-800' };
  };

  const selectedChild = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/parent')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-emerald-600" /> Academic Grades & Report Cards
          </h1>
        </div>

        {/* Children selector tabs */}
        {students.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-xs font-semibold uppercase text-slate-500 mr-2 flex items-center gap-1">
              <UserCheck className="h-3.5 w-3.5" /> Child:
            </span>
            {students.map((child) => (
              <Button
                key={child.id}
                size="sm"
                variant={selectedStudentId === child.id ? 'default' : 'outline'}
                className={selectedStudentId === child.id ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                onClick={() => loadStudentMarks(child.id)}
              >
                {child.user?.fullName} ({child.studentCode})
              </Button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-slate-500">Loading student academic records...</div>
        ) : students.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">
            No children registered under this parent profile. Please contact the school registrar.
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Student Overview Card */}
            {selectedChild && (
              <Card className="shadow-sm border-slate-200 bg-white">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        {selectedChild.user?.fullName}
                      </h2>
                      <p className="text-sm text-slate-500">
                        Student ID: <span className="font-mono font-medium">{selectedChild.studentCode}</span>{' '}
                        {selectedChild.class?.name ? `• Class: ${selectedChild.class.name}` : ''}
                      </p>
                    </div>

                    {reportCard?.academicPerformance && (
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-xs text-slate-400 uppercase">Term GPA</span>
                          <p className="text-2xl font-black text-emerald-600">
                            {reportCard.academicPerformance.gpa}
                          </p>
                        </div>
                        {reportCard.academicPerformance.rank && (
                          <div className="text-right pl-4 border-l">
                            <span className="text-xs text-slate-400 uppercase">Class Rank</span>
                            <p className="text-2xl font-black text-blue-600">
                              #{reportCard.academicPerformance.rank}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Subject Marks Table */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="bg-white border-b pb-4">
                <CardTitle className="text-base font-semibold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-emerald-600" /> Subject Breakdown
                  </span>
                  <span className="text-xs font-normal text-slate-500">
                    {marks.length} Subject(s) Recorded
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loadingMarks ? (
                  <div className="text-center py-12 text-slate-500">Loading subject marks...</div>
                ) : marks.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    No academic marks published for this student yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {marks.map((m) => {
                      const badge = getBadge(m.total);
                      return (
                        <div
                          key={m.id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                        >
                          <div>
                            <p className="font-semibold text-slate-900">
                              {m.subject?.name}{' '}
                              <span className="text-xs font-mono text-slate-400">
                                ({m.subject?.code})
                              </span>
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Continuous Assessment: <span className="font-medium text-slate-700">{m.assessment} / 40</span>{' '}
                              • Final Exam: <span className="font-medium text-slate-700">{m.finalExam} / 60</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-black text-slate-900">
                              {m.total} <span className="text-xs font-normal text-slate-400">/100</span>
                            </span>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badge.bg}`}>
                              Grade: {badge.letter}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
