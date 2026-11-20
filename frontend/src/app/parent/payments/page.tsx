'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CreditCard, Receipt, ArrowLeft } from 'lucide-react';

interface Payment {
  id: string;
  studentName?: string;
  student?: { user?: { fullName?: string; name?: string }; studentCode?: string };
  amount: number;
  dueDate: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  penalty?: number;
  totalDue?: number;
  paidAt?: string;
}

interface ReceiptData {
  receiptNumber: string;
  studentName: string;
  amount: number;
  paidAt: string;
  paymentMethod?: string;
}

const STATUS_STYLES: Record<string, string> = {
  PAID: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  OVERDUE: 'bg-red-100 text-red-700',
};

export default function ParentPaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);

  const fetchPayments = useCallback(async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return;
      const parsedUser = JSON.parse(userData);
      const parentId = parsedUser?.parent?.id;

      const url = parentId ? `/payments?parentId=${parentId}` : '/payments';
      const res = await api.get(url);
      setPayments(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/login'); return; }
    const parsed = JSON.parse(userData);
    if (parsed.role !== 'PARENT') { router.push('/login'); return; }
    fetchPayments();
  }, [router, fetchPayments]);

  const handleGetReceipt = async (paymentId: string) => {
    setReceiptLoading(true);
    setShowReceiptDialog(true);
    try {
      const res = await api.get(`/payments/${paymentId}/receipt`);
      setReceipt(res.data);
    } catch (err) {
      console.error(err);
      setReceipt(null);
    } finally {
      setReceiptLoading(false);
    }
  };

  const getStudentName = (p: Payment) =>
    p.studentName || p.student?.user?.fullName || p.student?.user?.name || '—';

  if (loading) return <div className="p-8">Loading payments…</div>;

  const totalPaid = payments.filter((p) => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments
    .filter((p) => p.status !== 'PAID')
    .reduce((sum, p) => sum + (p.totalDue ?? p.amount), 0);

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/parent')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="h-6 w-6" /> Payments
            </h1>
            <p className="text-slate-500 text-sm">{payments.length} record(s)</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm text-slate-600">Total Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-400">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm text-slate-600">Total Due</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-500">${totalPending.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Payments table */}
        <Card>
          <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold text-slate-600">Student</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Amount</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Due Date</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Status</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Penalty</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Total Due</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Paid At</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-medium">{getStudentName(p)}</td>
                      <td className="p-4">${p.amount.toFixed(2)}</td>
                      <td className="p-4 text-slate-500">
                        {new Date(p.dueDate).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[p.status] || 'bg-gray-100 text-gray-700'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {p.status === 'OVERDUE' && p.penalty ? (
                          <span className="text-red-600 font-medium">+${p.penalty.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-4 font-semibold">
                        ${(p.totalDue ?? p.amount).toFixed(2)}
                      </td>
                      <td className="p-4 text-slate-500">
                        {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-4">
                        {p.status === 'PAID' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1"
                            onClick={() => handleGetReceipt(p.id)}
                          >
                            <Receipt className="h-3 w-3" /> Receipt
                          </Button>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">No payments found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" /> Payment Receipt
            </DialogTitle>
          </DialogHeader>
          {receiptLoading ? (
            <p className="py-6 text-center text-slate-500">Loading receipt…</p>
          ) : receipt ? (
            <div className="space-y-4 py-2">
              <div className="bg-slate-50 rounded-lg p-4 space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Receipt No.</span>
                  <span className="font-semibold">{receipt.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Student</span>
                  <span className="font-medium">{receipt.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount Paid</span>
                  <span className="font-semibold text-green-600">${receipt.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date Paid</span>
                  <span>{new Date(receipt.paidAt).toLocaleString()}</span>
                </div>
                {receipt.paymentMethod && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Method</span>
                    <span>{receipt.paymentMethod}</span>
                  </div>
                )}
              </div>
              <Button className="w-full" variant="outline" onClick={() => setShowReceiptDialog(false)}>
                Close
              </Button>
            </div>
          ) : (
            <p className="py-6 text-center text-red-500">Could not load receipt. Please try again.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
