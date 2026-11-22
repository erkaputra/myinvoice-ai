"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  Printer,
  FileText,
  Building2,
  User,
  Calendar,
  Hash,
} from "lucide-react";

interface InvoiceItem {
  id: string;
  description: string;
  qty: number;
  price: number;
}

export default function MyInvoiceAI() {
  const [aiPrompt, setAiPrompt] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  const [invoiceNumber, setInvoiceNumber] = useState("INV-2026-001");
  const [issueDate, setIssueDate] = useState("2026-11-22");
  const [dueDate, setDueDate] = useState("2026-11-29");

  const [senderName, setSenderName] = useState("PT Erka Nusantara Teknologi");
  const [senderEmail, setSenderEmail] = useState("billing@erkanusa.dev");
  const [senderAddress, setSenderAddress] = useState("Jakarta, Indonesia");

  const [clientName, setClientName] = useState("PT Mitra Digital Indonesia");
  const [clientEmail, setClientEmail] = useState("finance@mitradigital.co.id");
  const [clientAddress, setClientAddress] = useState("Jl. Jend. Sudirman Kav. 21, Jakarta");

  const [taxRate, setTaxRate] = useState(11);
  const [notes, setNotes] = useState(
    "Pembayaran melalui transfer Bank BCA a.n. PT Erka Nusantara Teknologi (No. Rek: 1234567890). Terima kasih atas kerja samanya."
  );

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: "1",
      description: "Preventive Maintenance & Patroli Rute Fiber Optik",
      qty: 2,
      price: 3500000,
    },
    {
      id: "2",
      description: "Setup & Konfigurasi Workflow Otomasi AI",
      qty: 1,
      price: 5000000,
    },
  ]);

  const formatIDR = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  const handleSmartParse = () => {
    if (!aiPrompt.trim()) return;
    setIsParsing(true);

    setTimeout(() => {
      const clientMatch = aiPrompt.match(/(?:untuk|ke|klien)\s+([A-Za-z0-9\s.&]+?)(?:,|\.|untuk|jasa|item|nominal|senilai|rp|$)/i);
      if (clientMatch && clientMatch[1]) {
        setClientName(clientMatch[1].trim());
      }

      const qtyMatch = aiPrompt.match(/(\d+)\s*(?:unit|site|paket|bulan|pcs|x)/i);
      const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;

      let price = 1500000;
      const jutaMatch = aiPrompt.match(/(\d+(?:[.,]\d+)?)\s*(?:juta|jt)/i);
      const ribuMatch = aiPrompt.match(/(\d+(?:[.,]\d+)?)\s*(?:ribu|rb)/i);
      const rpMatch = aiPrompt.match(/rp\.?\s*([\d.]+)/i);

      if (jutaMatch) {
        price = parseFloat(jutaMatch[1].replace(",", ".")) * 1000000;
      } else if (ribuMatch) {
        price = parseFloat(ribuMatch[1].replace(",", ".")) * 1000;
      } else if (rpMatch) {
        price = parseInt(rpMatch[1].replace(/\./g, ""), 10);
      }

      const ppnMatch = aiPrompt.match(/ppn\s*(\d+)/i);
      if (ppnMatch) {
        setTaxRate(parseInt(ppnMatch[1], 10));
      } else if (/non\s*ppn|tanpa\s*ppn/i.test(aiPrompt)) {
        setTaxRate(0);
      }

      const cleanDesc = aiPrompt
        .replace(/(?:tolong\s+)?(?:buatkan|bikin)\s+invoice\s+/i, "")
        .trim();

      setItems([
        {
          id: Date.now().toString(),
          description: cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1),
          qty,
          price,
        },
      ]);

      setIsParsing(false);
    }, 450);
  };

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), description: "", qty: 1, price: 0 },
    ]);
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const subtotal = items.reduce((acc, item) => acc + item.qty * item.price, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const grandTotal = subtotal + taxAmount;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-20 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-white">
                MyInvoice <span className="text-indigo-400">AI</span>
              </h1>
              <p className="text-[11px] text-slate-400 -mt-1">
                Smart Billing & Instant Invoice Generator
              </p>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print / Save PDF
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 print:p-0 print:block">
        <div className="lg:col-span-6 space-y-6 print:hidden">
          <section className="bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm mb-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              AI Quick-Draft Generator
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Ketik detail tagihan dengan bahasa sehari-hari, lalu biarkan AI mengisi form otomatis.
            </p>
            <textarea
              rows={3}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Contoh: Tagih PT Telkom Akses untuk preventive maintenance 4 site @ 2,5 juta, PPN 11%"
              className="w-full bg-slate-950/90 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleSmartParse}
                disabled={isParsing || !aiPrompt.trim()}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isParsing ? "Memproses Draft..." : "Generate dari Teks"}
              </button>
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Hash className="w-4 h-4 text-indigo-400" />
              Detail Nomor & Tanggal
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">No. Invoice</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Tanggal Terbit</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Jatuh Tempo</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                Pengirim (Bisnis Lo)
              </h3>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Nama Perusahaan"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="Email Bisnis"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={senderAddress}
                onChange={(e) => setSenderAddress(e.target.value)}
                placeholder="Alamat"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                Ditagihkan Kepada (Klien)
              </h3>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nama Klien / PT"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="Email Klien"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="Alamat Klien"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200">Item Pekerjaan / Produk</h2>
              <button
                onClick={addItem}
                className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-indigo-300 px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-2 items-center bg-slate-950/60 p-2.5 rounded-xl border border-slate-800"
                >
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, "description", e.target.value)}
                    placeholder="Deskripsi layanan/item"
                    className="col-span-6 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                  <input
                    type="number"
                    min={1}
                    value={item.qty}
                    onChange={(e) => updateItem(item.id, "qty", Number(e.target.value))}
                    className="col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-center"
                  />
                  <input
                    type="number"
                    min={0}
                    value={item.price}
                    onChange={(e) => updateItem(item.id, "price", Number(e.target.value))}
                    className="col-span-3 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-right"
                  />
                  <button
                    onClick={() => removeItem(item.id)}
                    className="col-span-1 flex justify-center text-slate-500 hover:text-rose-400 cursor-pointer"
                    title="Hapus item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Pajak / PPN (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Catatan & Rekening Pembayaran</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-6 print:w-full">
          <div className="bg-white text-slate-900 rounded-2xl shadow-2xl p-8 sm:p-10 min-h-[720px] flex flex-col justify-between print:shadow-none print:rounded-none print:p-4">
            <div>
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                  <span className="inline-block text-xs font-bold uppercase tracking-widest text-indigo-600 mb-1">
                    INVOICE
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900">{senderName || "Nama Bisnis"}</h2>
                  <p className="text-xs text-slate-500 mt-1">{senderAddress}</p>
                  <p className="text-xs text-slate-500">{senderEmail}</p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">{invoiceNumber}</p>
                  <div className="mt-2 text-xs text-slate-500 space-y-0.5">
                    <p className="flex items-center justify-end gap-1">
                      <Calendar className="w-3 h-3" /> Terbit: {issueDate}
                    </p>
                    <p className="font-medium text-slate-700">Jatuh Tempo: {dueDate}</p>
                  </div>
                </div>
              </div>

              <div className="py-6">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Ditagihkan Kepada:
                </p>
                <p className="text-base font-bold text-slate-900 mt-1">
                  {clientName || "Nama Klien"}
                </p>
                <p className="text-xs text-slate-600">{clientAddress}</p>
                <p className="text-xs text-slate-600">{clientEmail}</p>
              </div>

              <div className="mt-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                      <th className="py-2.5">Deskripsi</th>
                      <th className="py-2.5 text-center w-16">Qty</th>
                      <th className="py-2.5 text-right w-32">Harga</th>
                      <th className="py-2.5 text-right w-36">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-3 pr-2 text-slate-800 font-medium">
                          {item.description || "-"}
                        </td>
                        <td className="py-3 text-center text-slate-600">{item.qty}</td>
                        <td className="py-3 text-right text-slate-600">
                          {formatIDR(item.price)}
                        </td>
                        <td className="py-3 text-right font-semibold text-slate-900">
                          {formatIDR(item.qty * item.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 flex justify-end">
                <div className="w-full sm:w-64 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatIDR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>PPN ({taxRate}%)</span>
                    <span>{formatIDR(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base text-slate-900 border-t-2 border-slate-900 pt-2">
                    <span>Total Tagihan</span>
                    <span className="text-indigo-600">{formatIDR(grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-4 border-t border-slate-200 text-xs text-slate-500">
              <p className="font-semibold text-slate-700 mb-1">Instruksi Pembayaran:</p>
              <p>{notes}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
