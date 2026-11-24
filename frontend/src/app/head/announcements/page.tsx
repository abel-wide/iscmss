'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Bell, ChevronLeft, Plus, Megaphone } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  targetRole: string;
}

const TARGET_ROLES = ['ALL', 'TEACHER', 'PARENT', 'STUDENT'];

const roleBadgeColor: Record<string, string> = {
  ALL: 'bg-slate-100 text-slate-700',
  TEACHER: 'bg-blue-100 text-blue-700',
  PARENT: 'bg-purple-100 text-purple-700',
  STUDENT: 'bg-emerald-100 text-emerald-700',
};

export default function AnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [form, setForm] = useState({ title: '', message: '', targetRole: 'ALL' });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/notifications/announcements');
      setAnnouncements(res.data || []);
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 404) {
        setAnnouncements([]);
      } else {
        setAnnouncements([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    const parsed = JSON.parse(userData);
    if (parsed.role !== 'HEAD' && parsed.role !== 'ADMIN') { router.push('/login'); return; }
    fetchAnnouncements();
  }, [router]);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      showToast('error', 'Title and message are required.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/notifications/announcements', {
        title: form.title.trim(),
        message: form.message.trim(),
        targetRole: form.targetRole,
      });
      showToast('success', 'Announcement posted successfully!');
      setDialogOpen(false);
      setForm({ title: '', message: '', targetRole: 'ALL' });
      await fetchAnnouncements();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast('error', error.response?.data?.message || 'Failed to post announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.push('/head')}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to Dashboard
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-500" /> School Announcements
              </h1>
              <p className="text-xs text-slate-500">Post and manage school-wide announcements</p>
            </div>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" /> Create Announcement
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-4">
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm">Loading announcements…</div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
            <Megaphone className="h-12 w-12 opacity-30" />
            <p className="text-sm">No announcements yet.</p>
            <Button
              onClick={() => setDialogOpen(true)}
              variant="outline"
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-2" /> Create First Announcement
            </Button>
          </div>
        ) : (
          announcements.map((ann) => (
            <Card key={ann.id} className="hover:shadow-md transition">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base text-slate-800">{ann.title}</CardTitle>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                      roleBadgeColor[ann.targetRole] || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {ann.targetRole}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{formatDate(ann.createdAt)}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 line-clamp-3">{ann.message}</p>
              </CardContent>
            </Card>
          ))
        )}
      </main>

      {/* Create Announcement Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="mb-1 block text-sm font-medium">Title</Label>
              <Input
                placeholder="Announcement title…"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-1 block text-sm font-medium">Message</Label>
              <Textarea
                placeholder="Write your announcement here…"
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-1 block text-sm font-medium">Target Audience</Label>
              <select
                className="w-full border border-slate-200 rounded-md p-2.5 text-sm bg-white focus:ring-2 focus:ring-amber-300 outline-none"
                value={form.targetRole}
                onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
              >
                {TARGET_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {submitting ? 'Posting…' : 'Post Announcement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
