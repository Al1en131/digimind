import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Mencoba melakukan query ke database untuk menghitung jumlah user
    const userCount = await prisma.user.count();
    
    return NextResponse.json({ 
      success: true, 
      message: "Koneksi database berhasil!", 
      userCount 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      message: "Koneksi database gagal.", 
      error: error.message 
    }, { status: 500 });
  }
}
