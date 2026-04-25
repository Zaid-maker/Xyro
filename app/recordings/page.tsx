"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import * as Sentry from "@sentry/nextjs";

type RecordingItem = {
  cloudinaryId: string;
  sharePath: string;
  secureUrl: string | null;
  durationSeconds: number | null;
  sizeBytes: number | null;
  createdAt: string;
};

type LocalRecording = {
  id: string;
  createdAt: string;
};

type RecordingsApiResponse = {
  success: boolean;
  recordings?: Array<{
    cloudinaryId: string;
    sharePath: string;
    secureUrl: string | null;
    durationSeconds: number | null;
    sizeBytes: number | null;
    createdAt: string;
  }>;
};

const STORAGE_KEY = "xyro_recent_recordings";

export default function RecentRecordingsPage() {
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [brokenThumbnailIds, setBrokenThumbnailIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<"database" | "local">("database");
  const [loading, setLoading] = useState(true);
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  const getThumbnailUrl = (publicId: string) => {
    if (!cloudName) {
      return "";
    }

    const safePublicId = publicId
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");

    // Capture frame at 1s and return a small poster image.
    return `https://res.cloudinary.com/${cloudName}/video/upload/so_1,c_fill,g_auto,w_360,h_202,q_auto,f_jpg/${safePublicId}.jpg`;
  };

  useEffect(() => {
    let isMounted = true;

    const loadFromLocalStorage = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed: LocalRecording[] = raw ? (JSON.parse(raw) as LocalRecording[]) : [];
        const fallbackRecordings: RecordingItem[] = parsed.map((item) => ({
          cloudinaryId: item.id,
          sharePath: `/share/${encodeURIComponent(item.id)}`,
          secureUrl: null,
          durationSeconds: null,
          sizeBytes: null,
          createdAt: item.createdAt,
        }));

        if (isMounted) {
          setDataSource("local");
          setRecordings(fallbackRecordings);
          setLoading(false);
        }
      } catch (error) {
        Sentry.captureException(error, {
          level: "warning",
          tags: {
            page: "recordings",
            action: "load_recent_recordings_local",
          },
        });

        if (isMounted) {
          setDataSource("local");
          setRecordings([]);
          setLoading(false);
        }
      }
    };

    const loadRecordings = async () => {
      try {
        const response = await fetch("/api/recordings", { cache: "no-store" });

        if (!response.ok) {
          throw new Error(`Failed to load recordings: ${response.status}`);
        }

        const payload = (await response.json()) as RecordingsApiResponse;
        if (!payload.success || !payload.recordings) {
          throw new Error("Recordings API returned an invalid payload");
        }

        if (isMounted) {
          setDataSource("database");
          setRecordings(payload.recordings);
          setLoading(false);
        }
      } catch (error) {
        Sentry.captureException(error, {
          level: "warning",
          tags: {
            page: "recordings",
            action: "load_recent_recordings_api",
          },
        });

        loadFromLocalStorage();
      }
    };

    void loadRecordings();

    return () => {
      isMounted = false;
    };
  }, []);

  const sortedRecordings = useMemo(() => {
    return [...recordings].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [recordings]);

  const clearRecentRecordings = () => {
    localStorage.removeItem(STORAGE_KEY);
    setRecordings([]);
  };

  const copyShareLink = async (recordingId: string) => {
    try {
      const encodedId = encodeURIComponent(recordingId);
      const origin = window.location.origin;
      const shareUrl = `${origin}/share/${encodedId}`;

      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(recordingId);
      window.setTimeout(() => {
        setCopiedId((current) => (current === recordingId ? null : current));
      }, 1800);

      Sentry.addBreadcrumb({
        category: "recordings",
        message: "Copied share link from recordings list",
        level: "info",
        data: {
          recordingId,
        },
      });
    } catch (error) {
      Sentry.captureException(error, {
        level: "warning",
        tags: {
          page: "recordings",
          action: "copy_share_link",
        },
        contexts: {
          recording: {
            id: recordingId,
          },
        },
      });
    }
  };

  const formatBytes = (bytes: number | null) => {
    if (!bytes || bytes <= 0) {
      return null;
    }

    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDuration = (durationSeconds: number | null) => {
    if (!durationSeconds || durationSeconds <= 0) {
      return null;
    }

    const totalSeconds = Math.floor(durationSeconds);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Recent Recordings</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {dataSource === "database"
                ? "Your latest recordings from PostgreSQL."
                : "Showing local fallback recordings from this browser."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {dataSource === "local" && sortedRecordings.length > 0 && (
              <button
                onClick={clearRecentRecordings}
                className="h-10 rounded-lg border border-red-300 px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950/30"
              >
                Clear List
              </button>
            )}
            <Link
              href="/record"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-purple-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
            >
              New Recording
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
            <p className="text-lg font-semibold text-gray-900 dark:text-white">Loading recordings...</p>
          </div>
        ) : sortedRecordings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
            <p className="text-lg font-semibold text-gray-900 dark:text-white">No recordings yet</p>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Record your first video and it will appear here.
            </p>
            <Link
              href="/record"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-purple-600 px-5 font-semibold text-white transition-colors hover:bg-purple-700"
            >
              Start Recording
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {sortedRecordings.map((recording) => {
              const sharePath = recording.sharePath;

              return (
                <div
                  key={recording.cloudinaryId}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                    <div className="w-full sm:w-56">
                      {!brokenThumbnailIds.has(recording.cloudinaryId) && cloudName ? (
                        <img
                          src={getThumbnailUrl(recording.cloudinaryId)}
                          alt="Recording thumbnail"
                          className="h-32 w-full rounded-lg object-cover"
                          loading="lazy"
                          onError={() => {
                            setBrokenThumbnailIds((prev) => new Set(prev).add(recording.cloudinaryId));
                          }}
                        />
                      ) : (
                        <div className="flex h-32 w-full items-center justify-center rounded-lg bg-gray-100 text-sm font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                          No thumbnail
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {recording.cloudinaryId}
                      </p>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(recording.createdAt).toLocaleString()}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                        {formatDuration(recording.durationSeconds) && (
                          <span>Duration: {formatDuration(recording.durationSeconds)}</span>
                        )}
                        {formatBytes(recording.sizeBytes) && (
                          <span>Size: {formatBytes(recording.sizeBytes)}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Link
                        href={sharePath}
                        className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                      >
                        Open
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          void copyShareLink(recording.cloudinaryId);
                        }}
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                      >
                        {copiedId === recording.cloudinaryId ? "Copied" : "Copy Link"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
