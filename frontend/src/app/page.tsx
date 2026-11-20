'use client';

import Link from 'next/link';
import { BookOpen, Users, ShieldCheck, ChevronRight, Menu } from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* --- NAVBAR --- */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-900 tracking-tight">ISCMS</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-slate-900 font-medium hover:text-blue-600 transition">Home</Link>
              <Link href="/about" className="text-slate-600 hover:text-blue-600 transition">About</Link>
              <Link href="/services" className="text-slate-600 hover:text-blue-600 transition">Services</Link>
              <Link href="/contact" className="text-slate-600 hover:text-blue-600 transition">Contact</Link>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/login" className="text-blue-600 font-medium hover:text-blue-700 transition">
                Login
              </Link>
              <Link href="/register" className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm">
                Sign Up
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600 hover:text-blue-600">
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-4 pt-2 pb-4 space-y-2">
            <Link href="/" className="block px-3 py-2 rounded-md text-base font-medium text-slate-900 hover:bg-slate-50">Home</Link>
            <Link href="/about" className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50">About</Link>
            <Link href="/services" className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50">Services</Link>
            <Link href="/contact" className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50">Contact</Link>
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
              <Link href="/login" className="block text-center px-3 py-2 rounded-md text-base font-medium text-blue-600 border border-blue-600">Login</Link>
              <Link href="/register" className="block text-center px-3 py-2 rounded-md text-base font-medium bg-blue-600 text-white">Sign Up</Link>
            </div>
          </div>
        )}
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative bg-white pt-20 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-6">
                Integrated School <br />
                <span className="text-blue-600">Community Management</span> System
              </h1>
              <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto lg:mx-0">
                A unified digital platform automating student enrollment, attendance tracking, academic performance, and parent-teacher communication. Replacing manual methods with a faster, accurate, and scalable solution.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/register" className="flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-xl">
                  Get Started Now <ChevronRight className="h-5 w-5" />
                </Link>
                <Link href="/login" className="flex items-center justify-center bg-white text-slate-700 border-2 border-slate-200 px-8 py-3.5 rounded-lg font-semibold hover:border-slate-300 hover:bg-slate-50 transition">
                  Portal Login
                </Link>
              </div>
            </div>

            {/* Hero Image / Illustration (Simple graphic) */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-blue-100 rounded-3xl transform rotate-3"></div>
              <div className="relative bg-white border border-slate-100 shadow-xl rounded-3xl p-8">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <Users className="h-8 w-8 text-blue-600 mb-2" />
                      <h3 className="font-bold text-slate-900">Student Portal</h3>
                      <p className="text-sm text-slate-500 mt-1">Track grades & attendance</p>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 mt-8">
                      <ShieldCheck className="h-8 w-8 text-emerald-600 mb-2" />
                      <h3 className="font-bold text-slate-900">Admin Control</h3>
                      <p className="text-sm text-slate-500 mt-1">Manage fees & reports</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 col-span-2">
                      <BookOpen className="h-8 w-8 text-amber-600 mb-2" />
                      <h3 className="font-bold text-slate-900">Learning Hub</h3>
                      <p className="text-sm text-slate-500 mt-1">Access 24/7 resources & notes</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- KEY FEATURES --- */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Choose ISCMS?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Everything you need to manage your educational institution efficiently.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
              <div className="bg-blue-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <Users className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Automated Attendance</h3>
              <p className="text-slate-600 leading-relaxed">Track student attendance digitally. Generate real-time reports and identify absenteeism patterns instantly.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
              <div className="bg-emerald-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Secure Fee Management</h3>
              <p className="text-slate-600 leading-relaxed">Parents can view payment history, receive digital receipts, and get automated reminders for pending fees.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
              <div className="bg-amber-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <BookOpen className="h-7 w-7 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">24/7 Learning Hub</h3>
              <p className="text-slate-600 leading-relaxed">Students can access lesson notes, e-books, and recorded video lessons anytime, anywhere.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-6 w-6 text-blue-500" />
                <span className="font-bold text-xl text-white">ISCMS</span>
              </div>
              <p className="text-sm text-slate-400">Integrated School Community Management System for Wachemo Community Excellency School.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="hover:text-white transition">Home</Link></li>
                <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
                <li><Link href="/services" className="hover:text-white transition">Services</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Portals</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="hover:text-white transition">Student Login</Link></li>
                <li><Link href="/login" className="hover:text-white transition">Teacher Login</Link></li>
                <li><Link href="/login" className="hover:text-white transition">Parent Login</Link></li>
                <li><Link href="/login" className="hover:text-white transition">Admin Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact Info</h4>
              <ul className="space-y-2 text-sm">
                <li>Hossana, Ethiopia</li>
                <li>Wachemo University</li>
                <li>info@iscms.edu.et</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8 text-sm text-center text-slate-500">
            © 2026 ISCMS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}