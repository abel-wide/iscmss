'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ClassData {
  id: string;
  name: string;
  gradeLevel: number;
  academicYear: string;
  _count?: { students: number };
}

export default function ClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', gradeLevel: 1, academicYear: '2026' });

  const fetchClasses = useCallback(async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    let isMounted = true;
    const loadClasses = async () => {
      try {
        const res = await api.get('/classes');
        if (isMounted) setClasses(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    loadClasses();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/classes', { ...form, gradeLevel: Number(form.gradeLevel) });
      setForm({ name: '', gradeLevel: 1, academicYear: '2026' });
      setShowForm(false);
      fetchClasses();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this class?')) return;
    try {
      await api.delete(`/classes/${id}`);
      fetchClasses();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <Button variant="outline" onClick={() => router.push('/admin')}>← Back</Button>
        <div className="flex justify-between items-center mt-4 mb-6">
          <h1 className="text-2xl font-bold">Classes</h1>
          <Button onClick={() => setShowForm(!showForm)}>+ Add Class</Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader><CardTitle>Create Class</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <Label>Class Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="e.g. Grade 5A" required />
                </div>
                <div>
                  <Label>Grade Level</Label>
                  <Input type="number" value={form.gradeLevel} onChange={(e) => setForm({...form, gradeLevel: Number(e.target.value)})} required />
                </div>
                <div>
                  <Label>Academic Year</Label>
                  <Input value={form.academicYear} onChange={(e) => setForm({...form, academicYear: e.target.value})} required />
                </div>
                <Button type="submit">Create</Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {classes.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex justify-between items-center p-4">
                <div>
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-sm text-slate-500">Grade {c.gradeLevel} • {c.academicYear} • {c._count?.students || 0} students</p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(c.id)}>Delete</Button>
              </CardContent>
            </Card>
          ))}
          {classes.length === 0 && <p className="text-slate-500">No classes yet.</p>}
        </div>
      </div>
    </div>
  );
}