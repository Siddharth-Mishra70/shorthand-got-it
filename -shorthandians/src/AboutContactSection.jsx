import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import {
  MapPin,
  Phone,
  Mail,
  User,
  MessageSquare,
  Send,
  Award,
  Target,
  Users,
  BookOpen,
  CheckCircle,
  ExternalLink,
  PhoneCall,
  Loader2,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// About Section
// ─────────────────────────────────────────────────────────────────────────────
const AboutSection = () => {
  const achievements = [
    { icon: Users, value: '5,000+', label: 'Students Trained' },
    { icon: Award, value: '95%', label: 'Selection Rate' },
    { icon: BookOpen, value: '50+', label: 'Practice Tests' },
    { icon: Target, value: '10+', label: 'Years of Excellence' },
  ];

  const qualities = [
    'Expert-curated dictation content for SSC & High Court exams',
    'Personalised feedback and result analysis after every test',
    'Pitman shorthand module with visual stroke guidance',
    'High Court transcript formatting tools built-in',
    'Flexible audio speed from 0.7× to 1.2× for every level',
    'Dedicated WhatsApp support by the director himself',
  ];

  return (
    <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Label */}
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold tracking-widest text-[#1e3a8a] uppercase bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full mb-4">
            Who We Are
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
            About{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1e3a8a] to-blue-500">
              Shorthandians
            </span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            A premier institute dedicated to transforming shorthand aspirants into exam-ready professionals.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
          {/* Left: Director Card */}
          <div className="relative">
            {/* Background decoration */}
            <div className="absolute -inset-4 bg-gradient-to-br from-[#1e3a8a]/8 to-blue-100/60 rounded-3xl -z-10"></div>

            <div className="bg-white rounded-3xl shadow-xl border border-blue-50 overflow-hidden">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-[#0f2167] to-[#1e3a8a] px-8 py-10 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                <div className="relative z-10">
                  {/* Avatar */}
                  <div className="w-20 h-20 rounded-2xl bg-amber-400 flex items-center justify-center mb-5 shadow-lg shadow-amber-400/30">
                    <span className="text-3xl font-black text-blue-900">AP</span>
                  </div>
                  <h3 className="text-2xl font-black mb-1">Ayush Pandey</h3>
                  <p className="text-blue-200 font-semibold text-sm">Director, Shorthandians</p>
                </div>
              </div>

              {/* Card Body */}
              <div className="px-8 py-7">
                <p className="text-gray-600 leading-relaxed mb-6">
                  Ayush Pandey is a seasoned shorthand educator with over a decade of experience
                  training students for SSC Stenographer (Grade C & D) and High Court exams.
                  His student-first approach, combined with structured practice materials and
                  real-time digital tools, has set Shorthandians apart as Prayagraj's most trusted
                  steno coaching platform.
                </p>

                <div className="space-y-3">
                  {qualities.slice(0, 3).map((q, i) => (
                    <div key={i} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-[#1e3a8a] flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600 text-sm">{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Story + Qualities */}
          <div>
            <h3 className="text-2xl font-black text-gray-900 mb-4">
              Our Mission
            </h3>
            <p className="text-gray-500 leading-relaxed mb-6">
              Shorthandians was founded with a singular vision — to bridge the gap between
              traditional shorthand coaching and modern digital practice tools. We make
              quality steno education accessible to every aspirant, regardless of location.
            </p>
            <p className="text-gray-500 leading-relaxed mb-8">
              From Prayagraj's 98/25/33 LIC Colony, we've grown into a fully digital platform
              used by thousands of students preparing for SSC, Patna High Court, Allahabad High
              Court, and other prestigious examinations across India.
            </p>

            <div className="space-y-3 mb-8">
              {qualities.slice(3).map((q, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-[#1e3a8a] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 text-sm">{q}</span>
                </div>
              ))}
            </div>

            {/* Achievement Stats */}
            <div className="grid grid-cols-2 gap-4">
              {achievements.map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="flex items-center space-x-4 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 hover:bg-blue-100/60 transition-colors duration-200"
                >
                  <div className="w-10 h-10 bg-[#1e3a8a] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-[#1e3a8a]">{value}</div>
                    <div className="text-xs text-gray-500 font-medium">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Contact Section
// ─────────────────────────────────────────────────────────────────────────────
const ContactSection = () => {
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.message) return;
    
    setLoading(true);
    
    try {
      if (supabase && !supabase.supabaseUrl?.includes('placeholder')) {
        const { error } = await supabase
          .from('contact_inquiries')
          .insert([
            {
              full_name: form.name,
              phone_number: form.phone,
              message: form.message,
              created_at: new Date().toISOString(),
            },
          ]);

        if (error) throw error;
      } else {
        // Fallback to localStorage if Supabase is not configured yet
        const existing = JSON.parse(localStorage.getItem('contact_inquiries') || '[]');
        const newInquiry = {
          id: Date.now(),
          full_name: form.name,
          phone_number: form.phone,
          message: form.message,
          created_at: new Date().toISOString(),
        };
        localStorage.setItem('contact_inquiries', JSON.stringify([newInquiry, ...existing]));
      }
      
      setForm({ name: '', phone: '', message: '' });
      setSubmitted(true);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again or contact via WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: MapPin,
      label: 'Address',
      value: '98/25/33 LIC Colony, Tagore Town, Prayagraj',
      href: 'https://maps.google.com/?q=Tagore+Town+Prayagraj',
      color: 'bg-blue-50 text-[#1e3a8a]',
    },
    {
      icon: PhoneCall,
      label: 'Phone',
      value: '+91 70808 11235',
      href: 'tel:+917080811235',
      color: 'bg-green-50 text-green-700',
    },
    {
      icon: Mail,
      label: 'Email',
      value: 'ayushpandey3666@gmail.com',
      href: 'mailto:ayushpandey3666@gmail.com',
      color: 'bg-amber-50 text-amber-700',
    },
  ];

  return (
    <section id="contact" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold tracking-widest text-[#1e3a8a] uppercase bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full mb-4">
            Reach Out
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
            Get in{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1e3a8a] to-blue-500">
              Touch
            </span>
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
            Have questions about courses or admissions? We're just a message away.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left: Contact Info + Map */}
          <div className="flex flex-col gap-6">
            {/* Contact Info Cards */}
            {contactInfo.map(({ icon: Icon, label, value, href, color }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center space-x-5 bg-white border border-gray-100 hover:border-blue-200 rounded-2xl px-6 py-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
                  <p className="font-bold text-gray-800 text-sm sm:text-base truncate">{value}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-[#1e3a8a] transition-colors flex-shrink-0" />
              </a>
            ))}

            {/* Google Maps Iframe */}
            <div className="rounded-2xl overflow-hidden shadow-md border border-gray-100 flex-1 min-h-[260px]">
              <div className="relative w-full h-full min-h-[260px] bg-blue-50">
                <iframe
                  title="Shorthandians Location — Tagore Town, Prayagraj"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3603.7220048738283!2d81.84661!3d25.4656!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x399acb3e0cc8d11f%3A0x2f57b8de2fe6e4f!2sTagore%20Town%2C%20Prayagraj%2C%20Uttar%20Pradesh!5e0!3m2!1sen!2sin!4v1678886400000!5m2!1sen!2sin"
                  className="w-full h-full min-h-[260px] border-0"
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-[#0f2167] to-[#1e3a8a] px-8 py-8 text-white">
              <h3 className="text-2xl font-black mb-1">Send a Message</h3>
              <p className="text-blue-200 text-sm">
                We typically respond within a few hours.
              </p>
            </div>

            <div className="px-8 py-8">
              {submitted ? (
                /* Success State */
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-5 shadow-md">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <h4 className="text-xl font-black text-gray-900 mb-2">Message Sent!</h4>
                  <p className="text-gray-500 text-sm max-w-xs">
                    Thank you for reaching out. Ayush Pandey will get back to you shortly.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: '', phone: '', message: '' }); }}
                    className="mt-6 text-[#1e3a8a] font-bold text-sm hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                /* Form */
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name */}
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-bold text-gray-700 mb-1.5">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        required
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/30 focus:border-[#1e3a8a] transition-all duration-200 bg-gray-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="contact-phone" className="block text-sm font-bold text-gray-700 mb-1.5">
                      Phone Number <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        id="contact-phone"
                        name="phone"
                        type="tel"
                        required
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="+91 XXXXX XXXXX"
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/30 focus:border-[#1e3a8a] transition-all duration-200 bg-gray-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="contact-message" className="block text-sm font-bold text-gray-700 mb-1.5">
                      Message <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                      <textarea
                        id="contact-message"
                        name="message"
                        rows={5}
                        required
                        value={form.message}
                        onChange={handleChange}
                        placeholder="Tell us about your course interest, doubt, or feedback..."
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/30 focus:border-[#1e3a8a] transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    id="contact-submit-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-3 bg-[#1e3a8a] hover:bg-blue-700 disabled:bg-blue-300 text-white font-black py-4 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span>Sending…</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>

                  {/* WhatsApp Alternate */}
                  <p className="text-center text-xs text-gray-400 mt-2">
                    Or reach us instantly via{' '}
                    <a
                      href="https://wa.me/917080811235"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 font-bold hover:underline"
                    >
                      WhatsApp
                    </a>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────────────────────────
const Footer = () => (
  <footer className="bg-[#0f2167] text-white py-10 px-4 sm:px-6 lg:px-8">
    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 bg-amber-400 rounded-lg flex items-center justify-center font-black text-blue-900 text-lg">
          S
        </div>
        <span className="font-black text-xl tracking-tight">Shorthandians</span>
      </div>
      <p className="text-blue-300 text-sm text-center">
        © {new Date().getFullYear()} Shorthandians — by Ayush Pandey, Prayagraj. All rights reserved.
      </p>
      <div className="flex items-center space-x-5 text-sm font-semibold text-blue-300">
        <a href="#home" className="hover:text-white transition-colors">Home</a>
        <a href="#courses" className="hover:text-white transition-colors">Courses</a>
        <a href="#about" className="hover:text-white transition-colors">About</a>
        <a href="#contact" className="hover:text-white transition-colors">Contact</a>
      </div>
    </div>
  </footer>
);

// ─────────────────────────────────────────────────────────────────────────────
// Combined Export
// ─────────────────────────────────────────────────────────────────────────────
const AboutContactSection = () => (
  <>
    <AboutSection />
    <ContactSection />
    <Footer />
  </>
);

export default AboutContactSection;
