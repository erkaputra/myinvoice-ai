import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";

const MODELS = ["gemini-3.8-flash", "gemini-2.5-flash"];

function fallbackParsePrompt(prompt: string) {
  const lower = prompt.toLowerCase();
  const isEnglish = /bahasa inggris|in english|english/i.test(prompt);

  let currency = "IDR";
  if (/\$\s*\d+|\busd\b/i.test(prompt)) currency = "USD";
  else if (/\bsgd\b|s\$\s*\d+/i.test(prompt)) currency = "SGD";
  else if (/\beur\b|€\s*\d+/i.test(prompt)) currency = "EUR";
  else if (/\bgbp\b|£\s*\d+/i.test(prompt)) currency = "GBP";
  else if (/\bmyr\b|\brm\s*\d+/i.test(prompt)) currency = "MYR";
  else if (/\brp\b|\bjuta\b|\bjt\b|\bribu\b|\brb\b/i.test(prompt)) currency = "IDR";

  const qtyMatch =
    prompt.match(/(\d+)\s*(?:kapal|vessel|unit|site|paket|bulan|pcs|orang|pax|x)/i) ||
    prompt.match(/(\d+)\s+/);
  const qty = qtyMatch ? Math.max(1, parseInt(qtyMatch[1], 10)) : 1;

  let price = 0;
  const currencyNumMatch =
    prompt.match(/(?:\$|usd|sgd|s\$|eur|€|gbp|£|myr|rm|rp\.?)\s*([\d.,]+)/i) ||
    prompt.match(/@\s*(?:\$|usd|rp\.?)?\s*([\d.,]+)/i);

  if (currencyNumMatch) {
    let rawNum = currencyNumMatch[1].trim();
    if (currency === "IDR") {
      rawNum = rawNum.replace(/\./g, "").replace(",", ".");
      price = parseFloat(rawNum) || 0;
      if (/\bjuta\b|\bjt\b/i.test(lower)) price *= 1_000_000;
      else if (/\bribu\b|\brb\b/i.test(lower)) price *= 1_000;
    } else {
      if (rawNum.includes(",") && !rawNum.includes(".")) {
        rawNum = rawNum.replace(",", ".");
      } else {
        rawNum = rawNum.replace(/,/g, "");
      }
      price = parseFloat(rawNum) || 0;
    }
  }

  let taxRate = 11;
  if (/no\s*ppn|tanpa\s*ppn|non\s*ppn|ppn\s*0/i.test(lower)) {
    taxRate = 0;
  } else {
    const ppnMatch = lower.match(/ppn\s*(\d+)/i);
    if (ppnMatch) taxRate = parseInt(ppnMatch[1], 10);
  }

  let desc = prompt
    .replace(/tagih\s*(dalam\s*bahasa\s*inggris)?,?\s*(dan\s*)?(sekalian\s*)?(tambahkan|tambah)?/gi, "")
    .replace(/\b(in\s*english|dalam\s*bahasa\s*inggris|no\s*ppn|tanpa\s*ppn|non\s*ppn)\b/gi, "")
    .replace(/@.*$/g, "")
    .trim()
    .replace(/^[,.\s-]+|[,.\s-]+$/g, "");

  if (!desc) {
    desc = isEnglish ? "Service Item" : "Item Layanan";
  } else if (isEnglish) {
    desc = desc
      .replace(/\bpembersihan\s+kapal\b/gi, "Vessel Cleaning Service")
      .replace(/\bpembersihan\b/gi, "Cleaning Service")
      .replace(/\bkapal\b/gi, "Vessel");
  }
  desc = desc.charAt(0).toUpperCase() + desc.slice(1);

  return {
    language: isEnglish ? "en" : "id",
    currency,
    taxRate,
    notes: isEnglish
      ? "Payment via official company bank transfer. Thank you for your business."
      : "Pembayaran melalui transfer rekening resmi perusahaan. Terima kasih atas kerja samanya.",
    items: [
      {
        description: desc,
        qty,
        price,
      },
    ],
  };
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt wajib diisi" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { ...fallbackParsePrompt(prompt), _mode: "local-fallback" },
        { status: 200 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const contents = `Ekstrak detail invoice dari teks berikut menjadi struktur JSON yang rapi dan profesional.
Jika user meminta bahasa tertentu (misalnya "in English" atau "bahasa inggris"), gunakan bahasa tersebut untuk field "language" ("en" atau "id") serta terjemahkan/rapikan deskripsi item dan catatan pembayaran ke bahasa yang diminta.
Teks user: "${prompt}"`;

    const config = {
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
        required: ["language", "currency", "taxRate", "items"],
      },
    };

    for (const model of MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config,
        });
        const parsed = JSON.parse(response.text || "{}");
        return NextResponse.json({ ...parsed, _mode: "gemini" });
      } catch {
        // Lanjut ke model berikutnya atau fallback lokal jika semua sibuk
      }
    }

    return NextResponse.json(
      { ...fallbackParsePrompt(prompt), _mode: "local-fallback" },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memproses AI";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
