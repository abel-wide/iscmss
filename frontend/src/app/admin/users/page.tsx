'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { ArrowLeft, UserPlus, Users } from 'lucide-react';

interface UserRecord {
  id: string;
  name: string;
  fullName?: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface Student {
  id: string;
  studentCode: string;
  user?: { fullName?: string; name?: string };
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  HEAD: 'bg-purple-100 text-purple-700',
  REGISTRAR: 'bg-blue-100 text-blue-700',
  TEACHER: 'bg-green-100 text-green-700',
  PARENT: 'bg-orange-100 text-orange-700',
  STUDENT: 'bg-teal-100 text-teal-700',
};

const ALL_ROLES = ['All', 'ADMIN', 'HEAD', 'REGISTRAR', 'TEACHER', 'PARENT', 'STUDENT'];

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusMsg, setStatusMsg] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');

  // Staff dialog state
  const [showStaffDialog, setShowStaffDialog] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '', role: 'HEAD' });
  const [staffLoading, setStaffLoading] = useState(false);

  // Parent dialog state
  const [showParentDialog, setShowParentDialog] = useState(false);
  const [parentForm, setParentForm] = useState({ name: '', email: '', password: '', studentId: '' });
  const [parentLoading, setParentLoading] = useState(false);

  const showStatus = (msg: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg(msg);
    setStatusType(type);
    setTimeout(() => setStatusMsg(''), 4000);
  };

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      showStatus('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await api.get('/students');
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    const parsed = JSON.parse(userData);
    if (parsed.role !== 'ADMIN') { router.push('/login'); return; }
    fetchUsers();
    fetchStudents();
  }, [router, fetchUsers, fetchStudents]);

  const handleToggleStatus = async (u: UserRecord) => {
    try {
      await api.patch(`/users/${u.id}/status`, { isActive: !u.isActive });
      showStatus(`User ${!u.isActive ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      showStatus('Failed to update user status', 'error');
    }
  };

  const handleCreateStaff = async () => {
    if (!staffForm.name || !staffForm.email || !staffForm.password) {
      showStatus('Please fill all required fields', 'error');
      return;
    }
    setStaffLoading(true);
    try {
      await api.post('/users/staff', staffForm);
      showStatus('Staff account created successfully');
      setShowStaffDialog(false);
      setStaffForm({ name: '', email: '', password: '', role: 'HEAD' });
      fetchUsers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create staff account';
      showStatus(msg, 'error');
    } finally {
      setStaffLoading(false);
    }
  };

  const handleCreateParent = async () => {
    if (!parentForm.name || !parentForm.email || !parentForm.password) {
      showStatus('Please fill all required fields', 'error');
      return;
    }
    setParentLoading(true);
    try {
      const payload: Record<string, string> = {
        name: parentForm.name,
        email: parentForm.email,
        password: parentForm.password,
      };
      if (parentForm.studentId) payload.studentId = parentForm.studentId;
      await api.post('/users/parents', payload);
      showStatus('Parent account created successfully');
      setShowParentDialog(false);
      setParentForm({ name: '', email: '', password: '', studentId: '' });
      fetchUsers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create parent account';
      showStatus(msg, 'error');
    } finally {
      setParentLoading(false);
    }
  };

  const filteredUsers = roleFilter === 'All' ? users : users.filter((u) => u.role === roleFilter);

  if (loading) return <div className="p-8">Loading users…</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.push('/admin')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="h-6 w-6" /> User Management
              </h1>
              <p className="text-slate-500 text-sm">{filteredUsers.length} user(s) found</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setShowStaffDialog(true)} className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" /> Create Staff Account
            </Button>
            <Button variant="outline" onClick={() => setShowParentDialog(true)} className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" /> Create Parent Account
            </Button>
          </div>
        </div>

        {/* Status message */}
        {statusMsg && (
          <div className={`px-4 py-3 rounded-md text-sm font-medium ${statusType === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {statusMsg}
          </div>
        )}

        {/* Role filter */}
        <div className="flex gap-2 flex-wrap">
          {ALL_ROLES.map((r) => (
            <Button
              key={r}
              size="sm"
              variant={roleFilter === r ? 'default' : 'outline'}
              onClick={() => setRoleFilter(r)}
            >
              {r}
            </Button>
          ))}
        </div>

        {/* Users table */}
        <Card>
          <CardHeader><CardTitle>All Users</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold text-slate-600">Name</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Email</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Role</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Status</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Created</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-medium">{u.fullName || u.name}</td>
                      <td className="p-4 text-slate-600">{u.email}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-700'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <Button
                          size="sm"
                          variant={u.isActive ? 'destructive' : 'outline'}
                          onClick={() => handleToggleStatus(u)}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">No users found for this filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Staff Dialog */}
      <Dialog open={showStaffDialog} onOpenChange={setShowStaffDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Staff Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="staff-name">Full Name *</Label>
              <Input
                id="staff-name"
                placeholder="e.g. John Doe"
                value={staffForm.name}
                onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="staff-email">Email *</Label>
              <Input
                id="staff-email"
                type="email"
                placeholder="staff@school.edu"
                value={staffForm.email}
                onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="staff-password">Password *</Label>
              <Input
                id="staff-password"
                type="password"
                placeholder="••••••••"
                value={staffForm.password}
                onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="staff-role">Role *</Label>
              <Select value={staffForm.role} onValueChange={(v) => setStaffForm({ ...staffForm, role: v ?? '' })}>
                <SelectTrigger id="staff-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                  <SelectItem value="HEAD">HEAD</SelectItem>
                  <SelectItem value="REGISTRAR">REGISTRAR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStaffDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateStaff} disabled={staffLoading}>
              {staffLoading ? 'Creating…' : 'Create Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Parent Dialog */}
      <Dialog open={showParentDialog} onOpenChange={setShowParentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Parent Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="parent-name">Full Name *</Label>
              <Input
                id="parent-name"
                placeholder="e.g. Jane Smith"
                value={parentForm.name}
                onChange={(e) => setParentForm({ ...parentForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="parent-email">Email *</Label>
              <Input
                id="parent-email"
                type="email"
                placeholder="parent@example.com"
                value={parentForm.email}
                onChange={(e) => setParentForm({ ...parentForm, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="parent-password">Password *</Label>
              <Input
                id="parent-password"
                type="password"
                placeholder="••••••••"
                value={parentForm.password}
                onChange={(e) => setParentForm({ ...parentForm, password: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="parent-student">Link to Student (optional)</Label>
              <Select value={parentForm.studentId} onValueChange={(v) => setParentForm({ ...parentForm, studentId: v ?? '' })}>
                <SelectTrigger id="parent-student">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.user?.fullName || s.user?.name || s.studentCode} ({s.studentCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowParentDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateParent} disabled={parentLoading}>
              {parentLoading ? 'Creating…' : 'Create Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
