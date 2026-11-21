'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { ArrowLeft, PlusCircle, Bell, Receipt, CheckCircle, Search } from 'lucide-react';

type PaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE';

interface Payment {
  id: string;
  studentName?: string;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
  penalty?: number;
  totalDue?: number;
  paidAt?: string;
  student?: {
    studentCode?: string;
    user?: { fullName?: string; name?: string };
  };
}

interface ReceiptData {
  receiptNumber: string;
  studentName: string;
  amount: number;
  paidAt: string;
  paymentMethod: string;
}

interface Student {
  id: string;
  studentCode: string;
  user?: { fullName?: string; name?: string };
}

const STATUS_FILTERS: (PaymentStatus | 'ALL')[] = ['ALL', 'PAID', 'PENDING', 'OVERDUE'];

const statusStyle: Record<PaymentStatus, string> = {
  PAID: 'bg-green-100 text-green-800 border-green-200',
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  OVERDUE: 'bg-red-100 text-red-800 border-red-200',
};

const EMPTY_INVOICE = { studentId: '', amount: '', dueDate: '' };

export default function AdminPaymentsPage() {
  const router = useRouter();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filter, setFilter] = useState<PaymentStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Invoicing dialog
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState(EMPTY_INVOICE);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  // Reminders
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderSuccess, setReminderSuccess] = useState<string | null>(null);

  // Receipt dialog
  const [receiptDialog, setReceiptDialog] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  // Fetch payments
  const fetchPayments = useCallback(async (currentFilter: PaymentStatus | 'ALL') => {
    try {
      const url = currentFilter === 'ALL' ? '/payments' : `/payments?status=${currentFilter}`;
      const res = await api.get(url);
      setPayments(res.data);
    } catch (err) {
      console.error('Failed to load payments', err);
    }
  }, []);

  // Fetch students for invoicing
  const fetchStudents = useCallback(async () => {
    try {
      const res = await api.get('/students');
      setStudents(res.data);
    } catch (err) {
      console.error('Failed to load students', err);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      const parsed = JSON.parse(userStr);
      if (parsed.role !== 'ADMIN' && parsed.role !== 'REGISTRAR') {
        router.push('/login');
        return;
      }
    } catch {
      router.push('/login');
      return;
    }

    const init = async () => {
      setLoading(true);
      await Promise.all([fetchPayments('ALL'), fetchStudents()]);
      setLoading(false);
    };

    init();
  }, [router, fetchPayments, fetchStudents]);

  const handleFilterChange = (f: PaymentStatus | 'ALL') => {
    setFilter(f);
    fetchPayments(f);
  };

  // Create invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.studentId || !invoiceForm.amount || !invoiceForm.dueDate) return;

    setInvoiceLoading(true);
    try {
      await api.post('/payments', {
        studentId: invoiceForm.studentId,
        amount: parseFloat(invoiceForm.amount),
        dueDate: invoiceForm.dueDate,
      });
      setShowInvoiceDialog(false);
      setInvoiceForm(EMPTY_INVOICE);
      await fetchPayments(filter);
    } catch (err) {
      console.error('Failed to create invoice', err);
    } finally {
      setInvoiceLoading(false);
    }
  };

  // Send reminders
  const handleSendReminders = async () => {
    setReminderLoading(true);
    setReminderSuccess(null);
    try {
      const res = await api.post('/payments/reminders');
      setReminderSuccess(res.data?.message || 'Reminders dispatched to parents successfully.');
      setTimeout(() => setReminderSuccess(null), 4000);
      await fetchPayments(filter);
    } catch (err) {
      console.error('Failed to send reminders', err);
    } finally {
      setReminderLoading(false);
    }
  };

  // View receipt
  const handleViewReceipt = async (id: string) => {
    setReceiptLoading(true);
    try {
      const res = await api.get(`/payments/${id}/receipt`);
      setReceiptData(res.data);
      setReceiptDialog(true);
    } catch (err) {
      console.error('Failed to fetch receipt', err);
    } finally {
      setReceiptLoading(false);
    }
  };

  // Filtered payments by search
  const filteredPayments = payments.filter((p) => {
    const studentName = p.studentName || p.student?.user?.fullName || p.student?.user?.name || '';
    const code = p.student?.studentCode || '';
    const q = search.toLowerCase();
    return studentName.toLowerCase().includes(q) || code.toLowerCase().includes(q);
  });

  // Calculate summaries
  const totalAmount = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalPaid = payments.filter((p) => p.status === 'PAID').reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalPending = payments.filter((p) => p.status === 'PENDING').reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalOverdue = payments.filter((p) => p.status === 'OVERDUE').reduce((acc, p) => acc + (p.totalDue || p.amount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Admin Dashboard</span>
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Fee & Payment Management</h1>
            <p className="text-slate-500 text-sm mt-1">
              Track student tuition fees, invoices, late penalties, and digital receipts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleSendReminders}
              disabled={reminderLoading}
              className="gap-2"
            >
              <Bell className="h-4 w-4 text-amber-500" />
              <span>{reminderLoading ? 'Sending...' : 'Send Reminders'}</span>
            </Button>
            <Button onClick={() => setShowInvoiceDialog(true)} className="gap-2">
              <PlusCircle className="h-4 w-4" />
              <span>Create Invoice</span>
            </Button>
          </div>
        </div>

        {/* Reminder Feedback Banner */}
        {reminderSuccess && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span>{reminderSuccess}</span>
          </div>
        )}

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-500 uppercase">Total Invoiced</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900">${totalAmount.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-emerald-600 uppercase">Total Collected</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-600">${totalPaid.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-amber-600 uppercase">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-600">${totalPending.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-red-600 uppercase">Overdue (+5% Penalty)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">${totalOverdue.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {STATUS_FILTERS.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={filter === s ? 'default' : 'outline'}
                onClick={() => handleFilterChange(s)}
                className="text-xs"
              >
                {s}
              </Button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search by student name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {/* Payments Table */}
        <Card className="shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="py-12 text-center text-slate-500 text-sm">Loading fee records...</div>
            ) : filteredPayments.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">No payment records found.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Late Penalty</TableHead>
                      <TableHead>Total Due</TableHead>
                      <TableHead className="text-right">Receipt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((p) => {
                      const studentName = p.studentName || p.student?.user?.fullName || p.student?.user?.name || 'N/A';
                      const studentCode = p.student?.studentCode || '';

                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium text-slate-900">
                            <div>{studentName}</div>
                            {studentCode && <div className="text-xs text-slate-400">{studentCode}</div>}
                          </TableCell>
                          <TableCell className="text-slate-800 font-semibold">${p.amount?.toFixed(2)}</TableCell>
                          <TableCell className="text-slate-600 text-sm">
                            {p.dueDate ? new Date(p.dueDate).toLocaleDateString() : '—'}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                statusStyle[p.status] || 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {p.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-red-600 text-sm font-medium">
                            {p.penalty && p.penalty > 0 ? `+$${p.penalty.toFixed(2)}` : '—'}
                          </TableCell>
                          <TableCell className="text-slate-900 font-bold">
                            ${(p.totalDue ?? p.amount)?.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {p.status === 'PAID' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewReceipt(p.id)}
                                disabled={receiptLoading}
                                className="h-8 gap-1.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                <Receipt className="h-3.5 w-3.5" />
                                <span>Receipt</span>
                              </Button>
                            ) : (
                              <span className="text-xs text-slate-400">Unpaid</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CREATE INVOICE DIALOG */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Fee Invoice</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateInvoice} className="space-y-4 py-2">
            <div>
              <Label>Select Student *</Label>
              <Select
                value={invoiceForm.studentId}
                onValueChange={(v) => setInvoiceForm((f) => ({ ...f, studentId: v ?? '' }))}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.user?.fullName || s.user?.name || s.studentCode} ({s.studentCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="inv-amount">Amount ($) *</Label>
              <Input
                id="inv-amount"
                type="number"
                step="0.01"
                placeholder="e.g. 500"
                value={invoiceForm.amount}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="inv-duedate">Due Date *</Label>
              <Input
                id="inv-duedate"
                type="date"
                value={invoiceForm.dueDate}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowInvoiceDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={invoiceLoading}>
                {invoiceLoading ? 'Creating...' : 'Create Invoice'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIGITAL RECEIPT DIALOG */}
      <Dialog open={receiptDialog} onOpenChange={setReceiptDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-600" />
              <span>Official Payment Receipt</span>
            </DialogTitle>
          </DialogHeader>
          {receiptData && (
            <div className="space-y-3 py-2 text-sm border-t border-b border-slate-100 my-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt No:</span>
                <span className="font-mono font-bold text-slate-800">{receiptData.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-semibold text-slate-800">{receiptData.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-bold text-emerald-600">${receiptData.amount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Date:</span>
                <span className="text-slate-700">{new Date(receiptData.paidAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="text-slate-700 font-medium">{receiptData.paymentMethod}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setReceiptDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
