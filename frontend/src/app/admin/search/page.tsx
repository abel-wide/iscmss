'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Search as SearchIcon,
  GraduationCap,
  School,
  BookOpen,
  DollarSign,
  User,
} from 'lucide-react';

interface SearchResult {
  students?: Array<{
    id: string;
    studentCode: string;
    user?: { fullName?: string; email?: string };
    class?: { name: string };
  }>;
  classes?: Array<{
    id: string;
    name: string;
    gradeLevel: number;
    roomTeacher?: { user?: { fullName?: string } };
  }>;
  subjects?: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  payments?: Array<{
    id: string;
    amount: number;
    status: string;
    student?: { user?: { fullName?: string } };
  }>;
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(q.trim())}`);
      setResults(res.data);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery, performSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/admin/search?q=${encodeURIComponent(query.trim())}`);
      performSearch(query.trim());
    }
  };

  const hasResults =
    results &&
    ((results.students && results.students.length > 0) ||
      (results.classes && results.classes.length > 0) ||
      (results.subjects && results.subjects.length > 0) ||
      (results.payments && results.payments.length > 0));

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
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System-Wide Search</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Query across student records, classrooms, subjects, and fee payments.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="flex gap-3 max-w-2xl">
          <div className="relative flex-1">
            <SearchIcon className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search by student name, code, class, or subject..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-11 text-base bg-white"
            />
          </div>
          <Button type="submit" className="h-11 px-6">
            Search
          </Button>
        </form>

        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm">Searching records across the database...</div>
        ) : !hasResults && query ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            No records found matching "{query}". Try a different keyword or name.
          </div>
        ) : results ? (
          <div className="space-y-6 pt-2">
            {/* Students */}
            {results.students && results.students.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                  <span>Students ({results.students.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {results.students.map((s) => (
                    <Card key={s.id} className="shadow-sm border-slate-200">
                      <CardContent className="p-4 space-y-1">
                        <p className="font-bold text-slate-900">{s.user?.fullName || 'Student'}</p>
                        <p className="text-xs text-slate-500">Code: {s.studentCode}</p>
                        <p className="text-xs text-slate-500">Email: {s.user?.email || '—'}</p>
                        {s.class && <p className="text-xs font-semibold text-blue-600">Class: {s.class.name}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Classes */}
            {results.classes && results.classes.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <School className="h-5 w-5 text-indigo-600" />
                  <span>Classes ({results.classes.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {results.classes.map((c) => (
                    <Card key={c.id} className="shadow-sm border-slate-200">
                      <CardContent className="p-4 space-y-1">
                        <p className="font-bold text-slate-900">{c.name}</p>
                        <p className="text-xs text-slate-500">Grade Level: {c.gradeLevel}</p>
                        <p className="text-xs text-slate-600 font-medium">
                          Room Teacher: {c.roomTeacher?.user?.fullName || 'Not assigned'}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Subjects */}
            {results.subjects && results.subjects.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-emerald-600" />
                  <span>Subjects ({results.subjects.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {results.subjects.map((sub) => (
                    <Card key={sub.id} className="shadow-sm border-slate-200">
                      <CardContent className="p-4 space-y-1">
                        <p className="font-bold text-slate-900">{sub.name}</p>
                        <p className="text-xs text-slate-500">Code: {sub.code}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Payments */}
            {results.payments && results.payments.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-amber-600" />
                  <span>Payments ({results.payments.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {results.payments.map((p) => (
                    <Card key={p.id} className="shadow-sm border-slate-200">
                      <CardContent className="p-4 space-y-1">
                        <p className="font-bold text-slate-900">{p.student?.user?.fullName || 'Student'}</p>
                        <p className="text-xs text-slate-500">Amount: ${p.amount}</p>
                        <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 uppercase">
                          {p.status}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminSearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
