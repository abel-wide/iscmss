'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserPlus, Link2, ArrowLeft, Search } from 'lucide-react';

interface Student {
  id: string;
  studentCode: string;
  gender: string;
  status: string;
  user: { name: string; email: string };
  class?: { name: string };
  parent?: { user: { name: string } };
}

interface ClassData {
  id: string;
  name: string;
}

interface ParentUser {
  id: string;
  user: { name: string };
}

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  gender: 'MALE',
  dateOfBirth: '',
  classId: '',
  parentId: '',
};

const EMPTY_LINK = { studentId: '', parentId: '' };

export default function RegistrarStudentsPage() {
  const router = useRouter();

  // Auth
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem('user');
    if (!raw) { router.push('/login'); return; }
    try {
      const user = JSON.parse(raw);
      if (user.role !== 'REGISTRAR') { router.push('/login'); return; }
    } catch {
      router.push('/login');
    }
  }, [router]);

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [parents, setParents] = useState<ParentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Register dialog
  const [showRegister, setShowRegister] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);

  // Link parent dialog
  const [showLink, setShowLink] = useState(false);
  const [linkForm, setLinkForm] = useState({ ...EMPTY_LINK });
  const [linkSubmitting, setLinkSubmitting] = useState(false);

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (classFilter && classFilter !== 'ALL') params.classId = classFilter;
      const res = await api.get('/students', { params });
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, classFilter]);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchParents = useCallback(async () => {
    try {
      const res = await api.get('/users?role=PARENT');
      setParents(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    fetchClasses();
    fetchParents();
  }, [fetchClasses, fetchParents]);

  const handleRegister = async () => {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        password: form.password,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        classId: form.classId || undefined,
        parentId: form.parentId || undefined,
      };
      await api.post('/students', payload);
      setShowRegister(false);
      setForm({ ...EMPTY_FORM });
      showFeedback('success', 'Student registered successfully.');
      fetchStudents();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to register student.';
      showFeedback('error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLinkParent = async () => {
    setLinkSubmitting(true);
    try {
      await api.post('/users/link-parent-student', {
        parentId: linkForm.parentId,
        studentId: linkForm.studentId,
      });
      setShowLink(false);
      setLinkForm({ ...EMPTY_LINK });
      showFeedback('success', 'Parent linked successfully.');
      fetchStudents();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to link parent.';
      showFeedback('error', msg);
    } finally {
      setLinkSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/registrar')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Student Enrollment & Management</h1>
          <p className="text-sm text-gray-500">Register and manage students</p>
        </div>
        <div className="ml-auto">
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => setShowRegister(true)}>
            <UserPlus className="h-4 w-4" />
            Register New Student
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-4">
        {/* Feedback */}
        {feedback && (
          <div
            className={`px-4 py-3 rounded-lg text-sm font-medium ${
              feedback.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {feedback.msg}
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search students by name..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={classFilter} onValueChange={(v) => setClassFilter(v ?? 'ALL')}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowLink(true)}
            >
              <Link2 className="h-4 w-4" />
              Link Parent
            </Button>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Students ({students.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading students...</div>
            ) : students.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No students found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Student Code</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.user?.name ?? '—'}</TableCell>
                      <TableCell className="text-gray-500 font-mono text-sm">
                        {s.studentCode}
                      </TableCell>
                      <TableCell>{s.class?.name ?? '—'}</TableCell>
                      <TableCell>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            s.gender === 'MALE'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-pink-50 text-pink-700'
                          }`}
                        >
                          {s.gender}
                        </span>
                      </TableCell>
                      <TableCell>{s.parent?.user?.name ?? '—'}</TableCell>
                      <TableCell>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            s.status === 'ACTIVE'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {s.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Register Student Dialog */}
      <Dialog open={showRegister} onOpenChange={setShowRegister}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Register New Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label>Full Name</Label>
                <Input
                  placeholder="Student name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@school.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Gender</Label>
                <Select
                  value={form.gender}
                  onValueChange={(v) => setForm((f) => ({ ...f, gender: v ?? 'MALE' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Class</Label>
                <Select
                  value={form.classId}
                  onValueChange={(v) => setForm((f) => ({ ...f, classId: v ?? '' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Parent (optional)</Label>
                <Select
                  value={form.parentId}
                  onValueChange={(v) => setForm((f) => ({ ...f, parentId: v ?? '' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {parents.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.user?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegister(false)}>
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleRegister}
              disabled={submitting || !form.name || !form.email || !form.password}
            >
              {submitting ? 'Registering...' : 'Register Student'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Parent Dialog */}
      <Dialog open={showLink} onOpenChange={setShowLink}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Link Parent to Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Student</Label>
              <Select
                value={linkForm.studentId}
                onValueChange={(v) => setLinkForm((f) => ({ ...f, studentId: v ?? '' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.user?.name} ({s.studentCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Parent</Label>
              <Select
                value={linkForm.parentId}
                onValueChange={(v) => setLinkForm((f) => ({ ...f, parentId: v ?? '' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent" />
                </SelectTrigger>
                <SelectContent>
                  {parents.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.user?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLink(false)}>
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleLinkParent}
              disabled={linkSubmitting || !linkForm.studentId || !linkForm.parentId}
            >
              {linkSubmitting ? 'Linking...' : 'Link Parent'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
