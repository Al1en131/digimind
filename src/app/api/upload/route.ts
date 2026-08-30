import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/auth-utils";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    const decoded = sessionToken ? verifyJWT(sessionToken) : null;

    if (!decoded || (decoded.role !== "teacher" && decoded.role !== "admin")) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "File wajib diunggah." },
        { status: 400 }
      );
    }

    // Validate file type (image or video)
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { success: false, message: "Format file tidak didukung. Harap unggah gambar (PNG/JPG/GIF/WebP) atau video (MP4/WebM)." },
        { status: 400 }
      );
    }

    // Limit file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "Ukuran file terlalu besar (maksimal 50MB)." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${Date.now()}_${safeName}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      message: "File berhasil diunggah!",
      url: publicUrl,
      fileName: file.name,
      fileType: isImage ? "image" : "video",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal mengunggah file.", error: error.message },
      { status: 500 }
    );
  }
}
