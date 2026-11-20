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
import { ArrowLeft, PlusCircle, Bell, Receipt } from 'lucide-react';

type PaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE';

interface Payment {
  id: string;
  studentName: string;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
  penalty?: number;
  totalDue?: number;
  paidAt?: string;
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
  user: { name: string };
}

const STATUS_FILTERS: (PaymentStatus | 'ALL')[] = ['ALL', 'PAID', 'PENDING', 'OVERDUE'];

const statusStyle: Record<PaymentStatus, string> = {
  PAID: 'bg-green-50 text-green-700 border border-green-200',
  PENDING: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  OVERDUE: 'bg-red-50 text-red-700 border border-red-200',
};

const EMPTY_INVOICE = { studentId: '', amount: '', dueDate: '' };

export default function RegistrarPaymentsPage() {
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

  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'ALL'>('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Create Invoice dialog
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ ...EMPTY_INVOICE });
  const [invoiceSubmitting, setInvoiceSubmitting] = useState(false);

  // Receipt dialog
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments');
      setPayments(res.data);
    } catch (err) {
      console.error(err);
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
    fetchPayments();
    fetchStudents();
  }, [fetchPayments, fetchStudents]);

  const filteredPayments =
    statusFilter === 'ALL'
      ? payments
      : payments.filter((p) => p.status === statusFilter);

  const handleCreateInvoice = async () => {
    setInvoiceSubmitting(true);
    try {
      await api.post('/payments', {
        studentId: invoiceForm.studentId,
        amount: parseFloat(invoiceForm.amount),
        dueDate: invoiceForm.dueDate,
      });
      setShowInvoice(false);
      setInvoiceForm({ ...EMPTY_INVOICE });
      showFeedback('success', 'Invoice created successfully.');
      fetchPayments();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create invoice.';
      showFeedback('error', msg);
    } finally {
      setInvoiceSubmitting(false);
    }
  };

  const handleSendReminders = async () => {
    try {
      const res = await api.post('/payments/reminders');
      const count = res.data?.count ?? res.data?.sent ?? '';
      showFeedback('success', `Reminders sent${count ? ` to ${count} parents` : ''}.`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to send reminders.';
      showFeedback('error', msg);
    }
  };

  const handleViewReceipt = async (paymentId: string) => {
    setReceiptLoading(true);
    setShowReceipt(true);
    try {
      const res = await api.get(`/payments/${paymentId}/receipt`);
      setReceiptData(res.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to load receipt.';
      showFeedback('error', msg);
      setShowReceipt(false);
    } finally {
      setReceiptLoading(false);
    }
  };

  const fmt = (n?: number) =>
    n !== undefined ? `$${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—';

  const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : '—');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => router.push('/registrar')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Fee Management</h1>
          <p className="text-sm text-gray-500">Create invoices and track payments</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleSendReminders}
          >
            <Bell className="h-4 w-4" />
            Send Reminders
          </Button>
          <Button
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowInvoice(true)}
          >
            <PlusCircle className="h-4 w-4" />
            Create Invoice
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

        {/* Status Filter */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(s)}
              className={
                statusFilter === s
                  ? s === 'PAID'
                    ? 'bg-green-600 hover:bg-green-700'
                    : s === 'PENDING'
                    ? 'bg-yellow-500 hover:bg-yellow-600'
                    : s === 'OVERDUE'
                    ? 'bg-red-600 hover:bg-red-700'
                    : ''
                  : ''
              }
            >
              {s}
            </Button>
          ))}
        </div>

        {/* Payments Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Payments ({filteredPayments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading payments...</div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No payments found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Penalty</TableHead>
                    <TableHead>Total Due</TableHead>
                    <TableHead>Paid At</TableHead>
                    <TableHead>Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.studentName}</TableCell>
                      <TableCell>{fmt(p.amount)}</TableCell>
                      <TableCell>{fmtDate(p.dueDate)}</TableCell>
                      <TableCell>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyle[p.status]}`}
                        >
                          {p.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {p.status === 'OVERDUE' && p.penalty !== undefined ? (
                          <span className="text-red-600 font-medium">{fmt(p.penalty)}</span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        {p.status === 'OVERDUE' && p.totalDue !== undefined ? (
                          <span className="text-red-600 font-bold">{fmt(p.totalDue)}</span>
                        ) : (
                          fmt(p.amount)
                        )}
                      </TableCell>
                      <TableCell>{p.paidAt ? fmtDate(p.paidAt) : '—'}</TableCell>
                      <TableCell>
                        {p.status === 'PAID' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => handleViewReceipt(p.id)}
                          >
                            <Receipt className="h-3 w-3" />
                            Receipt
                          </Button>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Invoice Dialog */}
      <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Student</Label>
              <Select
                value={invoiceForm.studentId}
                onValueChange={(v) => setInvoiceForm((f) => ({ ...f, studentId: v ?? '' }))}
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
              <Label>Amount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={invoiceForm.amount}
                onChange={(e) => setInvoiceForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={invoiceForm.dueDate}
                onChange={(e) => setInvoiceForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvoice(false)}>
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleCreateInvoice}
              disabled={
                invoiceSubmitting ||
                !invoiceForm.studentId ||
                !invoiceForm.amount ||
                !invoiceForm.dueDate
              }
            >
              {invoiceSubmitting ? 'Creating...' : 'Create Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Payment Receipt
            </DialogTitle>
          </DialogHeader>
          {receiptLoading ? (
            <div className="text-center py-8 text-gray-500">Loading receipt...</div>
          ) : receiptData ? (
            <div className="space-y-3 py-2">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Receipt #</span>
                  <span className="font-mono text-sm font-bold">{receiptData.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Student</span>
                  <span className="font-medium">{receiptData.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Amount Paid</span>
                  <span className="font-bold text-green-700">{fmt(receiptData.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Paid At</span>
                  <span>{fmtDate(receiptData.paidAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Payment Method</span>
                  <span className="capitalize">{receiptData.paymentMethod}</span>
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceipt(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
