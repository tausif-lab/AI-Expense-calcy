'use client';

import React from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  BarChart3, 
  Zap, 
  ShieldCheck, 
  PieChart, 
  TrendingDown, 
  Mail,
  AlertCircle
} from 'lucide-react';
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Navigation */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <PieChart className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">Credex Audit</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#problem" className="hover:text-gray-900 transition-colors">The Problem</a>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How it Works</a>
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
          </div>
          <div>
            <Link href="/audit">
            <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2">
              Check My AI Spend
            </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-50/50 via-white to-white -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Product Hunt Launch Ready
              </div>
              <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.1] mb-6">
                Stop overpaying for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-700">AI subscriptions.</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Most startups waste thousands annually on unused ChatGPT, Claude, and Copilot seats. Credex Audit analyzes your stack, finds the bloat, and tells you exactly what to cut.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link href="/audit">
                <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-full text-base font-semibold transition-all shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 flex items-center justify-center gap-2 h-14">
                  Check My AI Spend
                  <ArrowRight className="w-5 h-5" />
                </button>
                </Link>
                
                <button className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-8 py-4 rounded-full text-base font-semibold transition-all flex items-center justify-center h-14">
                  View Sample Audit
                </button>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center overflow-hidden`}>
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}&backgroundColor=e2e8f0`} alt="Avatar" />
                    </div>
                  ))}
                </div>
                <p>Trusted by <span className="font-semibold text-gray-900">500+</span> founders & engineering teams</p>
              </div>
            </div>

            {/* Hero Right: Mock Audit Card */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent blur-3xl rounded-full" />
              <div className="relative bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden p-8">
                <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Current Monthly Spend</p>
                    <p className="text-3xl font-bold text-gray-900">$1,450.00</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 text-right">
                    <p className="text-sm text-emerald-700 font-medium mb-1">Potential Savings</p>
                    <p className="text-2xl font-bold text-emerald-600">-$420.00</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Recommended Changes</p>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-emerald-100 hover:bg-emerald-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="font-bold text-gray-700 text-xs">GPT</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">ChatGPT Plus</p>
                        <p className="text-xs text-gray-500">4 inactive seats found</p>
                      </div>
                    </div>
                    <span className="text-emerald-600 font-semibold">Save $80/mo</span>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-emerald-100 hover:bg-emerald-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <span className="font-bold text-blue-600 text-xs">CP</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">GitHub Copilot</p>
                        <p className="text-xs text-gray-500">Downgrade to Individual</p>
                      </div>
                    </div>
                    <span className="text-emerald-600 font-semibold">Save $190/mo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section id="problem" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">The Great AI SaaS Sprawl</h2>
            <p className="text-lg text-gray-600">Teams are buying overlapping AI tools without oversight. What starts as a $20 subscription quickly scales into a massive blind spot.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
              <AlertCircle className="w-8 h-8 text-red-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Overlapping Tools</h3>
              <p className="text-gray-600">Paying for ChatGPT Plus, Claude Pro, and Gemini Advanced for the same employees.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
              <AlertCircle className="w-8 h-8 text-orange-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Zombie Seats</h3>
              <p className="text-gray-600">Enterprise plans requiring 50+ seats where only 12 engineers are actually utilizing Cursor or Copilot.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
              <AlertCircle className="w-8 h-8 text-yellow-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Pricing Confusion</h3>
              <p className="text-gray-600">Failing to optimize between usage-based API billing and flat-rate monthly subscriptions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-lg text-gray-600 max-w-2xl">Get full visibility into your AI spend in three simple steps. No complex integrations required.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gray-100" />
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white border border-gray-200 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <span className="text-2xl font-bold text-gray-900">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Input your tools</h3>
              <p className="text-gray-600">Securely list your current AI subscriptions, seat counts, and monthly API spend.</p>
            </div>

            <div className="relative z-10">
              <div className="w-16 h-16 bg-white border border-gray-200 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <span className="text-2xl font-bold text-gray-900">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Instant Analysis</h3>
              <p className="text-gray-600">Our engine cross-references your stack with active pricing tiers and usage benchmarks.</p>
            </div>

            <div className="relative z-10">
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-md shadow-emerald-500/20">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Optimize & Save</h3>
              <p className="text-gray-600">Get an actionable, shareable report with exact steps to downgrade, consolidate, or cancel.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SAMPLE RESULTS SECTION */}
      <section className="py-24 bg-gray-900 text-white rounded-[3rem] mx-4 sm:mx-6 lg:mx-8 mb-24 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Board-ready reporting.</h2>
              <p className="text-xl text-gray-400 mb-8">
                Generate crisp, highly-shareable audits that you can drop straight into Slack or your next finance meeting.
              </p>
              <ul className="space-y-5">
                {[
                  'Annualized savings projections',
                  'Plan downgrade recommendations',
                  'Alternative tool suggestions',
                  'One-click PDF exports'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                    <span className="text-gray-300 text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Dark Mode Dashboard Mockup */}
            <div className="bg-[#111] border border-gray-800 rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-lg font-semibold text-gray-200">Credex Summary</h4>
                <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Audit Complete</span>
              </div>
              
              <div className="mb-8 p-6 bg-gray-800/50 rounded-xl border border-gray-700/50">
                <div className="flex items-end gap-4 mb-2">
                  <span className="text-5xl font-bold text-white">$12,400</span>
                  <span className="text-gray-400 pb-1">/ year wasted</span>
                </div>
                <p className="text-sm text-gray-400">By consolidating Claude and ChatGPT to a centralized API wrapper, you can reduce SaaS overhead by 42%.</p>
              </div>

              <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
                Email Full Report to Finance
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Ready to stop burning cash?</h2>
          <p className="text-xl text-gray-600 mb-10">Join hundreds of startups running leaner AI stacks. It takes 2 minutes to find out how much you can save.</p>
          <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-5 rounded-full text-lg font-bold transition-all shadow-xl shadow-emerald-500/20 hover:shadow-2xl hover:-translate-y-1 inline-flex items-center gap-2">
            Start Your Free AI Spend Audit
            <ArrowRight className="w-6 h-6" />
          </button>
          <p className="mt-6 text-sm text-gray-500 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            No credit card required. 100% free audit.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-500" />
            <span className="font-bold text-lg text-gray-900">Credex</span>
          </div>
          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} Credex Audit. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-gray-900">Twitter</a>
            <a href="#" className="hover:text-gray-900">Terms</a>
            <a href="#" className="hover:text-gray-900">Privacy</a>
          </div>
        </div>
      </footer>
      
    </div>
  );
}