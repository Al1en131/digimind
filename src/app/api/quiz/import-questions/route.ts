import { NextRequest, NextResponse } from "next/server";
import { parseQuestionsFromText } from "@/lib/quiz-parser";
import mammoth from "mammoth";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "File tidak ditemukan dalam permintaan." },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = "";

    if (fileName.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value || "";
    } else if (fileName.endsWith(".pdf")) {
      // Dynamic require or require for pdf-parse to avoid SSR issues
      const { PDFParse } = require("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      extractedText = result.text || "";
      await parser.destroy();
    } else if (fileName.endsWith(".txt")) {
      extractedText = buffer.toString("utf-8");
    } else {
      return NextResponse.json(
        { success: false, message: "Format file tidak didukung. Harap unggah file Word (.docx), PDF (.pdf), atau teks (.txt)." },
        { status: 400 }
      );
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        { success: false, message: "Isi file kosong atau tidak dapat diekstraksi." },
        { status: 400 }
      );
    }

    const questions = parseQuestionsFromText(extractedText);

    if (questions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tidak ada soal yang berhasil dikenali. Pastikan file memiliki format standar (contoh: '1. Pertanyaan...', baris pilihan 'A. Pilihan 1', 'B. Pilihan 2', dan 'Kunci: A').",
          previewText: extractedText.slice(0, 300),
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      count: questions.length,
      questions,
      message: `Berhasil mengekstrak ${questions.length} soal dari file.`,
    });
  } catch (error: any) {
    console.error("Error importing questions:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat memproses file: " + (error?.message || "Unknown error"),
      },
      { status: 500 }
    );
  }
}
