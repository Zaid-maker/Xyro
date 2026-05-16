"use client";

import { ArrowRight, Camera, Monitor, Rocket, ShieldCheck, Sparkles, Video } from "lucide-react";
import Link from "next/link";

const launchSteps = [
  {
    title: "Pick a source",
    description: "Choose screen or camera capture, then decide whether to record the full display or a single window.",
    icon: Monitor,
  },
  {
    title: "Tune quality",
    description: "Select the best recording profile for your connection and export needs before you start.",
    icon: Sparkles,
  },
  {
    title: "Share instantly",
    description: "Upload, generate a link, and hand off the recording without leaving the browser.",
    icon: ShieldCheck,
  },
];

const quickActions = [
  {
    title: "Start screen capture",
    description: "For demos, walkthroughs, and bug reports.",
    href: "/record",
    icon: Monitor,
  },
  {
    title: "Start camera capture",
    description: "For talking-head updates and walkthroughs.",
    href: "/record",
    icon: Camera,
  },
  {
    title: "Review recent videos",
    description: "Open your saved recordings and share existing links.",
    href: "/recordings",
    icon: Video,
  },
];

export default function LaunchPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#0f1b3d_0%,#050a1e_48%,#020611_100%)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col overflow-hidden rounded-4xl border border-white/10 bg-white/5 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/25">
              <Rocket className="h-5 w-5 text-slate-950" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.24em] text-cyan-300 uppercase">Xyro</p>
              <p className="text-xs text-slate-400">Launch Page</p>
            </div>
          </div>

          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
          >
            Back home
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:py-14">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold tracking-[0.2em] text-cyan-200 uppercase">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Ready to launch
            </div>

            <h1 className="max-w-2xl text-5xl font-bold tracking-tighter text-white sm:text-6xl lg:text-7xl">
              Open Xyro and start recording in seconds.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              A focused launch page for getting straight to the recorder. Choose a capture mode, tune quality, and move straight into the studio.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/record"
                className="inline-flex items-center justify-center rounded-xl bg-linear-to-r from-cyan-400 to-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/40 transition-all hover:shadow-xl hover:shadow-cyan-500/50 active:scale-[0.98]"
              >
                Launch Recorder
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/recordings"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/10"
              >
                Open Library
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {launchSteps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <div key={step.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <span className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
                        0{index + 1}
                      </span>
                    </div>
                    <h2 className="text-base font-semibold text-white">{step.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-[28px] bg-linear-to-br from-cyan-500/20 via-transparent to-fuchsia-500/20 blur-3xl" />
            <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-white">Launch panel</p>
                  <p className="text-xs text-slate-400">Choose where you want to go next</p>
                </div>
                <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                  Live
                </div>
              </div>

              <div className="space-y-4 p-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;

                  return (
                    <Link
                      key={action.title}
                      href={action.href}
                      className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:border-cyan-400/30 hover:bg-white/10"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 transition-transform group-hover:scale-105">
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-white">{action.title}</p>
                        <p className="mt-1 text-sm text-slate-400">{action.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-cyan-300" aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
