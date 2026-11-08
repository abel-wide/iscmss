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
}

interface Student {
  id: string;
  studentCode: string;
  user: { fullName: string; email: string };
  class?: { name: string };
}

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    studentCode: '',
    dateOfBirth: '',
    gender: 'MALE',
    classId: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const [sRes, cRes] = await Promise.all([
        api.get('/students'),
        api.get('/classes'),
      ]);
      setStudents(sRes.data);
      setClasses(cRes.data);
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
    const load = async () => {
      try {
        const [sRes, cRes] = await Promise.all([
          api.get('/students'),
          api.get('/classes'),
        ]);
        if (isMounted) {
          setStudents(sRes.data);
          setClasses(cRes.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    load();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        classId: form.classId || undefined,
      };
      await api.post('/students', payload);
      setForm({
        fullName: '', email: '', password: '', studentCode: '',
        dateOfBirth: '', gender: 'MALE', classId: '',
      });
      setShowForm(false);
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this student?')) return;
    try {
      await api.delete(`/students/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <Button variant="outline" onClick={() => router.push('/admin')}>← Back</Button>
        <div className="flex justify-between items-center mt-4 mb-6">
          <h1 className="text-2xl font-bold">Students</h1>
          <Button onClick={() => setShowForm(!showForm)}>+ Add Student</Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader><CardTitle>Register Student</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Full Name</Label>
                  <Input value={form.fullName} onChange={(e) => setForm({...form, fullName: e.target.value})} required />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} placeholder="Min 8 chars" required />
                </div>
                <div>
                  <Label>Student Code</Label>
                  <Input value={form.studentCode} onChange={(e) => setForm({...form, studentCode: e.target.value})} placeholder="e.g. WCU-2026-001" required />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({...form, dateOfBirth: e.target.value})} required />
                </div>
                <div>
                  <Label>Gender</Label>
                  <select
                    className="w-full border rounded-md p-2"
                    value={form.gender}
                    onChange={(e) => setForm({...form, gender: e.target.value})}
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <Label>Class (Optional)</Label>
                  <select
                    className="w-full border rounded-md p-2"
                    value={form.classId}
                    onChange={(e) => setForm({...form, classId: e.target.value})}
                  >
                    <option value="">-- Select Class --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <Button type="submit">Register Student</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {students.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex justify-between items-center p-4">
                <div>
                  <p className="font-semibold">{s.user.fullName}</p>
                  <p className="text-sm text-slate-500">
                    {s.studentCode} • {s.class?.name || 'No Class'} • {s.user.email}
                  </p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(s.id)}>Delete</Button>
              </CardContent>
            </Card>
          ))}
          {students.length === 0 && <p className="text-slate-500">No students yet.</p>}
        </div>
      </div>
    </div>
  );
}