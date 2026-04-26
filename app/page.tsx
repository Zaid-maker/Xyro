"use client";

import { Clock3, Link2, Target, Video, Zap } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#0f1b3d_0%,#050a1e_45%,#020611_100%)] px-4 py-14 md:px-6 md:py-20">
      <main className="mx-auto flex w-full max-w-6xl flex-col items-center gap-14 text-center md:gap-16">
        {/* Logo/Brand */}
        <div className="space-y-3">
          <h1 className="text-5xl font-bold tracking-tight text-white md:text-6xl">
            Xyro
          </h1>
          <p className="text-xl text-slate-300 md:text-2xl md:font-medium">
            Share your screen in seconds
          </p>
        </div>

        {/* Main CTA */}
        <div className="space-y-7">
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-300 md:text-2xl md:leading-snug">
            Record your screen or camera, and get an instant shareable link. No sign-up required.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/record"
              className="inline-flex h-14 min-w-58 items-center justify-center rounded-xl bg-linear-to-r from-fuchsia-600 to-violet-600 px-8 font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
            >
              <Video className="mr-2 h-5 w-5" aria-hidden="true" />
              Start Recording
            </Link>
            <Link
              href="/recordings"
              className="inline-flex h-14 min-w-58 items-center justify-center rounded-xl border border-slate-600/70 bg-slate-900/50 px-8 font-semibold text-slate-100 transition-colors hover:bg-slate-800/70"
            >
              <Clock3 className="mr-2 h-5 w-5" aria-hidden="true" />
              Recent Recordings
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid w-full max-w-5xl grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/65 p-6 text-center shadow-[0_16px_40px_rgba(2,8,23,0.35)] backdrop-blur-sm md:p-7">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-fuchsia-500/12 ring-1 ring-fuchsia-400/30">
              <Zap className="h-6 w-6 text-fuchsia-400" aria-hidden="true" />
            </div>
            <h3 className="text-2xl font-semibold text-white">Instant Links</h3>
            <p className="mt-2 text-base leading-relaxed text-slate-300 md:text-lg">
              Get a shareable link immediately after recording
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/65 p-6 text-center shadow-[0_16px_40px_rgba(2,8,23,0.35)] backdrop-blur-sm md:p-7">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/12 ring-1 ring-sky-400/30">
              <Target className="h-6 w-6 text-sky-400" aria-hidden="true" />
            </div>
            <h3 className="text-2xl font-semibold text-white">Simple</h3>
            <p className="mt-2 text-base leading-relaxed text-slate-300 md:text-lg">
              Record screen or camera with just one click
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/65 p-6 text-center shadow-[0_16px_40px_rgba(2,8,23,0.35)] backdrop-blur-sm md:p-7">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/12 ring-1 ring-emerald-400/30">
              <Link2 className="h-6 w-6 text-emerald-400" aria-hidden="true" />
            </div>
            <h3 className="text-2xl font-semibold text-white">Shareable</h3>
            <p className="mt-2 text-base leading-relaxed text-slate-300 md:text-lg">
              Share with anyone using a simple link
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
