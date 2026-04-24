"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 px-4">
      <main className="flex flex-col items-center gap-12 text-center">
        {/* Logo/Brand */}
        <div className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
            Xyro
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Share your screen in seconds
          </p>
        </div>

        {/* Main CTA */}
        <div className="space-y-6">
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md">
            Record your screen or camera, and get an instant shareable link. No sign-up required.
          </p>

          <Link
            href="/record"
            className="inline-flex items-center justify-center h-14 px-8 rounded-lg bg-purple-600 text-white font-semibold transition-all hover:bg-purple-700 active:scale-95 shadow-lg hover:shadow-xl"
          >
            🎥 Start Recording
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-3xl">
          <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Instant Links</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Get a shareable link immediately after recording
            </p>
          </div>

          <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Simple</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Record screen or camera with just one click
            </p>
          </div>

          <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
            <div className="text-3xl mb-2">🔗</div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Shareable</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Share with anyone using a simple link
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
