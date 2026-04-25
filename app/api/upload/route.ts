import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/prisma";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      const error = new Error("No file provided");
      Sentry.captureException(error, {
        level: "warning",
        tags: {
          route: "upload",
          reason: "missing_file",
        },
      });
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Add breadcrumb for debugging
    Sentry.addBreadcrumb({
      category: "upload",
      message: `Uploading file: ${file.name}`,
      level: "info",
      data: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      },
    });

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "video",
          folder: "xyro_videos",
          // Keep upload fast; transforms are applied on delivery in the player.
          timeout: 120000,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.on("error", (error) => {
        Sentry.captureException(error, {
          tags: {
            route: "upload",
            stage: "cloudinary_stream",
          },
        });
        reject(error);
      });

      uploadStream.end(buffer);
    });

    const uploadResult = result as {
      public_id: string;
      secure_url: string;
      duration: number;
      bytes: number;
    };

    // Log successful upload
    Sentry.addBreadcrumb({
      category: "upload",
      message: "Upload successful",
      level: "info",
      data: {
        videoId: uploadResult.public_id,
        url: uploadResult.secure_url,
        duration: uploadResult.duration,
      },
    });

    const encodedVideoId = encodeURIComponent(uploadResult.public_id);
    const sharePath = `/share/${encodedVideoId}`;

    await prisma.recording.upsert({
      where: {
        cloudinaryId: uploadResult.public_id,
      },
      update: {
        sharePath,
        secureUrl: uploadResult.secure_url,
        durationSeconds: uploadResult.duration,
        sizeBytes: uploadResult.bytes,
      },
      create: {
        cloudinaryId: uploadResult.public_id,
        sharePath,
        secureUrl: uploadResult.secure_url,
        durationSeconds: uploadResult.duration,
        sizeBytes: uploadResult.bytes,
      },
    });

    return NextResponse.json({
      success: true,
      videoId: uploadResult.public_id,
      sharePath,
      url: uploadResult.secure_url,
      secureUrl: uploadResult.secure_url,
      duration: uploadResult.duration,
      durationSeconds: uploadResult.duration,
      size: uploadResult.bytes,
      sizeBytes: uploadResult.bytes,
    });
  } catch (error) {
    console.error("Upload error:", error);

    const errorObj = error as { message?: string; http_code?: number; name?: string };
    const isTimeout =
      errorObj?.name === "TimeoutError" ||
      errorObj?.http_code === 499 ||
      (errorObj?.message ?? "").toLowerCase().includes("timeout");
    const userMessage = isTimeout
      ? "Upload timed out. Try a shorter recording or try again."
      : "Upload failed";
    
    // Capture error with context
    Sentry.captureException(error, {
      level: "error",
      tags: {
        route: "upload",
        stage: "processing",
      },
      contexts: {
        upload: {
          error_type: error instanceof Error ? error.name : "Unknown",
          error_message: error instanceof Error ? error.message : String(error),
        },
      },
    });

    return NextResponse.json(
      { error: userMessage, details: errorObj?.message ?? String(error) },
      { status: 500 }
    );
  }
}
