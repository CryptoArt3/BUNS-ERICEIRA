import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

const LOCAL_QR_DIRECTORY = path.join(process.cwd(), "public", "generated", "qr");
const SHARED_QR_DIRECTORY = path.join(process.cwd(), "..", "bot telegram", "public", "generated", "qr");

export async function GET(
  _request: Request,
  { params }: { params: { filename: string } }
) {
  const filename = path.basename(params.filename);
  const candidatePaths = [
    path.join(LOCAL_QR_DIRECTORY, filename),
    path.join(SHARED_QR_DIRECTORY, filename),
  ];

  for (const candidatePath of candidatePaths) {
    try {
      const buffer = await readFile(candidatePath);

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=60",
        },
      });
    } catch {
      continue;
    }
  }

  return NextResponse.json({ error: "QR code not found." }, { status: 404 });
}
