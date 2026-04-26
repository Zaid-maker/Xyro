"use client";

import { ArrowLeft, CheckCircle2, Copy, Download, Video, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

interface VideoData {
  id: string;
  url: string;
  duration: number;
  size: number;
  createdAt: string;
}

export default function SharePage() {
  const params = useParams();
  const rawVideoId = params.id as string;
  const videoId = (() => {
    try {
      return decodeURIComponent(rawVideoId);
    } catch {
      return rawVideoId;
    }
  })();
  const encodedVideoId = encodeURIComponent(videoId);
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/share/${encodedVideoId}` : "";
  const cloudinaryUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload/${videoId}`;
  const cloudinaryMp4Url = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload/f_mp4,q_auto/${videoId}`;
  const cloudinaryWebmUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload/f_webm,q_auto/${videoId}`;

  useEffect(() => {
    // Parse the Cloudinary public_id from URL
    // Cloudinary video URLs follow the pattern: res.cloudinary.com/cloud_name/video/upload/public_id
    // So we can directly construct the URL
    const mockData: VideoData = {
      id: videoId,
      url: cloudinaryUrl,
      duration: 0, // This would be fetched from Cloudinary metadata if needed
      size: 0,
      createdAt: new Date().toISOString(),
    };

    setVideoData(mockData);
    setLoading(false);

    Sentry.addBreadcrumb({
      category: "share",
      message: `Loaded share page for video`,
      level: "info",
      data: {
        videoId,
      },
    });
  }, [videoId, cloudinaryUrl]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);

      Sentry.addBreadcrumb({
        category: "share",
        message: "Copied share link to clipboard",
        level: "info",
        data: {
          videoId,
        },
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy error:", err);

      Sentry.captureException(err, {
        level: "warning",
        tags: {
          page: "share",
          action: "copy_clipboard",
        },
      });

      alert("Failed to copy to clipboard");
    }
  };

  const downloadVideo = () => {
    try {
      const a = document.createElement("a");
      a.href = cloudinaryMp4Url;
      a.download = `xyro_${videoId}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      Sentry.addBreadcrumb({
        category: "share",
        message: "Downloaded video",
        level: "info",
        data: {
          videoId,
        },
      });
    } catch (err) {
      console.error("Download error:", err);

      Sentry.captureException(err, {
        level: "warning",
        tags: {
          page: "share",
          action: "download_video",
        },
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <p className="text-gray-600 dark:text-gray-400">Loading video...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 inline-flex items-center justify-center gap-2">
            <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
            {error}
          </h1>
          <Link
            href="/"
            className="inline-flex items-center justify-center h-12 px-6 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors"
          >
            Record Another Video
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-8">
      <div className="w-full max-w-3xl">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Home
        </Link>

        {/* Success Message */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2 inline-flex items-center justify-center gap-2">
            <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
            Recording Complete!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your video is ready to share
          </p>
        </div>

        {/* Video Preview */}
        {videoData && (
          <div className="rounded-lg overflow-hidden shadow-lg mb-8 bg-white dark:bg-gray-900">
            <video
              controls
              playsInline
              className="w-full bg-black"
              preload="metadata"
            >
              <source src={cloudinaryMp4Url} type="video/mp4" />
              <source src={cloudinaryWebmUrl} type="video/webm" />
              Your browser does not support this video format.
            </video>
          </div>
        )}

        {/* Share Section */}
        <div className="p-6 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Share Your Video
          </h2>

          {/* Shareable Link */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
            />
            <button
              onClick={copyToClipboard}
              className={`px-6 h-12 rounded-lg font-semibold transition-colors ${
                copied
                  ? "bg-green-600 text-white"
                  : "bg-purple-600 text-white hover:bg-purple-700"
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="mr-2 inline-block h-4 w-4" aria-hidden="true" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-2 inline-block h-4 w-4" aria-hidden="true" />
                  Copy
                </>
              )}
            </button>
          </div>

          {/* Video Info */}
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 mb-6">
            <p>
              <span className="font-semibold">Video ID:</span> {videoId}
            </p>
            <p>
              <span className="font-semibold">Created:</span>{" "}
              {videoData && new Date(videoData.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={downloadVideo}
            className="flex-1 h-12 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            <Download className="mr-2 inline-block h-4 w-4" aria-hidden="true" />
            Download Video
          </button>
          <Link
            href="/record"
            className="flex-1 h-12 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center"
          >
            <Video className="mr-2 h-4 w-4" aria-hidden="true" />
            Record Another
          </Link>
        </div>
      </div>
    </div>
  );
}
