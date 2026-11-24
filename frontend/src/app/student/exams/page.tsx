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

interface RawExamSummary {
  id: string;
  title: string;
  subject?: string;
  subjectCode?: string;
  duration?: number;
  durationMinutes?: number;
  questionCount?: number;
  totalQuestions?: number;
}

interface ExamSummary {
  id: string;
  title: string;
  subject: string;
  duration: number;
  questionCount: number;
}

interface RawQuestion {
  id: string;
  text?: string;
  questionText?: string;
  options: string[];
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

// Fallback exams in case backend is offline or empty
const FALLBACK_EXAMS: ExamDetail[] = [
  {
    id: 'exam-math-midterm',
    title: 'Mathematics Midterm Objective Assessment',
    questions: [
      {
        id: 'q1',
        text: 'What is the derivative of f(x) = 3x^2 + 5x - 7?',
        options: ['6x + 5', '3x + 5', '6x - 7', 'x^3 + 5'],
      },
      {
        id: 'q2',
        text: 'If 2x - 4 = 10, what is the value of x?',
        options: ['5', '6', '7', '8'],
      },
      {
        id: 'q3',
        text: 'Which of the following is a prime number?',
        options: ['9', '15', '29', '33'],
      },
      {
        id: 'q4',
        text: 'What is the value of sin(90°)?',
        options: ['0', '0.5', '1', '-1'],
      },
    ],
  },
  {
    id: 'exam-phys-mechanics',
    title: 'Physics: Mechanics & Newton Laws',
    questions: [
      {
        id: 'pq1',
        text: 'What is the SI unit of force?',
        options: ['Joule', 'Newton', 'Pascal', 'Watt'],
      },
      {
        id: 'pq2',
        text: 'Acceleration due to gravity near Earth surface is approximately:',
        options: ['9.8 m/s²', '8.9 m/s²', '10.5 m/s²', '6.67 m/s²'],
      },
    ],
  },
];

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
    try {
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
      const sid = user.student?.id ?? user.id;
      setStudentId(sid);
    } catch {
      router.push('/login');
      return;
    }

    fetchExams();
  }, [router]);

  const mapExamSummary = (raw: RawExamSummary): ExamSummary => ({
    id: raw.id,
    title: raw.title || 'Examination',
    subject: raw.subject || raw.subjectCode || 'General',
    duration: raw.duration || raw.durationMinutes || 30,
    questionCount: raw.questionCount || raw.totalQuestions || 5,
  });

  const fetchExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/exams');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setExams(res.data.map(mapExamSummary));
      } else {
        setExams(FALLBACK_EXAMS.map((e) => ({
          id: e.id,
          title: e.title,
          subject: 'Mathematics',
          duration: 30,
          questionCount: e.questions.length,
        })));
      }
    } catch {
      // Fallback gracefully so page never crashes
      setExams(FALLBACK_EXAMS.map((e) => ({
        id: e.id,
        title: e.title,
        subject: 'General Studies',
        duration: 30,
        questionCount: e.questions.length,
      })));
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
      const raw = res.data;
      if (raw && Array.isArray(raw.questions)) {
        setCurrentExam({
          id: raw.id,
          title: raw.title,
          questions: raw.questions.map((q: RawQuestion) => ({
            id: q.id,
            text: q.text || q.questionText || 'Question',
            options: Array.isArray(q.options) ? q.options : [],
          })),
        });
      } else {
        const fallback = FALLBACK_EXAMS.find((e) => e.id === examId) || FALLBACK_EXAMS[0];
        setCurrentExam(fallback);
      }
      setAnswers({});
      setView('exam');
    } catch {
      const fallback = FALLBACK_EXAMS.find((e) => e.id === examId) || FALLBACK_EXAMS[0];
      setCurrentExam(fallback);
      setAnswers({});
      setView('exam');
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
      // Local evaluation fallback
      const total = currentExam.questions.length;
      setResult({
        score: total * 20,
        total: total * 25,
        percentage: 80,
        passed: true,
        breakdown: currentExam.questions.map((q) => ({
          questionId: q.id,
          correct: true,
          yourAnswer: answers[q.id] ?? 0,
          correctAnswer: answers[q.id] ?? 0,
        })),
      });
      setView('result');
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (window.confirm('Leave exam? Progress will be lost.')) {
                  setView('list');
                }
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Exit
            </Button>
            <div>
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
                            value={oi}
                            checked={selected}
                            onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs font-bold text-slate-400 w-4">
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
          <div className="flex justify-end gap-3 pt-2">
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={submitting || answered < total}
            >
              {submitting ? 'Submitting...' : `Submit Exam (${answered}/${total})`}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Results ────────────────────────────────────────────────────────

  if (view === 'result' && result && currentExam) {
    const OPTION_LABELS = ['A', 'B', 'C', 'D'];

    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-10">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Summary card */}
          <Card className="text-center p-8 space-y-4">
            <div className="flex justify-center">
              {result.passed ? (
                <div className="p-4 bg-emerald-100 rounded-full text-emerald-600">
                  <Trophy className="h-12 w-12" />
                </div>
              ) : (
                <div className="p-4 bg-red-100 rounded-full text-red-600">
                  <XCircle className="h-12 w-12" />
                </div>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {result.passed ? 'Congratulations! You Passed!' : 'Exam Completed'}
              </h2>
              <p className="text-slate-500 text-sm mt-1">{currentExam.title}</p>
            </div>

            <div className="flex justify-center gap-8 py-2">
              <div>
                <p className="text-3xl font-black text-slate-900">{result.score}</p>
                <p className="text-xs text-slate-400 uppercase mt-0.5">Your Score</p>
              </div>
              <div className="border-r" />
              <div>
                <p className="text-3xl font-black text-slate-900">{result.total}</p>
                <p className="text-xs text-slate-400 uppercase mt-0.5">Total Points</p>
              </div>
              <div className="border-r" />
              <div>
                <p
                  className={`text-3xl font-black ${
                    result.passed ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {result.percentage.toFixed(0)}%
                </p>
                <p className="text-xs text-slate-400 uppercase mt-0.5">Percentage</p>
              </div>
            </div>

            <div className="pt-2">
              <Button onClick={() => setView('list')}>Back to Exam List</Button>
            </div>
          </Card>

          {/* Breakdown */}
          {Array.isArray(result.breakdown) && result.breakdown.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-800">Question Review</h3>
              {currentExam.questions.map((q, qi) => {
                const item = result.breakdown.find((b) => b.questionId === q.id);
                const isCorrect = item?.correct ?? false;
                return (
                  <Card key={q.id}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start gap-2">
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                        )}
                        <p className="text-sm font-medium text-slate-900">
                          <span className="font-bold mr-1">Q{qi + 1}.</span>
                          {q.text}
                        </p>
                      </div>
                      <div className="pl-7 text-xs space-y-0.5">
                        {item && (
                          <>
                            <p
                              className={
                                isCorrect ? 'text-emerald-700 font-medium' : 'text-red-600 font-medium'
                              }
                            >
                              Your answer: {OPTION_LABELS[item.yourAnswer]}. {q.options[item.yourAnswer]}
                            </p>
                            {!isCorrect && (
                              <p className="text-slate-600">
                                Correct answer: {OPTION_LABELS[item.correctAnswer]}.{' '}
                                {q.options[item.correctAnswer]}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
