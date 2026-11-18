'use client';
import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100 mt-10">
        <Link href="/" className="text-blue-600 hover:underline mb-6 inline-block">&larr; Back to Home</Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Contact Us</h1>
        <p className="text-slate-600 mb-8">Have a question or need support? Reach out to our team.</p>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full text-blue-600"><MapPin className="h-6 w-6" /></div>
              <div>
                <h3 className="font-semibold text-slate-900">Location</h3>
                <p className="text-slate-600">Wachemo University, Hossana, Ethiopia</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full text-blue-600"><Mail className="h-6 w-6" /></div>
              <div>
                <h3 className="font-semibold text-slate-900">Email</h3>
                <p className="text-slate-600">support@iscms.edu.et</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full text-blue-600"><Phone className="h-6 w-6" /></div>
              <div>
                <h3 className="font-semibold text-slate-900">Phone</h3>
                <p className="text-slate-600">+251 91 234 5678</p>
              </div>
            </div>
          </div>
          
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input type="text" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
              <textarea className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24" placeholder="How can we help?"></textarea>
            </div>
            <button type="button" className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition">Send Message</button>
          </form>
        </div>
      </div>
    </div>
  );
}