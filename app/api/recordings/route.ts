import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/prisma";

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
