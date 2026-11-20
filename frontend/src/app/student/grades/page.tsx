'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Award, CheckCircle } from 'lucide-react';

interface ReportCardSubject {
  subject: string;
  code: string;
  teacher: string;
  assessment: number;
  finalExam: number;
  total: number;
  grade: string;
  remark: string;
}

interface ReportCardData {
  student: {
    fullName: string;
    studentCode: string;
    gender: string;
    class: string;
  };
  academicPerformance: {
    totalSubjects: number;
    averageScore: number;
    gpa: number;
    rank: number | null;
    totalStudentsInClass: number;
  };
  subjects: ReportCardSubject[];
  issuedAt: string;
}

export default function StudentGradesPage() {
  const router = useRouter();
  const [reportCard, setReportCard] = useState<ReportCardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportCard = async () => {
      try {
        setLoading(true);
        const userData = localStorage.getItem('user');
        if (!userData) {
          router.push('/login');
          return;
        }
        const user = JSON.parse(userData);
        const studentsRes = await api.get('/students');
        const myStudent = studentsRes.data.find((s: { user: { id: string } }) => s.user.id === user.id);

        if (myStudent) {
          const res = await api.get(`/grades/report-card/${myStudent.id}`);
          setReportCard(res.data);
        }
      } catch (err) {
        console.error('Failed fetching report card', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportCard();
  }, [router]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between no-print">
          <Button variant="outline" size="sm" onClick={() => router.push('/student')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Portal
          </Button>
          <Button onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="h-4 w-4" /> Print / Save Report Card
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-500">Generating student report card...</div>
        ) : !reportCard ? (
          <div className="text-center py-16 bg-white rounded-lg border text-slate-500">
            No grades recorded yet for this academic period.
          </div>
        ) : (
          <Card className="border shadow-lg bg-white print:shadow-none print:border-none">
            <CardHeader className="text-center border-b pb-6 space-y-2">
              <div className="flex justify-center mb-2">
                <div className="p-3 bg-blue-100 rounded-full text-blue-700">
                  <Award className="h-8 w-8" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
                INTERNATIONAL SMART CAMPUS SCHOOL SYSTEM
              </CardTitle>
              <p className="text-sm font-medium text-slate-500">OFFICIAL STUDENT ACADEMIC REPORT CARD</p>
            </CardHeader>

            <CardContent className="p-8 space-y-6">
              {/* Student Metadata Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border text-sm">
                <div>
                  <span className="text-xs text-slate-500 block">Student Name</span>
                  <span className="font-semibold text-slate-900">{reportCard.student.fullName}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Student ID Code</span>
                  <span className="font-mono font-semibold text-blue-600">{reportCard.student.studentCode}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Class Section</span>
                  <span className="font-semibold text-slate-900">{reportCard.student.class}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Date Issued</span>
                  <span className="font-medium text-slate-700">
                    {new Date(reportCard.issuedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Subject Breakdown Table */}
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 border-b text-xs font-semibold uppercase text-slate-600">
                    <tr>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4 text-center">Assessment (50%)</th>
                      <th className="py-3 px-4 text-center">Final Exam (50%)</th>
                      <th className="py-3 px-4 text-center">Total (100)</th>
                      <th className="py-3 px-4 text-center">Grade</th>
                      <th className="py-3 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-800">
                    {reportCard.subjects.map((sub, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-medium">
                          {sub.subject} <span className="text-xs text-slate-400">({sub.code})</span>
                        </td>
                        <td className="py-3 px-4 text-center">{sub.assessment}</td>
                        <td className="py-3 px-4 text-center">{sub.finalExam}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-900">{sub.total}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              sub.grade === 'A'
                                ? 'bg-emerald-100 text-emerald-700'
                                : sub.grade === 'B'
                                ? 'bg-blue-100 text-blue-700'
                                : sub.grade === 'C'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {sub.grade}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">{sub.remark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Performance Summary Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
                <div className="p-4 bg-blue-50 rounded-lg text-center border border-blue-100">
                  <span className="text-xs text-blue-600 font-medium block">Average Percentage</span>
                  <span className="text-2xl font-bold text-blue-900">
                    {reportCard.academicPerformance.averageScore}%
                  </span>
                </div>

                <div className="p-4 bg-emerald-50 rounded-lg text-center border border-emerald-100">
                  <span className="text-xs text-emerald-600 font-medium block">Semester GPA</span>
                  <span className="text-2xl font-bold text-emerald-900">
                    {reportCard.academicPerformance.gpa} / 4.0
                  </span>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg text-center border border-purple-100">
                  <span className="text-xs text-purple-600 font-medium block">Class Standing / Rank</span>
                  <span className="text-2xl font-bold text-purple-900">
                    {reportCard.academicPerformance.rank
                      ? `#${reportCard.academicPerformance.rank} of ${reportCard.academicPerformance.totalStudentsInClass}`
                      : 'Pending'}
                  </span>
                </div>
              </div>

              {/* Verification Stamp */}
              <div className="pt-8 flex justify-between items-end border-t text-xs text-slate-400">
                <div>
                  <p>Certified Digital Record</p>
                  <p className="flex items-center gap-1 text-emerald-600 font-medium mt-1">
                    <CheckCircle className="h-4 w-4" /> System Verified
                  </p>
                </div>
                <div className="text-right">
                  <div className="w-40 border-b border-slate-300 pb-1 mb-1"></div>
                  <p>Registrar & Academic Affairs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
