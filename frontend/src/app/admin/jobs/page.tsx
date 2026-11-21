'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { ArrowLeft, Briefcase, PlusCircle, MapPin, Clock, CheckCircle } from 'lucide-react';

interface JobPosting {
  id: string;
  title: string;
  department: string;
  type: string;
  location: string;
  description: string;
  deadline: string;
  status: 'OPEN' | 'CLOSED';
}

const INITIAL_JOBS: JobPosting[] = [
  {
    id: '1',
    title: 'Senior Mathematics Teacher (High School)',
    department: 'Mathematics & Science',
    type: 'Full-time',
    location: 'Wachemo Campus, Hossana',
    description: 'Seeking an experienced mathematics educator capable of teaching advanced algebra and calculus for Grade 11–12.',
    deadline: '2026-12-15',
    status: 'OPEN',
  },
  {
    id: '2',
    title: 'Assistant Registrar & Admissions Officer',
    department: 'Academic Administration',
    type: 'Full-time',
    location: 'Administration Wing, Hossana',
    description: 'Responsible for student enrollment data verification, transcript maintenance, and parent inquiries.',
    deadline: '2026-12-20',
    status: 'OPEN',
  },
  {
    id: '3',
    title: 'English Language & Literature Instructor',
    department: 'Languages',
    type: 'Full-time',
    location: 'Wachemo Campus, Hossana',
    description: 'Delivering interactive English language proficiency, composition, and literature classes.',
    deadline: '2026-11-30',
    status: 'OPEN',
  },
];

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>(INITIAL_JOBS);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    title: '',
    department: '',
    type: 'Full-time',
    location: 'Wachemo Campus, Hossana',
    description: '',
    deadline: '',
  });

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.department) return;

    const newJob: JobPosting = {
      id: Date.now().toString(),
      title: form.title,
      department: form.department,
      type: form.type,
      location: form.location,
      description: form.description,
      deadline: form.deadline || 'Open until filled',
      status: 'OPEN',
    };

    setJobs([newJob, ...jobs]);
    setShowDialog(false);
    setForm({
      title: '',
      department: '',
      type: 'Full-time',
      location: 'Wachemo Campus, Hossana',
      description: '',
      deadline: '',
    });
  };

  const toggleStatus = (id: string) => {
    setJobs(
      jobs.map((j) => (j.id === id ? { ...j, status: j.status === 'OPEN' ? 'CLOSED' : 'OPEN' } : j))
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Admin Dashboard</span>
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Staff Recruitment & Vacancies</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Manage school job vacancies, teaching positions, and staff recruitment postings.
            </p>
          </div>

          <Button onClick={() => setShowDialog(true)} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            <span>Post New Vacancy</span>
          </Button>
        </div>

        {/* Job Postings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {jobs.map((job) => (
            <Card key={job.id} className="shadow-sm border-slate-200 flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    {job.department}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase ${
                      job.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
                <CardTitle className="text-lg font-bold text-slate-900">{job.title}</CardTitle>
                <CardDescription className="text-slate-600 text-xs line-clamp-3 mt-1">
                  {job.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 border-t border-slate-100 text-xs space-y-2">
                <div className="flex items-center gap-2 text-slate-500">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Deadline: {job.deadline}</span>
                </div>
                <div className="pt-2 flex justify-between items-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleStatus(job.id)}
                    className="h-7 text-xs"
                  >
                    {job.status === 'OPEN' ? 'Close Position' : 'Re-open'}
                  </Button>
                  <span className="text-slate-400 text-[11px]">Type: {job.type}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CREATE JOB DIALOG */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Job Vacancy</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateJob} className="space-y-4 py-2">
            <div>
              <Label htmlFor="job-title">Position Title *</Label>
              <Input
                id="job-title"
                placeholder="e.g. Chemistry Teacher"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="job-dept">Department *</Label>
              <Input
                id="job-dept"
                placeholder="e.g. Science & Technology"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="job-type">Type</Label>
                <Input
                  id="job-type"
                  placeholder="Full-time"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="job-deadline">Deadline</Label>
                <Input
                  id="job-deadline"
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="job-desc">Job Description</Label>
              <Textarea
                id="job-desc"
                placeholder="Key responsibilities and candidate qualifications..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="mt-1"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Publish Vacancy</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
