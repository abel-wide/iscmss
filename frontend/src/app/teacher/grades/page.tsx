'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Student {
  id: string;
  user: { fullName: string };
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

export default function GradesPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [assessment, setAssessment] = useState(0);
  const [finalExam, setFinalExam] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    api.get('/students').then((res) => setStudents(res.data));
    // ለሙከራ የሚሆን ዳታ (ወይም ካለው API ተጠቀም)
    api.get('/subjects').then((res) => setSubjects(res.data)).catch(() => {
      setSubjects([{ id: '1', name: 'Mathematics', code: 'MATH' }]);
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/grades', {
        studentId: selectedStudent,
        subjectId: selectedSubject,
        assessment,
        finalExam,
      });
      alert('Grade saved successfully!');
      setAssessment(0);
      setFinalExam(0);
    } catch (err: unknown) {
      // 'any' ን በ 'unknown' ተካነዋል
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Error saving grade');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="outline" onClick={() => router.push('/teacher')}>← Back</Button>
        <h1 className="text-2xl font-bold my-4">Enter Grades</h1>

        <Card>
          <CardHeader><CardTitle>Add / Update Mark</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label>Student</Label>
                <select
                  className="w-full border rounded-md p-2 mt-1"
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  required
                >
                  <option value="">-- Select Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.user.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Subject</Label>
                <select
                  className="w-full border rounded-md p-2 mt-1"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  required
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Assessment (0-40)</Label>
                <Input type="number" value={assessment} onChange={(e) => setAssessment(Number(e.target.value))} min={0} max={40} required />
              </div>
              <div>
                <Label>Final Exam (0-60)</Label>
                <Input type="number" value={finalExam} onChange={(e) => setFinalExam(Number(e.target.value))} min={0} max={60} required />
              </div>
              <Button type="submit">Save Grade</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}