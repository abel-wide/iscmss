'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Teacher {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  isActive: boolean;
}

export default function TeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', fullName: '' });

  const fetchTeachers = useCallback(async () => {
    try {
      const res = await api.get('/users/teachers');
      setTeachers(res.data);
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

    const loadTeachers = async () => {
      try {
        const res = await api.get('/users/teachers');
        if (isMounted) {
          setTeachers(res.data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadTeachers();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users/teachers', { ...form, password: form.password || 'Teacher@1234' });
      setForm({ email: '', password: '', fullName: '' });
      setShowForm(false);
      fetchTeachers(); // አሁን በ useCallback ስለተገለጸ ምንም ስህተት አይሰጥም
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this teacher?')) return;
    try {
      await api.delete(`/users/teachers/${id}`);
      fetchTeachers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <Button variant="outline" onClick={() => router.push('/admin')}>← Back</Button>
        <div className="flex justify-between items-center mt-4 mb-6">
          <h1 className="text-2xl font-bold">Teachers</h1>
          <Button onClick={() => setShowForm(!showForm)}>+ Add Teacher</Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader><CardTitle>Create Teacher</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-3">
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
                <Button type="submit">Create</Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {teachers.map((t) => (
            <Card key={t.id}>
              <CardContent className="flex justify-between items-center p-4">
                <div>
                  <p className="font-semibold">{t.fullName}</p>
                  <p className="text-sm text-slate-500">{t.email}</p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(t.id)}>Delete</Button>
              </CardContent>
            </Card>
          ))}
          {teachers.length === 0 && <p className="text-slate-500">No teachers yet.</p>}
        </div>
      </div>
    </div>
  );
}