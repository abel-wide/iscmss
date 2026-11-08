'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Mark {
  id: string;
  assessment: number;
  finalExam: number;
  total: number;
  subject: { name: string; code: string };
}

// 1. ዋናው አካል (ከ useParams ጋር)
function GradesContent() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;
  const [marks, setMarks] = useState<Mark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchMarks = async () => {
      try {
        const res = await api.get(`/grades/student/${studentId}`);
        setMarks(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMarks();
  }, [router, studentId]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-3xl mx-auto">
        <Button variant="outline" onClick={() => router.push('/parent')}>← Back</Button>
        <h1 className="text-2xl font-bold my-4">Academic Results</h1>

        <Card>
          <CardHeader><CardTitle>Marks</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {marks.map((m) => (
                <div key={m.id} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-semibold">{m.subject.name} ({m.subject.code})</p>
                    <p className="text-sm text-slate-500">
                      Assessment: {m.assessment} | Final: {m.finalExam}
                    </p>
                  </div>
                  <p className="text-2xl font-bold">{m.total}</p>
                </div>
              ))}
              {marks.length === 0 && <p className="text-slate-500">No grades yet.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// 2. ገጹ ሲጫን Suspense ን የሚጠቀም ዋና አካል
export default function ParentGradesPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <GradesContent />
    </Suspense>
  );
}