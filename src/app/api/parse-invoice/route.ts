import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt wajib diisi" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY belum dipasang di environment variables (.env.local / Vercel)" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Ekstrak detail invoice dari teks berikut menjadi struktur JSON yang rapi dan profesional.
Jika user meminta bahasa tertentu (misalnya "buat in english" atau "in English"), gunakan bahasa tersebut untuk field "language" ("en" atau "id") serta terjemahkan/rapikan deskripsi item dan catatan pembayaran ke bahasa yang diminta.
Teks user: "${prompt}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            language: {
              type: Type.STRING,
              description: "Kode bahasa invoice: 'id' untuk Indonesia atau 'en' untuk Inggris",
            },
            currency: {
              type: Type.STRING,
              description: "Kode mata uang ISO seperti 'IDR', 'USD', 'SGD', 'EUR'",
            },
            clientName: { type: Type.STRING },
            clientAddress: { type: Type.STRING },
            taxRate: { type: Type.NUMBER, description: "Persentase pajak/PPN, 0 jika no ppn" },
            notes: { type: Type.STRING, description: "Catatan pembayaran profesional sesuai bahasa" },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING, description: "Nama jasa/barang yang rapi dan profesional" },
                  qty: { type: Type.NUMBER },
                  price: { type: Type.NUMBER },
                },
                required: ["description", "qty", "price"],
              },
            },
          },
          required: ["language", "currency", "clientName", "taxRate", "items"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return NextResponse.json(parsed);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memproses AI";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
