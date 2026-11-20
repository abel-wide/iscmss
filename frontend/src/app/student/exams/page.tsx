'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ClipboardList,
  Clock,
  BookOpen,
  CheckCircle,
  XCircle,
  Trophy,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ExamSummary {
  id: string;
  title: string;
  subject: string;
  duration: number;
  questionCount: number;
}

interface Question {
  id: string;
  text: string;
  options: string[];
}

interface ExamDetail {
  id: string;
  title: string;
  questions: Question[];
}

interface BreakdownItem {
  questionId: string;
  correct: boolean;
  yourAnswer: number;
  correctAnswer: number;
}

interface ExamResult {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  breakdown: BreakdownItem[];
}

// ── Page ───────────────────────────────────────────────────────────────────────

type View = 'list' | 'exam' | 'result';

export default function StudentExamsPage() {
  const router = useRouter();

  const [view, setView] = useState<View>('list');
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [currentExam, setCurrentExam] = useState<ExamDetail | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<ExamResult | null>(null);
  const [studentId, setStudentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Auth guard & initial fetch ─────────────────────────────────────────────

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(userData);
    if (user.role !== 'STUDENT') {
      router.push('/login');
      return;
    }
    // Resolve studentId: prefer user.student.id, fallback to user.id
    const sid = user.student?.id ?? user.id;
    setStudentId(sid);

    fetchExams();
  }, [router]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/exams');
      setExams(res.data);
    } catch {
      setError('Failed to load exams. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Take exam ──────────────────────────────────────────────────────────────

  const handleTakeExam = async (examId: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/exams/${examId}`);
      setCurrentExam(res.data);
      setAnswers({});
      setView('exam');
    } catch {
      setError('Failed to load exam. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!currentExam) return;
    const unanswered = currentExam.questions.filter((q) => answers[q.id] === undefined);
    if (unanswered.length > 0) {
      setError(`Please answer all questions. ${unanswered.length} question(s) remaining.`);
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const res = await api.post('/exams/submit', {
        examId: currentExam.id,
        studentId,
        answers,
      });
      setResult(res.data);
      setView('result');
    } catch {
      setError('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render: Exam List ──────────────────────────────────────────────────────

  if (view === 'list') {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-10">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.push('/student')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Portal
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Objective Exams</h1>
              <p className="text-slate-500">Select an exam below to begin</p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-16 text-slate-500">Loading available exams...</div>
          ) : exams.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border text-slate-500">
              No exams available at this time.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {exams.map((exam) => (
                <Card key={exam.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-semibold text-slate-900 leading-tight">
                        {exam.title}
                      </CardTitle>
                      <span className="shrink-0 text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        {exam.subject}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <ClipboardList className="h-3.5 w-3.5" />
                        {exam.questionCount} questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {exam.duration} min
                      </span>
                    </div>
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => handleTakeExam(exam.id)}
                    >
                      <BookOpen className="h-4 w-4 mr-2" /> Take Exam
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Render: Exam Form ──────────────────────────────────────────────────────

  if (view === 'exam' && currentExam) {
    const OPTION_LABELS = ['A', 'B', 'C', 'D'];
    const answered = Object.keys(answers).length;
    const total = currentExam.questions.length;

    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-10">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => setView('list')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Exams
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">{currentExam.title}</h1>
              <p className="text-sm text-slate-500">
                Answered {answered} / {total} questions
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Progress bar */}
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${total ? (answered / total) * 100 : 0}%` }}
            />
          </div>

          {/* Questions */}
          <div className="space-y-4">
            {currentExam.questions.map((q, qi) => (
              <Card key={q.id}>
                <CardContent className="p-5 space-y-3">
                  <p className="font-medium text-slate-900 leading-snug">
                    <span className="text-blue-600 mr-2">Q{qi + 1}.</span>
                    {q.text}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => {
                      const selected = answers[q.id] === oi;
                      return (
                        <label
                          key={oi}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            className="accent-blue-600"
                            checked={selected}
                            onChange={() =>
                              setAnswers((prev) => ({ ...prev, [q.id]: oi }))
                            }
                          />
                          <span className="text-xs font-bold text-slate-500 w-5">
                            {OPTION_LABELS[oi]}
                          </span>
                          <span className="text-sm text-slate-800">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Submit */}
          <div className="flex justify-end pb-10">
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-10"
            >
              {submitting ? 'Submitting...' : 'Submit Exam'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Result ─────────────────────────────────────────────────────────

  if (view === 'result' && result) {
    const OPTION_LABELS = ['A', 'B', 'C', 'D'];

    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-10">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => setView('list')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Exams
            </Button>
            <h1 className="text-2xl font-bold text-slate-900">Exam Result</h1>
          </div>

          {/* Summary card */}
          <Card className="border shadow-md">
            <CardHeader className="text-center border-b pb-5 space-y-2">
              <div className="flex justify-center">
                <div
                  className={`p-4 rounded-full ${
                    result.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {result.passed ? (
                    <Trophy className="h-8 w-8" />
                  ) : (
                    <XCircle className="h-8 w-8" />
                  )}
                </div>
              </div>
              <CardTitle className="text-xl">
                {currentExam?.title ?? 'Exam'} — Result
              </CardTitle>
              <span
                className={`inline-block text-sm font-semibold px-3 py-1 rounded-full ${
                  result.passed
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {result.passed ? '✓ PASSED' : '✗ FAILED'}
              </span>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Score row */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-slate-50 rounded-lg border">
                  <span className="text-xs text-slate-500 block">Score</span>
                  <span className="text-2xl font-bold text-slate-900">
                    {result.score} / {result.total}
                  </span>
                </div>
                <div
                  className={`p-4 rounded-lg border ${
                    result.percentage >= 50
                      ? 'bg-emerald-50 border-emerald-100'
                      : 'bg-red-50 border-red-100'
                  }`}
                >
                  <span className="text-xs text-slate-500 block">Percentage</span>
                  <span className="text-2xl font-bold text-slate-900">
                    {result.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border">
                  <span className="text-xs text-slate-500 block">Status</span>
                  <span
                    className={`text-lg font-bold ${
                      result.passed ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {result.passed ? 'Pass' : 'Fail'}
                  </span>
                </div>
              </div>

              {/* Breakdown table */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">
                  Question Breakdown
                </h3>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 border-b text-xs uppercase text-slate-600 font-semibold">
                      <tr>
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4 text-center">Your Answer</th>
                        <th className="py-3 px-4 text-center">Correct Answer</th>
                        <th className="py-3 px-4 text-center">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-800">
                      {result.breakdown.map((item, idx) => (
                        <tr key={item.questionId} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium">Q{idx + 1}</td>
                          <td className="py-3 px-4 text-center font-mono">
                            {OPTION_LABELS[item.yourAnswer] ?? item.yourAnswer}
                          </td>
                          <td className="py-3 px-4 text-center font-mono">
                            {OPTION_LABELS[item.correctAnswer] ?? item.correctAnswer}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {item.correct ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs font-semibold">
                                <CheckCircle className="h-3.5 w-3.5" /> Correct
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-0.5 rounded text-xs font-semibold">
                                <XCircle className="h-3.5 w-3.5" /> Wrong
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CTA */}
              <div className="flex justify-center pt-2">
                <Button variant="outline" onClick={() => setView('list')}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to Exams
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
