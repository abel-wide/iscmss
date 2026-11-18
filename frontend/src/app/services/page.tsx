'use client';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export default function ServicesPage() {
  const services = [
    "User Account Management & Role-Based Access Control",
    "Student Registration and Enrollment",
    "Digital Attendance Management & Reports",
    "Grade Management & Automated Report Cards",
    "Instant Parent Notifications (SMS/App)",
    "24/7 Learning Hub for Digital Resources",
    "Online Fee Payment System",
    "Direct Parent-Teacher Chat/Communication"
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100 mt-10">
        <Link href="/" className="text-blue-600 hover:underline mb-6 inline-block">&larr; Back to Home</Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Our Services</h1>
        <p className="text-slate-600 mb-8">ISCMS provides a comprehensive suite of features designed to automate and streamline school operations.</p>
        
        <div className="grid md:grid-cols-2 gap-4">
          {services.map((service, index) => (
            <div key={index} className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span className="text-slate-700">{service}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}