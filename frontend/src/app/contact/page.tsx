'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setForm({ name: '', email: '', subject: '', message: '' });
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-6 inline-flex items-center gap-1 font-medium text-sm">
          &larr; Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-2">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
            <h1 className="text-3xl font-bold">Contact Us</h1>
            <p className="text-blue-100 mt-2">
              Have a question or need technical support with ISCMS? We're here to assist administrators, teachers, parents, and students.
            </p>
          </div>

          <div className="p-8 grid md:grid-cols-2 gap-10">
            {/* Contact Details */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Get in Touch</h2>
                <p className="text-slate-600 text-sm">
                  Reach out directly through any of our channels or submit the form. Our support team responds within 24 hours.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Campus Location</h3>
                    <p className="text-slate-600 text-sm">Wachemo University Community Excellency School</p>
                    <p className="text-slate-500 text-xs mt-0.5">Hossana, Central Ethiopia</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Email Support</h3>
                    <p className="text-slate-600 text-sm">support@iscmss.edu.et</p>
                    <p className="text-slate-500 text-xs mt-0.5">info@iscmss.edu.et</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Phone Line</h3>
                    <p className="text-slate-600 text-sm">+251 91 123 4567</p>
                    <p className="text-slate-500 text-xs mt-0.5">Mon–Fri: 8:00 AM – 5:00 PM (EAT)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Send a Message</h2>

              {submitted ? (
                <div className="p-6 rounded-xl bg-green-50 border border-green-200 text-center space-y-3">
                  <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
                  <h3 className="text-lg font-semibold text-green-900">Message Received!</h3>
                  <p className="text-sm text-green-700">
                    Thank you for reaching out. The ISCMS school administration will get back to you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="contact-name">Full Name *</Label>
                    <Input
                      id="contact-name"
                      type="text"
                      placeholder="e.g. Abebe Kebede"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact-email">Email Address *</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact-subject">Subject</Label>
                    <Input
                      id="contact-subject"
                      type="text"
                      placeholder="e.g. Student Enrollment Inquiry"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact-message">Message *</Label>
                    <Textarea
                      id="contact-message"
                      placeholder="Write your question, feedback, or inquiry here..."
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      required
                      rows={4}
                      className="mt-1"
                    />
                  </div>

                  <Button type="submit" className="w-full gap-2">
                    <Send className="h-4 w-4" />
                    <span>Send Message</span>
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
