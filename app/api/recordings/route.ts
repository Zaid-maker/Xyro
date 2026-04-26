import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/prisma";

type CreateRecordingBody = {
  cloudinaryId: string;
  quality?: string;
  secureUrl?: string;
  durationSeconds?: number;
  sizeBytes?: number;
};

export async function GET() {
  try {
    const recordings = await prisma.recording.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      select: {
        cloudinaryId: true,
        sharePath: true,
        secureUrl: true,
        quality: true,
        durationSeconds: true,
        sizeBytes: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      recordings,
    });
  } catch (error) {
    Sentry.captureException(error, {
      level: "error",
      tags: {
        route: "recordings",
        action: "list",
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch recordings",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateRecordingBody;
    const cloudinaryId = body.cloudinaryId?.trim();

    if (!cloudinaryId) {
      return NextResponse.json(
        {
          success: false,
          error: "cloudinaryId is required",
        },
        { status: 400 }
      );
    }

    const encodedVideoId = encodeURIComponent(cloudinaryId);
    const sharePath = `/share/${encodedVideoId}`;

    const recording = await prisma.recording.upsert({
      where: {
        cloudinaryId,
      },
      update: {
        sharePath,
        quality: body.quality ?? null,
        secureUrl: body.secureUrl ?? null,
        durationSeconds: body.durationSeconds ?? null,
        sizeBytes: body.sizeBytes ?? null,
      },
      create: {
        cloudinaryId,
        sharePath,
        quality: body.quality ?? null,
        secureUrl: body.secureUrl ?? null,
        durationSeconds: body.durationSeconds ?? null,
        sizeBytes: body.sizeBytes ?? null,
      },
      select: {
        cloudinaryId: true,
        sharePath: true,
        quality: true,
        secureUrl: true,
        durationSeconds: true,
        sizeBytes: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      recording,
    });
  } catch (error) {
    Sentry.captureException(error, {
      level: "error",
      tags: {
        route: "recordings",
        action: "create",
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to save recording",
      },
      { status: 500 }
    );
  }
}
