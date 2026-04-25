"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

type RecordingMode = "screen" | "camera" | null;
type RecordingQuality = "low" | "medium" | "high";

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

      mediaRecorder.start();
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

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary client config missing. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.");
      }

      const formData = new FormData();
      formData.append("file", recordedChunks[0]);
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", "xyro_videos");

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

      const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
        method: "POST",
        body: formData,
      });

      const cloudinaryResult = await cloudinaryResponse.json();

      if (!cloudinaryResponse.ok) {
        const message = [cloudinaryResult?.error?.message, cloudinaryResult?.error].filter(Boolean).join(" - ");
        throw new Error(message || "Upload failed");
      }

      const videoId = cloudinaryResult.public_id as string;
      const secureUrl = cloudinaryResult.secure_url as string | undefined;
      const durationSeconds = Number(cloudinaryResult.duration ?? 0) || null;
      const sizeBytes = Number(cloudinaryResult.bytes ?? 0) || null;

      const metadataResponse = await fetch("/api/recordings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cloudinaryId: videoId,
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8"
        >
          ← Back
        </Link>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Record Your Screen
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Choose what you want to record and get a shareable link
        </p>

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <label htmlFor="quality" className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
            Recording Quality
          </label>
          <select
            id="quality"
            value={quality}
            disabled={isRecording || recordedChunks.length > 0}
            onChange={(event) => {
              setQuality(event.target.value as RecordingQuality);
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
          >
            <option value="low">{QUALITY_SETTINGS.low.label} - fastest upload</option>
            <option value="medium">{QUALITY_SETTINGS.medium.label} - balanced</option>
            <option value="high">{QUALITY_SETTINGS.high.label} - best quality</option>
          </select>
        </div>

        {/* Mode Selection or Recording Interface */}
        {!mode ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Screen Recording Option */}
            <button
              onClick={() => setMode("screen")}
              className="p-8 rounded-lg border-2 border-gray-200 dark:border-gray-800 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-gray-900 transition-all text-left"
            >
              <div className="text-4xl mb-4">🖥️</div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Record Screen
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Capture your entire screen or a specific window
              </p>
            </button>

            {/* Camera Recording Option */}
            <button
              onClick={() => setMode("camera")}
              className="p-8 rounded-lg border-2 border-gray-200 dark:border-gray-800 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-900 transition-all text-left"
            >
              <div className="text-4xl mb-4">📹</div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Record Camera
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Capture video from your webcam with audio
              </p>
            </button>
          </div>
        ) : recordedChunks.length === 0 ? (
          // Recording in progress or ready to record
          <div className="space-y-6">
            <div className="p-8 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Mode: <span className="font-semibold">{mode === "screen" ? "Screen" : "Camera"}</span>
              </p>

              {mode === "camera" && (
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full rounded-lg bg-black mb-6 max-h-96 object-cover"
                />
              )}

              <div className="flex gap-4">
                {isRecording ? (
                  <>
                    <button
                      onClick={stopRecording}
                      className="flex-1 h-12 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
                    >
                      ⏹ Stop Recording
                    </button>
                    <div className="flex items-center gap-2 px-4 rounded-lg bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 font-semibold">
                      <span className="inline-block w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                      Recording...
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      onClick={startRecording}
                      className="flex-1 h-12 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors"
                    >
                      ⏺ Start Recording
                    </button>
                    <button
                      onClick={() => setMode(null)}
                      className="px-6 h-12 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                    >
                      Change Mode
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Preview and generate link
          <div className="space-y-6">
            <div className="p-8 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Preview
              </h2>
              <video
                ref={videoPreviewRef}
                controls
                className="w-full rounded-lg bg-black mb-6 max-h-96 object-cover"
              />

              <div className="flex gap-4">
                <button
                  onClick={generateLink}
                  disabled={isUploading}
                  className="flex-1 h-12 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? "⏳ Uploading..." : "🔗 Generate Link"}
                </button>
                <button
                  onClick={resetRecording}
                  disabled={isUploading}
                  className="px-6 h-12 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
