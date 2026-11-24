'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Search,
  BookOpen,
  Filter,
  CheckCircle,
  GraduationCap,
  Layers,
  Edit2,
  RefreshCw,
} from 'lucide-react';

interface Student {
  id: string;
  studentCode: string;
  user: { fullName: string; email?: string };
  class?: { id: string; name: string };
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface ClassItem {
  id: string;
  name: string;
}

interface ExistingMark {
  id: string;
  studentId: string;
  subjectId: string;
  assessment: number;
  finalExam: number;
  total: number;
  student?: { user: { fullName: string } };
  subject?: { name: string; code: string };
}

export default function GradesPage() {
  const router = useRouter();

  // Data states
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [existingMarks, setExistingMarks] = useState<ExistingMark[]>([]);

  // Search & Filter states
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');

  // Form selection
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [assessment, setAssessment] = useState<number>(0);
  const [finalExam, setFinalExam] = useState<number>(0);

  // Status & feedback
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    loadInitialData();
  }, [router]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [studentsRes, subjectsRes, classesRes] = await Promise.all([
        api.get('/students').catch(() => ({ data: [] })),
        api.get('/subjects').catch(() => ({ data: [] })),
        api.get('/classes').catch(() => ({ data: [] })),
      ]);

      setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : []);
      setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);

      const subList = Array.isArray(subjectsRes.data) && subjectsRes.data.length > 0
        ? subjectsRes.data
        : [
            { id: 'sub-math', name: 'Mathematics', code: 'MATH101' },
            { id: 'sub-eng', name: 'English', code: 'ENG101' },
            { id: 'sub-phys', name: 'Physics', code: 'PHYS101' },
            { id: 'sub-chem', name: 'Chemistry', code: 'CHEM101' },
            { id: 'sub-bio', name: 'Biology', code: 'BIO101' },
          ];
      setSubjects(subList);

      // Load marks if available
      api.get('/grades').then((res) => {
        if (Array.isArray(res.data)) {
          setExistingMarks(res.data);
        }
      }).catch(() => {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered students by class and search keyword
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesClass = !selectedClassFilter || s.class?.id === selectedClassFilter;
      const term = studentSearch.toLowerCase().trim();
      const matchesSearch =
        !term ||
        s.user?.fullName?.toLowerCase().includes(term) ||
        s.studentCode?.toLowerCase().includes(term);
      return matchesClass && matchesSearch;
    });
  }, [students, selectedClassFilter, studentSearch]);

  // Filtered subjects by search keyword
  const filteredSubjects = useMemo(() => {
    if (!subjectSearch.trim()) return subjects;
    const term = subjectSearch.toLowerCase().trim();
    return subjects.filter(
      (sub) => sub.name.toLowerCase().includes(term) || sub.code.toLowerCase().includes(term),
    );
  }, [subjects, subjectSearch]);

  // Total score computation
  const totalScore = (Number(assessment) || 0) + (Number(finalExam) || 0);

  const getGradeBadge = (total: number) => {
    if (total >= 90) return { letter: 'A', color: 'bg-emerald-100 text-emerald-800' };
    if (total >= 80) return { letter: 'B', color: 'bg-blue-100 text-blue-800' };
    if (total >= 70) return { letter: 'C', color: 'bg-purple-100 text-purple-800' };
    if (total >= 60) return { letter: 'D', color: 'bg-amber-100 text-amber-800' };
    return { letter: 'F', color: 'bg-red-100 text-red-800' };
  };

  const handleEditMark = (mark: ExistingMark) => {
    setSelectedStudent(mark.studentId);
    setSelectedSubject(mark.subjectId);
    setAssessment(mark.assessment);
    setFinalExam(mark.finalExam);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedSubject) {
      setStatusMessage({ type: 'error', text: 'Please select both a student and a subject.' });
      return;
    }

    try {
      setSaving(true);
      setStatusMessage(null);

      await api.post('/grades', {
        studentId: selectedStudent,
        subjectId: selectedSubject,
        assessment: Number(assessment),
        finalExam: Number(finalExam),
      });

      setStatusMessage({
        type: 'success',
        text: `Grade of ${totalScore}/100 saved successfully! Parent notification dispatched.`,
      });

      // Refresh marks list
      const res = await api.get('/grades').catch(() => ({ data: [] }));
      if (Array.isArray(res.data)) {
        setExistingMarks(res.data);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setStatusMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save grade. Please check your connection.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => router.push('/teacher')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-600" /> Enter & Manage Student Grades
            </h1>
          </div>
          <Button variant="ghost" size="sm" onClick={loadInitialData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        {/* Global Feedback Banner */}
        {statusMessage && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between shadow-sm ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-600" />}
              <span className="font-medium text-sm">{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-xs underline hover:opacity-80"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Grade Entry Form with Class/Student/Subject search */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="bg-white border-b pb-4">
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-blue-600" /> Add / Update Student Mark
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Search student and subject to enter continuous assessment (40%) and final exam (60%).
                </p>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Step 1: Filter by Class */}
                  <div>
                    <Label className="text-xs font-semibold uppercase text-slate-500 mb-1 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5" /> 1. Filter by Class
                    </Label>
                    <select
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500"
                      value={selectedClassFilter}
                      onChange={(e) => setSelectedClassFilter(e.target.value)}
                    >
                      <option value="">-- All Classes ({students.length} students) --</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Step 2: Search & Select Student */}
                  <div>
                    <Label className="text-xs font-semibold uppercase text-slate-500 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Search className="h-3.5 w-3.5" /> 2. Search & Select Student
                      </span>
                      <span className="text-slate-400 font-normal">
                        ({filteredStudents.length} available)
                      </span>
                    </Label>
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="Type student name or code to filter..."
                          className="pl-9 text-sm"
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                        />
                      </div>
                      <select
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500"
                        value={selectedStudent}
                        onChange={(e) => setSelectedStudent(e.target.value)}
                        required
                      >
                        <option value="">-- Select Student --</option>
                        {filteredStudents.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.user?.fullName} ({s.studentCode || 'No Code'}) {s.class?.name ? `• ${s.class.name}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Step 3: Search & Select Subject */}
                  <div>
                    <Label className="text-xs font-semibold uppercase text-slate-500 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Filter className="h-3.5 w-3.5" /> 3. Search & Select Subject
                      </span>
                      <span className="text-slate-400 font-normal">
                        ({filteredSubjects.length} subjects)
                      </span>
                    </Label>
                    <div className="space-y-2">
                      <Input
                        placeholder="Filter subject by name or code..."
                        className="text-sm"
                        value={subjectSearch}
                        onChange={(e) => setSubjectSearch(e.target.value)}
                      />
                      <select
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500"
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        required
                      >
                        <option value="">-- Select Subject --</option>
                        {filteredSubjects.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name} ({sub.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Step 4: Marks Inputs */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-600">
                        Assessment (0 - 40)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        max={40}
                        step="0.5"
                        value={assessment}
                        onChange={(e) => setAssessment(Number(e.target.value))}
                        className="font-semibold"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-slate-600">
                        Final Exam (0 - 60)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        max={60}
                        step="0.5"
                        value={finalExam}
                        onChange={(e) => setFinalExam(Number(e.target.value))}
                        className="font-semibold"
                        required
                      />
                    </div>
                  </div>

                  {/* Total & Preview */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 uppercase tracking-wider block">
                        Total Combined Score
                      </span>
                      <span className="text-2xl font-black text-slate-900">
                        {totalScore} <span className="text-sm font-normal text-slate-500">/ 100</span>
                      </span>
                    </div>
                    <div>
                      <span
                        className={`text-sm font-bold px-3 py-1.5 rounded-full ${
                          getGradeBadge(totalScore).color
                        }`}
                      >
                        Grade: {getGradeBadge(totalScore).letter}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 font-semibold h-11"
                    disabled={saving || !selectedStudent || !selectedSubject}
                  >
                    {saving ? 'Saving...' : 'Save & Publish Grade'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Existing Recorded Marks & Quick Search */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="bg-white border-b pb-3">
                <CardTitle className="text-base font-semibold text-slate-800 flex items-center justify-between">
                  <span>Recorded Marks</span>
                  <span className="text-xs font-normal text-slate-500">
                    {existingMarks.length} records
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-[560px] overflow-y-auto">
                {existingMarks.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    No grades recorded yet. Use the form to submit student marks.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {existingMarks.map((m) => {
                      const badge = getGradeBadge(m.total);
                      return (
                        <div
                          key={m.id}
                          className="p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between"
                        >
                          <div className="space-y-0.5">
                            <p className="font-semibold text-sm text-slate-900">
                              {m.student?.user?.fullName || 'Student'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {m.subject?.name || 'Subject'} • Assmt: {m.assessment}/40 • Exam: {m.finalExam}/60
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded ${badge.color}`}
                            >
                              {m.total} ({badge.letter})
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-blue-600"
                              onClick={() => handleEditMark(m)}
                              title="Edit Mark"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
