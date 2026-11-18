'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Resource {
  id: string;
  title: string;
  type: string;
  url: string;
  createdAt: string;
  teacher?: {
    user?: {
      fullName: string;
    };
  };
}

interface UserData {
  id: string;
  fullName?: string;
  teacher?: {
    id: string;
  };
  [key: string]: unknown;
}

export default function TeacherResourcesPage() {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'PDF', url: '' });
  const [teacherId, setTeacherId] = useState<string | null>(null);

  const fetchResources = useCallback(async () => {
    try {
      const res = await api.get('/resources');
      setResources(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userDataStr = localStorage.getItem('user');
    
    if (!token || !userDataStr) {
      router.push('/login');
      return;
    }

    try {
      const userData: UserData = JSON.parse(userDataStr);
      if (userData?.teacher?.id) {
        setTeacherId(userData.teacher.id);
      }
    } catch (e) {
      console.error("Failed to parse user data", e);
    }

    fetchResources();
  }, [router, fetchResources]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId) {
      alert('Teacher ID not found. Please re-login.');
      return;
    }

    try {
      await api.post('/resources', {
        title: form.title,
        type: form.type,
        url: form.url,
        teacherId: teacherId,
      });
      setForm({ title: '', type: 'PDF', url: '' });
      setShowForm(false);
      fetchResources();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Error uploading resource');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this resource?')) return;
    try {
      await api.delete(`/resources/${id}`);
      fetchResources();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Error deleting resource');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="outline" onClick={() => router.push('/teacher')}>← Back to Dashboard</Button>
        
        <div className="flex justify-between items-center mt-4 mb-6">
          <h1 className="text-2xl font-bold">Learning Hub (My Resources)</h1>
          <Button onClick={() => setShowForm(!showForm)}>+ Upload Resource</Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader><CardTitle>Upload New Resource</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-3">
                <div>
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div>
                  <Label>Type</Label>
                  <select 
                    className="w-full border rounded-md p-2 bg-white" 
                    value={form.type} 
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="PDF">PDF</option>
                    <option value="VIDEO">Video</option>
                    <option value="NOTE">Note</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <Label>URL (File Link)</Label>
                  <Input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://example.com/file.pdf" required />
                </div>
                <Button type="submit">Upload</Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {resources.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex justify-between items-center p-4">
                <div>
                  <p className="font-semibold">{r.title} <span className="text-sm text-slate-500 font-normal">({r.type})</span></p>
                  <a href={r.url} target="_blank" rel="noreferrer" className="text-sm text-blue-500 hover:underline block truncate max-w-md">
                    {r.url}
                  </a>
                  <p className="text-xs text-slate-400 mt-1">
                    By: {r.teacher?.user?.fullName || 'Unknown'} | Added: {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(r.id)}>Delete</Button>
              </CardContent>
            </Card>
          ))}
          {resources.length === 0 && <p className="text-slate-500 text-center py-8">No resources uploaded yet.</p>}
        </div>
      </div>
    </div>
  );
}