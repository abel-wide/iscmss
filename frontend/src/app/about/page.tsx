'use client';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100 mt-10">
        <Link href="/" className="text-blue-600 hover:underline mb-6 inline-block">&larr; Back to Home</Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-6">About ISCMS</h1>
        <p className="text-slate-600 leading-relaxed mb-4">
          The Integrated School Community Management System (ISCMS) is a unified digital platform with web and Android interfaces that automates student enrollment, attendance tracking, academic performance, timetabling, fee management, and parent-teacher communication.
        </p>
        <p className="text-slate-600 leading-relaxed mb-4">
          Developed for Wachemo Community Excellency School, it replaces error-prone paper-based methods with a faster, more accurate, cost-effective, and scalable solution. We aim to reduce administrative workload, improve data reliability, enhance transparency, and support data-driven decision-making.
        </p>
        <div className="bg-blue-50 p-6 rounded-xl mt-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-2">Our Mission</h2>
          <p className="text-blue-800">To empower educational institutions with modern technology that connects teachers, parents, and students seamlessly.</p>
        </div>
      </div>
    </div>
  );
}