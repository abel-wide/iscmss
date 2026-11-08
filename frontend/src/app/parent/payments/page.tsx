/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Payment {
  id: string;
  amount: number;
  status: string;
  dueDate: string;
  receiptNo?: string;
}

const generateTransactionId = () => `TX-${Date.now()}`;

export default function ParentPaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    try {
      const storedChild = localStorage.getItem('parentChild');
      if (storedChild) {
        const child = JSON.parse(storedChild);
        const res = await api.get(`/payments?studentId=${child.id}`);
        setPayments(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchPayments();
  }, [router, fetchPayments]);

  const handlePay = async (paymentId: string) => {
    try {
      const transactionId = generateTransactionId();
      await api.post(`/payments/${paymentId}/pay`, { transactionId });
      alert('Payment successful!');
      fetchPayments();
    } catch (error) {
      console.error(error); // <-- 'err' ን በ 'error' ተክተነዋል
      alert('Payment failed');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-3xl mx-auto">
        <Button variant="outline" onClick={() => router.push('/parent')}>← Back</Button>
        <h1 className="text-2xl font-bold my-4">Payments</h1>

        <Card>
          <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {payments.map((p) => (
                <div key={p.id} className="flex justify-between items-center p-3 border rounded bg-white">
                  <div>
                    <p className="font-semibold">Amount: ${p.amount}</p>
                    <p className="text-sm text-slate-500">
                      Due: {new Date(p.dueDate).toLocaleDateString()} • Status: {p.status}
                    </p>
                  </div>
                  {p.status === 'PENDING' ? (
                    <Button size="sm" onClick={() => handlePay(p.id)}>Pay Now</Button>
                  ) : (
                    <p className="text-sm text-green-600 font-medium">Paid (Receipt: {p.receiptNo})</p>
                  )}
                </div>
              ))}
              {payments.length === 0 && <p className="text-slate-500">No payments found.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}