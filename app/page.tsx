"use client";

import { Download, HardDrive, Play, Zap, Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#0f1b3d_0%,#050a1e_45%,#020611_100%)]">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-gradient-to-br from-cyan-400 to-blue-600" />
              <span className="text-xl font-bold text-white">Xyro</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden items-center gap-8 md:flex">
              <Link href="#features" className="text-sm text-slate-300 hover:text-white">
                Features
              </Link>
              <Link href="#" className="text-sm text-slate-300 hover:text-white">
                Pricing
              </Link>
              <Link href="#" className="text-sm text-slate-300 hover:text-white">
                Extension
              </Link>
              <Link href="#" className="text-sm text-slate-300 hover:text-white">
                Support
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/launch"
                className="hidden rounded-lg bg-gradient-to-r from-cyan-400 to-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:shadow-lg hover:shadow-cyan-500/50 md:inline-block"
              >
                Launch App
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-slate-300 hover:text-white"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="mt-4 flex flex-col gap-4 border-t border-slate-700 pt-4 md:hidden">
              <Link href="#features" className="text-sm text-slate-300 hover:text-white">
                Features
              </Link>
              <Link href="#" className="text-sm text-slate-300 hover:text-white">
                Pricing
              </Link>
              <Link href="#" className="text-sm text-slate-300 hover:text-white">
                Extension
              </Link>
              <Link href="#" className="text-sm text-slate-300 hover:text-white">
                Support
              </Link>
            </div>
          )}
        </div>
      </nav>
      {/* Hero Section */}
      <section className="w-full px-4 py-12 md:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center text-center">
            {/* Version Badge */}
            <div className="mb-6 inline-block rounded-full border border-slate-700 bg-slate-900/50 px-4 py-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                ✨ New Version 2.0 Live
              </p>
            </div>

            <h1 className="text-5xl font-bold tracking-tighter text-white md:text-6xl lg:text-7xl">
              Capture Your Screen <span className="text-cyan-400">Instantly</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base text-slate-400 md:text-lg">
              No downloads, no lag. Professional screen recording directly in your browser
              <br className="hidden md:block" />
              with high-fidelity output and instant cloud sharing.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/record"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-gradient-to-r from-cyan-400 to-cyan-500 px-6 font-semibold text-slate-900 shadow-lg shadow-cyan-500/50 transition-all hover:shadow-xl active:scale-95"
              >
                <Play className="mr-2 h-5 w-5" aria-hidden="true" />
                Start Recording Now
              </Link>
              <button className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-600 bg-slate-900/50 px-6 font-semibold text-slate-100 transition-colors hover:bg-slate-900/80">
                See How It Works
              </button>
            </div>

            {/* Demo Screenshot */}
            <div className="mt-16 w-full max-w-4xl">
              <div className="relative rounded-2xl border border-slate-700/50 bg-gradient-to-b from-slate-800/30 to-slate-900/30 p-2 backdrop-blur-sm">
                {/* Browser Header */}
                <div className="flex items-center gap-2 rounded-t-lg bg-slate-900/80 px-4 py-3">
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  <div className="mx-auto text-xs text-slate-400">xyro.com/recorder</div>
                </div>

                {/* Demo Content */}
                <div className="overflow-hidden rounded-b-lg bg-gradient-to-b from-slate-700 via-slate-700/80 to-slate-800">
                  <div className="aspect-video bg-gradient-to-br from-purple-900/40 via-slate-800 to-slate-900 flex items-center justify-center">
                    <div className="relative h-full w-full">
                      {/* Mockup recorder interface */}
                      <div className="flex h-full flex-col items-center justify-center gap-8 p-8">
                        <div className="text-center">
                          <div className="text-sm text-slate-400 mb-4">Application</div>
                          <div className="text-lg font-semibold text-slate-300">Open Application</div>
                          <div className="mt-2 text-xs text-slate-500">Open New</div>
                        </div>

                        {/* Layout Grid Mockup */}
                        <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                          <div className="rounded border border-slate-600/50 bg-slate-800/30 p-4">
                            <div className="h-4 w-12 rounded bg-slate-700 mb-2" />
                            <div className="space-y-2">
                              <div className="h-3 w-full rounded bg-slate-700/60" />
                              <div className="h-3 w-3/4 rounded bg-slate-700/60" />
                            </div>
                          </div>
                          <div className="rounded border border-slate-600/50 bg-slate-800/30 p-4">
                            <div className="h-4 w-12 rounded bg-slate-700 mb-2" />
                            <div className="space-y-2">
                              <div className="h-3 w-full rounded bg-slate-700/60" />
                              <div className="h-3 w-3/4 rounded bg-slate-700/60" />
                            </div>
                          </div>
                        </div>

                        {/* Control Bar */}
                        <div className="mt-6 flex items-center gap-2 rounded-full border border-slate-600/50 bg-slate-900/50 px-4 py-2">
                          <div className="h-3 w-3 rounded-full bg-red-500" />
                          <span className="text-xs text-slate-400">00:18</span>
                          <div className="flex gap-1">
                            {[...Array(4)].map((_, i) => (
                              <div key={i} className="h-1 w-6 rounded-full bg-slate-600/50" />
                            ))}
                          </div>
                          <div className="h-6 w-6 rounded bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs">▶</div>
                          <div className="h-6 w-6 rounded bg-red-500/20 flex items-center justify-center text-red-400">◼</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full px-4 py-16 md:py-24">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-4xl font-bold text-white">
            Precision Built for Creators
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-400">
            Everything you need to capture, edit, and share high-fidelity screen recordings without leaving your browser.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Feature 1 */}
            <div className="group rounded-xl border border-slate-700/50 bg-slate-900/30 p-8 backdrop-blur-sm transition-all hover:border-slate-600/80 hover:bg-slate-900/50">
              <div className="mb-6 inline-block rounded-lg bg-cyan-500/10 p-3">
                <Zap className="h-6 w-6 text-cyan-400" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-white text-xl">Zero Installation</h3>
              <p className="mt-3 text-slate-400">
                Start recording in one click without any downloads. Our browser-native engine handles everything from video encoding to cloud syncing instantly.
              </p>
              <div className="mt-6 flex gap-3">
                <div className="h-12 w-12 rounded-lg bg-slate-700/30" />
                <div className="h-12 w-12 rounded-lg bg-slate-700/30" />
                <div className="h-12 w-12 rounded-lg bg-slate-700/30" />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-xl border border-slate-700/50 bg-slate-900/30 p-8 backdrop-blur-sm transition-all hover:border-slate-600/80 hover:bg-slate-900/50">
              <div className="mb-6 inline-block rounded-lg bg-cyan-500/10 p-3">
                <Play className="h-6 w-6 text-cyan-400" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-white text-xl">HD Quality</h3>
              <p className="mt-3 text-slate-400">
                Crystal clear recording for tutorials, demos, and professional presentations. Support for 4K 60FPS output.
              </p>
              <div className="mt-6 flex items-center justify-between">
                <div className="h-1 flex-1 rounded-full bg-gradient-to-r from-cyan-500 to-transparent" />
                <span className="ml-2 text-xs text-slate-500">60 ms.60 mins</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-xl border border-slate-700/50 bg-slate-900/30 p-8 backdrop-blur-sm transition-all hover:border-slate-600/80 hover:bg-slate-900/50">
              <div className="mb-6 inline-block rounded-lg bg-cyan-500/10 p-3">
                <HardDrive className="h-6 w-6 text-cyan-400" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-white text-xl">Cloud Storage</h3>
              <p className="mt-3 text-slate-400">
                Automatically save and share your recordings instantly with secure link-based distribution.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group rounded-xl border border-slate-700/50 bg-slate-900/30 p-8 backdrop-blur-sm transition-all hover:border-slate-600/80 hover:bg-slate-900/50">
              <div className="mb-6 inline-block rounded-lg bg-cyan-500/10 p-3">
                <Download className="h-6 w-6 text-cyan-400" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-white text-xl">Browser Extension</h3>
              <p className="mt-3 text-slate-400">
                Access Xyro anytime from your browser toolbar. Record specific tabs, custom regions, or your entire desktop.
              </p>
              <div className="mt-6 flex justify-end">
                <div className="inline-block rounded-lg bg-cyan-500 px-3 py-1 text-xs font-semibold text-slate-900">X</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="w-full px-4 py-16 md:py-24">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-4xl font-bold text-white">
            Trusted by 50,000+ Creators
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-400">
            Professional teams rely on Xyro for lightning-fast feedback and clear communication.
          </p>

          <div className="mt-12 flex items-center justify-between">
            <button className="rounded-full bg-slate-900/50 p-2 text-slate-400 hover:text-white">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 flex-1 mx-4">
              {/* Testimonial 1 */}
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-6 backdrop-blur-sm">
                <div className="mb-4 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-lg">★</span>
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  "Xyro changed how I share feedback with my team. No more huge MP4 files or upload wait times. It's just magic."
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-red-600" />
                  <div>
                    <p className="font-semibold text-white text-sm">Sarah Jenkins</p>
                    <p className="text-xs text-slate-500">Design Lead @ Framer</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-6 backdrop-blur-sm">
                <div className="mb-4 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-lg">★</span>
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  "The cleanest UI I've ever used for screen recording. It stays out of the way until you need it. Pure technical brilliance."
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600" />
                  <div>
                    <p className="font-semibold text-white text-sm">Marcus Thorne</p>
                    <p className="text-xs text-slate-500">Senior Engineer @ Vercel</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-6 backdrop-blur-sm">
                <div className="mb-4 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-lg">★</span>
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  "Zero lag even when recording intensive web apps. The HD quality is consistent and the cloud sharing is instantaneous."
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-400 to-red-600" />
                  <div>
                    <p className="font-semibold text-white text-sm">Elena Rodriguez</p>
                    <p className="text-xs text-slate-500">Product Manager @ Stripe</p>
                  </div>
                </div>
              </div>
            </div>

            <button className="rounded-full bg-slate-900/50 p-2 text-slate-400 hover:text-white">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50 px-4 py-12 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-gradient-to-br from-cyan-400 to-blue-600" />
                <span className="font-bold text-white">Xyro</span>
              </div>
              <p className="mt-4 text-xs text-slate-500">© 2024 Xyro. Effortless efficiency for creators.</p>
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Product</p>
              <ul className="mt-3 space-y-2">
                <li><Link href="#" className="text-xs text-slate-400 hover:text-white">Features</Link></li>
                <li><Link href="#" className="text-xs text-slate-400 hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Resources</p>
              <ul className="mt-3 space-y-2">
                <li><Link href="#" className="text-xs text-slate-400 hover:text-white">Extension</Link></li>
                <li><Link href="#" className="text-xs text-slate-400 hover:text-white">Help Center</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Legal</p>
              <ul className="mt-3 space-y-2">
                <li><Link href="#" className="text-xs text-slate-400 hover:text-white">Privacy Policy</Link></li>
                <li><Link href="#" className="text-xs text-slate-400 hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Status</p>
              <ul className="mt-3 space-y-2">
                <li><Link href="#" className="text-xs text-slate-400 hover:text-white">Status Page</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
