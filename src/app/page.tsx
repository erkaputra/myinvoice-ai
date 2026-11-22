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
  Globe,
  Coins,
} from "lucide-react";

interface InvoiceItem {
  id: string;
  description: string;
  qty: number;
  price: number;
}

const CURRENCY_OPTIONS = [
  { code: "IDR", label: "IDR (Rp)", locale: "id-ID", symbol: "Rp" },
  { code: "USD", label: "USD ($)", locale: "en-US", symbol: "$" },
  { code: "SGD", label: "SGD (S$)", locale: "en-SG", symbol: "S$" },
  { code: "EUR", label: "EUR (€)", locale: "de-DE", symbol: "€" },
  { code: "GBP", label: "GBP (£)", locale: "en-GB", symbol: "£" },
  { code: "MYR", label: "MYR (RM)", locale: "ms-MY", symbol: "RM" },
];

const LABELS = {
  id: {
    invoice: "INVOICE",
    issued: "Terbit",
    due: "Jatuh Tempo",
    billTo: "Ditagihkan Kepada:",
    desc: "Deskripsi",
    qty: "Qty",
    price: "Harga",
    total: "Total",
    subtotal: "Subtotal",
    tax: "PPN",
    grandTotal: "Total Tagihan",
    paymentNotes: "Instruksi Pembayaran:",
  },
  en: {
    invoice: "INVOICE",
    issued: "Issued",
    due: "Due Date",
    billTo: "Bill To:",
    desc: "Description",
    qty: "Qty",
    price: "Unit Price",
    total: "Amount",
    subtotal: "Subtotal",
    tax: "Tax / VAT",
    grandTotal: "Total Due",
    paymentNotes: "Payment Instructions:",
  },
};

export default function MyInvoiceAI() {
  const [aiPrompt, setAiPrompt] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [aiError, setAiError] = useState("");

  const [lang, setLang] = useState<"id" | "en">("id");
  const [currency, setCurrency] = useState("IDR");

  const [invoiceNumber, setInvoiceNumber] = useState("INV-2026-001");
  const [issueDate, setIssueDate] = useState("2026-11-22");
  const [dueDate, setDueDate] = useState("2026-11-29");

  const [senderName, setSenderName] = useState("CV Dua Putra Sejahtera");
  const [senderEmail, setSenderEmail] = useState("sejahteraduaputra88@gmail.com");
  const [senderAddress, setSenderAddress] = useState("Banten, Indonesia");

  const [clientName, setClientName] = useState("Capt. Kapal");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("Banten, Indonesia");

  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState(
    "Pembayaran melalui transfer rekening resmi perusahaan. Terima kasih atas kerja samanya."
  );

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: "1",
      description: "Crew Medical Check-Up Service",
      qty: 1,
      price: 600,
    },
  ]);

  const t = LABELS[lang];
  const activeCurrency =
    CURRENCY_OPTIONS.find((c) => c.code === currency) || CURRENCY_OPTIONS[0];

  const formatMoney = (amount: number) => {
    const isZeroDecimal = currency === "IDR";
    return new Intl.NumberFormat(activeCurrency.locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: isZeroDecimal ? 0 : 2,
      maximumFractionDigits: isZeroDecimal ? 0 : 2,
    }).format(amount);
  };

  const handleSmartParse = async () => {
    if (!aiPrompt.trim()) return;
    setIsParsing(true);
    setAiError("");

    try {
      const res = await fetch("/api/parse-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses AI");
      }

      if (data.language === "en" || data.language === "id") {
        setLang(data.language);
      }
      if (data.currency) {
        const upperCurrency = String(data.currency).toUpperCase();
        setCurrency(upperCurrency);
      }
      if (data.clientName) {
        setClientName(data.clientName);
      }
      if (data.clientAddress) {
        setClientAddress(data.clientAddress);
      }
      if (typeof data.taxRate === "number") {
        setTaxRate(data.taxRate);
      }
      if (data.notes) {
        setNotes(data.notes);
      }
      if (Array.isArray(data.items) && data.items.length > 0) {
        setItems(
          data.items.map(
            (item: { description: string; qty: number; price: number }, idx: number) => ({
              id: `${Date.now()}-${idx}`,
              description: item.description,
              qty: item.qty || 1,
              price: item.price || 0,
            })
          )
        );
      }
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsParsing(false);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), description: "", qty: 1, price: 0 },
    ]);
  };

  const updateItem = (
    id: string,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
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
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                AI Quick-Draft Generator (Gemini Powered)
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                  <Globe className="w-3 h-3 text-indigo-400" /> {lang.toUpperCase()}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] bg-slate-800 px-2 py-0.5 rounded text-emerald-300">
                  <Coins className="w-3 h-3" /> {currency}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Ketik detail tagihan dalam bahasa Indonesia atau Inggris. AI otomatis mendeteksi mata uang, pajak, item, dan bahasa invoice.
            </p>
            <textarea
              rows={3}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Contoh: Tagih Capt. kapal untuk medical check up 1 orang @ $600, no ppn. buat in english"
              className="w-full bg-slate-950/90 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {aiError && (
              <p className="mt-2 text-xs text-rose-400 bg-rose-950/50 border border-rose-800/60 rounded-lg px-3 py-2">
                {aiError}
              </p>
            )}
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleSmartParse}
                disabled={isParsing || !aiPrompt.trim()}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isParsing ? "AI Sedang Meracik..." : "Generate dari Teks"}
              </button>
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Hash className="w-4 h-4 text-indigo-400" />
                Detail Nomor, Tanggal & Mata Uang
              </h2>
              <div className="flex flex-wrap gap-2">
                <select
                  aria-label="Pilih Bahasa Invoice"
                  value={lang}
                  onChange={(e) => setLang(e.target.value as "id" | "en")}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="id">Bahasa: ID</option>
                  <option value="en">Language: EN</option>
                </select>
                <select
                  aria-label="Pilih Mata Uang"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-slate-950 border border-indigo-500/50 rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-300"
                >
                  {CURRENCY_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.label}
                    </option>
                  ))}
                  {!CURRENCY_OPTIONS.some((opt) => opt.code === currency) && (
                    <option value={currency}>{currency}</option>
                  )}
                </select>
              </div>
            </div>
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
              <h2 className="text-sm font-semibold text-slate-200">
                Item Pekerjaan / Produk ({currency})
              </h2>
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
                    step="any"
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
                    {t.invoice}
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900">{senderName || "Company Name"}</h2>
                  <p className="text-xs text-slate-500 mt-1">{senderAddress}</p>
                  <p className="text-xs text-slate-500">{senderEmail}</p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">{invoiceNumber}</p>
                  <div className="mt-2 text-xs text-slate-500 space-y-0.5">
                    <p className="flex items-center justify-end gap-1">
                      <Calendar className="w-3 h-3" /> {t.issued}: {issueDate}
                    </p>
                    <p className="font-medium text-slate-700">{t.due}: {dueDate}</p>
                  </div>
                </div>
              </div>

              <div className="py-6">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {t.billTo}
                </p>
                <p className="text-base font-bold text-slate-900 mt-1">
                  {clientName || "Client Name"}
                </p>
                <p className="text-xs text-slate-600">{clientAddress}</p>
                <p className="text-xs text-slate-600">{clientEmail}</p>
              </div>

              <div className="mt-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                      <th className="py-2.5">{t.desc}</th>
                      <th className="py-2.5 text-center w-16">{t.qty}</th>
                      <th className="py-2.5 text-right w-32">{t.price}</th>
                      <th className="py-2.5 text-right w-36">{t.total}</th>
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
                          {formatMoney(item.price)}
                        </td>
                        <td className="py-3 text-right font-semibold text-slate-900">
                          {formatMoney(item.qty * item.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 flex justify-end">
                <div className="w-full sm:w-64 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>{t.subtotal}</span>
                    <span>{formatMoney(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>{t.tax} ({taxRate}%)</span>
                    <span>{formatMoney(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base text-slate-900 border-t-2 border-slate-900 pt-2">
                    <span>{t.grandTotal}</span>
                    <span className="text-indigo-600">{formatMoney(grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-4 border-t border-slate-200 text-xs text-slate-500">
              <p className="font-semibold text-slate-700 mb-1">{t.paymentNotes}</p>
              <p>{notes}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
