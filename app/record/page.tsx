"use client";

import {
  Archive,
  ArrowLeft,
  BarChart3,
  Bell,
  Camera,
  Circle,
  Folder,
  HelpCircle,
  LayoutGrid,
  LifeBuoy,
  Link2,
  Menu,
  Monitor,
  Plus,
  Square,
  Upload,
  Users,
  Video,
  X,
} from "lucide-react";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

type RecordingMode = "screen" | "camera" | null;
type RecordingQuality = "low" | "medium" | "high";

type CloudinaryUploadResult = {
  public_id: string;
  secure_url?: string;
  duration?: number;
  bytes?: number;
};

const CHUNKED_UPLOAD_THRESHOLD_BYTES = 25 * 1024 * 1024;
const CHUNK_SIZE_BYTES = 5 * 1024 * 1024;

const QUALITY_SETTINGS: Record<
  RecordingQuality,
  {
    label: string;
    width: number;
    height: number;
    frameRate: number;
    videoBitsPerSecond: number;
  }
> = {
  low: {
    label: "Low (480p)",
    width: 854,
    height: 480,
    frameRate: 20,
    videoBitsPerSecond: 800_000,
  },
  medium: {
    label: "Medium (720p)",
    width: 1280,
    height: 720,
    frameRate: 24,
    videoBitsPerSecond: 1_800_000,
  },
  high: {
    label: "High (1080p)",
    width: 1920,
    height: 1080,
    frameRate: 30,
    videoBitsPerSecond: 3_500_000,
  },
};

type RecentRecording = {
  id: string;
  createdAt: string;
};

export default function RecordPage() {
  const router = useRouter();
  const [mode, setMode] = useState<RecordingMode>(null);
  const [quality, setQuality] = useState<RecordingQuality>("medium");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const saveRecentRecording = (id: string) => {
    try {
      const key = "xyro_recent_recordings";
      const raw = localStorage.getItem(key);
      const existing: RecentRecording[] = raw ? (JSON.parse(raw) as RecentRecording[]) : [];
      const updated: RecentRecording[] = [
        { id, createdAt: new Date().toISOString() },
        ...existing.filter((item) => item.id !== id),
      ].slice(0, 20);

      localStorage.setItem(key, JSON.stringify(updated));
    } catch (error) {
      Sentry.captureException(error, {
        level: "warning",
        tags: {
          page: "record",
          action: "save_recent_recording",
        },
      });
    }
  };

  // Start recording based on mode
  const startRecording = async () => {
    try {
      let stream: MediaStream;
      const qualitySettings = QUALITY_SETTINGS[quality];

      if (mode === "screen") {
        // Get screen capture
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: "always",
            width: { ideal: qualitySettings.width },
            height: { ideal: qualitySettings.height },
            frameRate: { ideal: qualitySettings.frameRate, max: qualitySettings.frameRate },
          } as MediaTrackConstraintSet,
          audio: false,
        });
      } else if (mode === "camera") {
        // Get camera access
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: qualitySettings.width },
            height: { ideal: qualitySettings.height },
            frameRate: { ideal: qualitySettings.frameRate, max: qualitySettings.frameRate },
          },
          audio: true,
        });
      } else {
        return;
      }

      streamRef.current = stream;
      const chunks: Blob[] = [];

      const preferredMimeTypes = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
      ];
      const selectedMimeType = preferredMimeTypes.find((mime) => MediaRecorder.isTypeSupported(mime));

      const mediaRecorder = new MediaRecorder(stream, {
        ...(selectedMimeType ? { mimeType: selectedMimeType } : {}),
        videoBitsPerSecond: qualitySettings.videoBitsPerSecond,
      });

      Sentry.addBreadcrumb({
        category: "recording",
        message: `Started ${mode} recording`,
        level: "info",
        data: {
          quality,
          width: qualitySettings.width,
          height: qualitySettings.height,
          frameRate: qualitySettings.frameRate,
        },
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType || "video/webm" });
        setRecordedChunks([blob]);

        // Show preview
        const videoUrl = URL.createObjectURL(blob);
        if (videoPreviewRef.current) {
          videoPreviewRef.current.src = videoUrl;
        }

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());

        Sentry.addBreadcrumb({
          category: "recording",
          message: `Recording stopped - ${(blob.size / 1024 / 1024).toFixed(2)}MB`,
          level: "info",
        });
      };

      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing media:", error);

      Sentry.captureException(error, {
        level: "warning",
        tags: {
          page: "record",
          action: "start_recording",
        },
        contexts: {
          recording: {
            mode: mode,
          },
        },
      });

      alert("Failed to access camera or screen. Please try again.");
      setMode(null);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Upload to Cloudinary and generate link
  const generateLink = async () => {
    if (recordedChunks.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary client config missing. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.");
      }

      Sentry.addBreadcrumb({
        category: "upload",
        message: `Uploading video directly to Cloudinary - ${(recordedChunks[0].size / 1024 / 1024).toFixed(2)}MB`,
        level: "info",
        data: {
          fileSize: recordedChunks[0].size,
          fileType: recordedChunks[0].type,
          quality,
        },
      });

      const cloudinaryResult = await uploadToCloudinary({
        blob: recordedChunks[0],
        cloudName,
        uploadPreset,
        onProgress: setUploadProgress,
      });

      const videoId = cloudinaryResult.public_id;
      const secureUrl = cloudinaryResult.secure_url;
      const durationSeconds = Number(cloudinaryResult.duration ?? 0) || null;
      const sizeBytes = Number(cloudinaryResult.bytes ?? 0) || null;

      const metadataResponse = await fetch("/api/recordings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cloudinaryId: videoId,
          quality,
          secureUrl,
          durationSeconds,
          sizeBytes,
        }),
      });

      if (!metadataResponse.ok) {
        const metadataError = await metadataResponse.json().catch(() => null);
        Sentry.captureMessage("Recording uploaded but metadata save failed", {
          level: "warning",
          tags: {
            page: "record",
            action: "save_metadata",
          },
          contexts: {
            metadata: {
              videoId,
              status: metadataResponse.status,
              details: metadataError,
            },
          },
        });
      }

      const encodedVideoId = encodeURIComponent(videoId);

      saveRecentRecording(videoId);

      Sentry.addBreadcrumb({
        category: "upload",
        message: `Upload successful - redirecting to share page`,
        level: "info",
        data: {
          videoId,
          sizeBytes,
          durationSeconds,
        },
      });

      // Navigate to share page with URL-safe ID
      router.push(`/share/${encodedVideoId}`);
    } catch (error) {
      console.error("Error uploading video:", error);

      Sentry.captureException(error, {
        level: "error",
        tags: {
          page: "record",
          action: "generate_link",
        },
        contexts: {
          upload: {
            videoSize: recordedChunks[0].size,
            videoType: recordedChunks[0].type,
          },
        },
      });

      alert(error instanceof Error ? error.message : "Failed to upload video. Please try again.");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Reset recording
  const resetRecording = () => {
    setMode(null);
    setRecordedChunks([]);
    if (videoPreviewRef.current) {
      videoPreviewRef.current.src = "";
    }

    Sentry.addBreadcrumb({
      category: "recording",
      message: "Recording reset",
      level: "info",
    });
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#131313] text-on-surface">
      <nav className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-white/10 bg-[#050505]/80 px-6 font-['Space_Grotesk'] tracking-tight backdrop-blur-xl">
        <div className="flex items-center gap-8">
          <span className="text-2xl font-bold tracking-tighter text-cyan-400">Xyro</span>
          <div className="hidden gap-6 md:flex">
            <Link className="text-zinc-400 transition-colors hover:text-zinc-100" href="#">
              Dashboard
            </Link>
            <Link className="text-zinc-400 transition-colors hover:text-zinc-100" href="#">
              Library
            </Link>
            <Link className="text-zinc-400 transition-colors hover:text-zinc-100" href="#">
              Settings
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="rounded-lg p-2 text-zinc-400 transition-all hover:bg-white/5 hover:text-zinc-100 active:scale-95">
            <Bell className="h-5 w-5" aria-hidden="true" />
          </button>
          <button className="rounded-lg p-2 text-zinc-400 transition-all hover:bg-white/5 hover:text-zinc-100 active:scale-95">
            <HelpCircle className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="ml-1 h-8 w-8 rounded-full border border-white/10 bg-linear-to-br from-cyan-400 to-purple-500" />
          <button
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100 md:hidden"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </nav>

      <aside className="fixed left-0 top-16 bottom-0 hidden w-64 flex-col border-r border-white/10 bg-[#050505] py-4 font-['Space_Grotesk'] text-sm md:flex">
        <div className="mb-8 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary-container text-sm font-bold text-on-primary">X</div>
            <div>
              <div className="font-bold text-zinc-100">Xyro Studio</div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-500">Pro Plan</div>
            </div>
          </div>
        </div>

        <button className="mx-4 mb-8 flex items-center justify-center gap-2 rounded-lg bg-primary-container py-3 font-bold text-on-primary-container transition-all hover:brightness-110 active:scale-[0.98]">
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Recording
        </button>

        <div className="flex flex-col gap-1 px-2">
          <a className="flex items-center gap-3 rounded-lg border-r-2 border-cyan-400 bg-cyan-400/5 px-4 py-3 font-bold text-cyan-400 transition-all duration-200 ease-in-out" href="#">
            <Video className="h-4 w-4" aria-hidden="true" />
            Record
          </a>
          <a className="flex items-center gap-3 rounded-lg px-4 py-3 text-zinc-500 transition-all duration-200 ease-in-out hover:bg-white/5 hover:text-zinc-200" href="#">
            <Folder className="h-4 w-4" aria-hidden="true" />
            My Videos
          </a>
          <a className="flex items-center gap-3 rounded-lg px-4 py-3 text-zinc-500 transition-all duration-200 ease-in-out hover:bg-white/5 hover:text-zinc-200" href="#">
            <Users className="h-4 w-4" aria-hidden="true" />
            Team
          </a>
          <a className="flex items-center gap-3 rounded-lg px-4 py-3 text-zinc-500 transition-all duration-200 ease-in-out hover:bg-white/5 hover:text-zinc-200" href="#">
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
            Analytics
          </a>
        </div>

        <div className="mt-auto flex flex-col gap-1 border-t border-white/5 px-2 pt-4">
          <a className="flex items-center gap-3 rounded-lg px-4 py-2 text-zinc-500 transition-all hover:bg-white/5 hover:text-zinc-200" href="#">
            <Archive className="h-4 w-4" aria-hidden="true" />
            Archive
          </a>
          <a className="flex items-center gap-3 rounded-lg px-4 py-2 text-zinc-500 transition-all hover:bg-white/5 hover:text-zinc-200" href="#">
            <LifeBuoy className="h-4 w-4" aria-hidden="true" />
            Support
          </a>
        </div>
      </aside>

      {mobileMenuOpen && (
        <div className="fixed left-0 right-0 top-16 z-40 border-b border-white/10 bg-[#050505]/95 px-6 py-4 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-3 text-sm text-zinc-300">
            <Link href="#">Dashboard</Link>
            <Link href="#">Library</Link>
            <Link href="#">Settings</Link>
          </div>
        </div>
      )}

      <main className="relative min-h-screen pt-16 md:ml-64">
        <div className="pointer-events-none absolute right-0 top-0 -mr-64 -mt-64 h-125 w-125 rounded-full bg-primary-container/5 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 -mb-32 -ml-32 h-100 w-100 rounded-full bg-secondary-container/5 blur-[100px]" />

        <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-xl">
          <div className="mb-lg">
            <Link className="mb-base inline-flex items-center gap-2 text-zinc-500 transition-colors hover:text-primary group" href="/">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
              <span className="text-[12px] font-semibold uppercase tracking-[0.08em]">Back to Dashboard</span>
            </Link>
            <h1 className="mb-xs font-['Space_Grotesk'] text-[48px] font-bold leading-[1.1] tracking-[-0.02em] text-on-surface">
              Record Your Screen
            </h1>
            <p className="max-w-2xl text-[18px] leading-[1.6] text-zinc-400">
              Choose what you want to record and get a shareable link instantly.
            </p>
          </div>

          <div className="grid grid-cols-12 gap-gutter">
            <div className="glass-panel col-span-12 flex flex-col justify-center rounded-xl p-md lg:col-span-4">
              <label htmlFor="quality" className="mb-sm block text-[12px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Recording Quality
              </label>
              <div className="relative group">
                <select
                  id="quality"
                  value={quality}
                  disabled={isRecording || recordedChunks.length > 0}
                  onChange={(event) => setQuality(event.target.value as RecordingQuality)}
                  className="w-full cursor-pointer appearance-none border-b border-white/10 bg-surface-container-low px-4 py-3 font-['Inter'] text-[16px] text-on-surface transition-all focus:border-primary-container focus:ring-0"
                >
                  <option value="high">High (1080p) - sharpest</option>
                  <option value="medium">Medium (720p) - balanced</option>
                  <option value="low">Standard (480p) - fastest</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-3 text-zinc-500">▾</span>
              </div>
              <p className="mt-base flex items-center gap-1 text-[11px] text-zinc-500">
                <span>ℹ</span>
                Auto-detected based on connection
              </p>
            </div>

            <div className="col-span-12 grid grid-cols-1 gap-gutter md:grid-cols-2 lg:col-span-8">
              <button onClick={() => setMode("screen")} className="recording-card glass-panel flex flex-col items-center rounded-xl p-lg text-center transition-all hover:border-cyan-400/80">
                <div className="mb-md flex h-16 w-16 items-center justify-center rounded-full bg-primary-container/10 transition-transform group-hover:scale-110">
                  <Monitor className="text-4xl text-primary-container" aria-hidden="true" />
                </div>
                <h3 className="mb-xs text-[24px] font-medium leading-[1.3] text-zinc-100">Record Screen</h3>
                <p className="text-[14px] leading-normal text-zinc-400">Capture your entire screen or a specific window.</p>
              </button>

              <button onClick={() => setMode("camera")} className="recording-card glass-panel flex flex-col items-center rounded-xl p-lg text-center transition-all hover:border-cyan-400/80">
                <div className="mb-md flex h-16 w-16 items-center justify-center rounded-full bg-primary-container/10 transition-transform group-hover:scale-110">
                  <Camera className="text-4xl text-primary-container" aria-hidden="true" />
                </div>
                <h3 className="mb-xs text-[24px] font-medium leading-[1.3] text-zinc-100">Record Camera</h3>
                <p className="text-[14px] leading-normal text-zinc-400">Capture video from your webcam with audio.</p>
              </button>
            </div>

            <div className="col-span-12 mt-lg">
              <div className="mb-md flex items-end justify-between">
                <h2 className="text-[24px] font-medium leading-[1.3] text-on-surface">Recent Sessions</h2>
                <button className="text-[12px] font-semibold uppercase tracking-[0.08em] text-primary-container hover:underline">
                  View All
                </button>
              </div>

              <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
                <div className="glass-panel group cursor-pointer overflow-hidden rounded-xl">
                  <div className="relative aspect-video overflow-hidden bg-surface-container-high">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#6d3a84_0%,#2a2a2a_45%,#181818_100%)] opacity-90" />
                    <div className="absolute inset-x-0 top-0 h-10 bg-black/30" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-8 w-24 rounded bg-white/10 backdrop-blur-md" />
                    </div>
                    <div className="absolute top-2 right-2 rounded bg-black/60 px-2 py-1 text-[10px] font-bold text-zinc-300 backdrop-blur-md">12:04</div>
                    <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/20 backdrop-blur-md">
                        <span className="text-white text-xl">▶</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-base">
                    <p className="truncate text-[14px] text-zinc-200">Project Alpha Sync - Screen Share</p>
                    <p className="text-[11px] text-zinc-500">Recorded 2h ago</p>
                  </div>
                </div>

                <div className="glass-panel group cursor-pointer overflow-hidden rounded-xl">
                  <div className="relative aspect-video overflow-hidden bg-surface-container-high">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#2b4d7a_0%,#262626_45%,#181818_100%)] opacity-90" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-8 w-24 rounded bg-white/10 backdrop-blur-md" />
                    </div>
                    <div className="absolute top-2 right-2 rounded bg-black/60 px-2 py-1 text-[10px] font-bold text-zinc-300 backdrop-blur-md">05:22</div>
                    <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/20 backdrop-blur-md">
                        <span className="text-white text-xl">▶</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-base">
                    <p className="truncate text-[14px] text-zinc-200">Quick Feedback - UI Review</p>
                    <p className="text-[11px] text-zinc-500">Recorded 5h ago</p>
                  </div>
                </div>

                <div className="glass-panel flex cursor-pointer flex-col items-center justify-center rounded-xl border-dashed border-white/10 bg-transparent transition-all hover:bg-white/5">
                  <LayoutGrid className="mb-sm h-10 w-10 text-zinc-600" aria-hidden="true" />
                  <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-zinc-500">New Folder</span>
                </div>
              </div>
            </div>

            {mode && recordedChunks.length === 0 && (
              <div className="col-span-12 mt-lg">
                <div className="glass-panel rounded-xl p-lg">
                  <p className="mb-6 text-zinc-400">
                    Mode: <span className="font-semibold text-zinc-100">{mode === "screen" ? "Screen" : "Camera"}</span>
                  </p>

                  {mode === "camera" && (
                    <video ref={videoPreviewRef} autoPlay muted playsInline className="mb-6 max-h-96 w-full rounded-lg bg-black object-cover" />
                  )}

                  <div className="flex flex-col gap-4 md:flex-row">
                    {isRecording ? (
                      <>
                        <button onClick={stopRecording} className="flex-1 rounded-lg bg-red-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-red-700">
                          <Square className="mr-2 inline-block h-4 w-4 fill-current" aria-hidden="true" />
                          Stop Recording
                        </button>
                        <div className="flex items-center gap-2 rounded-lg bg-red-100 px-4 py-3 font-semibold text-red-700 dark:bg-red-900 dark:text-red-200">
                          <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-red-500" />
                          Recording...
                        </div>
                      </>
                    ) : (
                      <>
                        <button onClick={startRecording} className="flex-1 rounded-lg bg-primary-container px-4 py-3 font-semibold text-on-primary-container transition-colors hover:brightness-110">
                          <Circle className="mr-2 inline-block h-4 w-4 fill-current" aria-hidden="true" />
                          Start Recording
                        </button>
                        <button onClick={() => setMode(null)} className="rounded-lg bg-white/10 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/15">
                          Change Mode
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {recordedChunks.length > 0 && (
              <div className="col-span-12 mt-lg">
                <div className="glass-panel rounded-xl p-lg">
                  <h2 className="mb-4 text-[24px] font-medium leading-[1.3] text-on-surface">Preview</h2>
                  <video ref={videoPreviewRef} controls className="mb-6 max-h-96 w-full rounded-lg bg-black object-cover" />

                  <div className="flex flex-col gap-4 md:flex-row">
                    <button onClick={generateLink} disabled={isUploading} className="flex-1 rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
                      {isUploading ? (
                        <>
                          <Upload className="mr-2 inline-block h-4 w-4 animate-pulse" aria-hidden="true" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Link2 className="mr-2 inline-block h-4 w-4" aria-hidden="true" />
                          Generate Link
                        </>
                      )}
                    </button>
                    <button onClick={resetRecording} disabled={isUploading} className="rounded-lg bg-white/10 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50">
                      Try Again
                    </button>
                  </div>

                  {isUploading && (
                    <div className="mt-4">
                      <div className="mb-1 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>Upload progress</span>
                        <span>{Math.round(uploadProgress)}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800">
                        <div
                          className="h-2 rounded-full bg-emerald-600 transition-all"
                          style={{ width: `${Math.min(100, Math.max(0, uploadProgress))}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-auto flex w-full justify-between border-t border-white/5 px-8 py-4 text-[12px] font-['Space_Grotesk']">
          <div className="text-zinc-600">© 2024 Xyro Technologies</div>
          <div className="flex gap-6">
            <a className="text-zinc-600 opacity-80 transition-all hover:text-cyan-300 hover:opacity-100" href="#">
              Privacy
            </a>
            <a className="text-zinc-600 opacity-80 transition-all hover:text-cyan-300 hover:opacity-100" href="#">
              Terms
            </a>
            <a className="text-zinc-600 opacity-80 transition-all hover:text-cyan-300 hover:opacity-100" href="#">
              API Docs
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}

async function uploadToCloudinary({
  blob,
  cloudName,
  uploadPreset,
  onProgress,
}: {
  blob: Blob;
  cloudName: string;
  uploadPreset: string;
  onProgress: (value: number) => void;
}): Promise<CloudinaryUploadResult> {
  if (blob.size <= CHUNKED_UPLOAD_THRESHOLD_BYTES) {
    const formData = new FormData();
    formData.append("file", blob);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "xyro_videos");

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
      method: "POST",
      body: formData,
    });

    const result = (await response.json()) as
      | CloudinaryUploadResult
      | { error?: { message?: string } | string };

    if (!response.ok) {
      throw new Error(formatCloudinaryError(result));
    }

    onProgress(100);
    return result as CloudinaryUploadResult;
  }

  const uploadId = `xyro-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let offset = 0;
  let finalResult: CloudinaryUploadResult | null = null;

  while (offset < blob.size) {
    const nextOffset = Math.min(offset + CHUNK_SIZE_BYTES, blob.size);
    const chunk = blob.slice(offset, nextOffset);
    const formData = new FormData();
    formData.append("file", chunk);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "xyro_videos");

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
      method: "POST",
      headers: {
        "X-Unique-Upload-Id": uploadId,
        "Content-Range": `bytes ${offset}-${nextOffset - 1}/${blob.size}`,
      },
      body: formData,
    });

    const result = (await response.json()) as
      | CloudinaryUploadResult
      | { error?: { message?: string } | string };

    if (!response.ok) {
      throw new Error(formatCloudinaryError(result));
    }

    finalResult = result as CloudinaryUploadResult;
    offset = nextOffset;
    onProgress((offset / blob.size) * 100);
  }

  if (!finalResult?.public_id) {
    throw new Error("Upload finished but Cloudinary did not return a public_id.");
  }

  return finalResult;
}

function formatCloudinaryError(
  result: CloudinaryUploadResult | { error?: { message?: string } | string },
) {
  if ("error" in result && typeof result.error === "string") {
    return result.error;
  }

  if ("error" in result) {
    if (typeof result.error === "object" && result.error && "message" in result.error) {
      return result.error.message || "Upload failed";
    }

    return "Upload failed";
  }

  return "Upload failed";
}
