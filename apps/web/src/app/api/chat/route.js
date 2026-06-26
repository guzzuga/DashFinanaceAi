import sql from "@/app/api/utils/sql";

export async function POST(request) {
  const { text, user_id } = await request.json();

  if (!text || !user_id) {
    return Response.json({ error: "Missing text or user_id" }, { status: 400 });
  }

  // Get current summary for context
  const stats = sql`
    SELECT 
      COALESCE(SUM(CASE WHEN type = 'pemasukan' THEN amount ELSE 0 END), 0) as total_income,
      COALESCE(SUM(CASE WHEN type = 'pengeluaran' THEN amount ELSE 0 END), 0) as total_expense
    FROM transactions 
    WHERE user_id = ${user_id}
  `;

  const totalIncome = parseFloat(stats[0].total_income);
  const totalExpense = parseFloat(stats[0].total_expense);
  const balance = totalIncome - totalExpense;

  // Get recent transactions for context
  const recent = sql`
    SELECT type, amount, note, date 
    FROM transactions 
    WHERE user_id = ${user_id} 
    ORDER BY date DESC LIMIT 5
  `;

  const recentText = recent.map(t => `- ${t.date}: ${t.type} Rp ${t.amount.toLocaleString("id-ID")} (${t.note})`).join("\n");

  const systemPrompt = `Kamu adalah FinanceAI, konsultan keuangan profesional untuk bisnis garment.

TUGAS: Berikan INSIGHT dan SARAN berdasarkan data keuangan, BUKAN mengulang data yang sudah ada.

Data Keuangan (sudah ditampilkan di dashboard, JANGAN diulang):
- Pemasukan: Rp ${totalIncome.toLocaleString("id-ID")}
- Pengeluaran: Rp ${totalExpense.toLocaleString("id-ID")}
- Saldo: Rp ${balance.toLocaleString("id-ID")}

Transaksi Terakhir:
${recentText || "Belum ada transaksi"}

FORMAT RESPONS (WAJIB IKUTI):

INSIGHT UTAMA
[Tulis 2-3 insight penting dari data. Setiap insight dalam paragraf terpisah]

SARAN DAN REKOMENDASI
1. [Saran pertama - jelas dan actionable]
2. [Saran kedua - jelas dan actionable]
3. [Saran ketiga jika ada]

ACTION ITEMS
- [Langkah konkret yang bisa dilakukan hari ini]
- [Langkah konkret untuk minggu ini]

ATURAN FORMAT:
- JANGAN gunakan emoji atau simbol apapun
- JANGAN gunakan tanda petik atau tanda baca berlebihan
- Gunakan ENTER untuk memisahkan paragraf
- Setiap poin = paragraf terpisah
- Spesifik dengan angka, tapi jelaskan maknanya
- Bahasa Indonesia profesional, singkat, padat
- Gunakan huruf kapital untuk judul section (INSIGHT UTAMA, SARAN DAN REKOMENDASI, ACTION ITEMS)

Jawab dalam bahasa Indonesia. Profesional, terstruktur, mudah dibaca.`;

  try {
    // BluesMinds API with glm-4.6
    const BLUESMINDS_API_KEY = process.env.BLUESMINDS_API_KEY || "sk-dHG4iWla2AaTJsZuDs8peAy1osykZeLqQxqieDCzlY8oOcvl";
    const BLUESMINDS_BASE_URL = process.env.BLUESMINDS_BASE_URL || "https://api.bluesminds.com/v1";

    const aiResponse = await fetch(`${BLUESMINDS_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${BLUESMINDS_API_KEY}`,
      },
      body: JSON.stringify({
        model: "glm-4.6",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!aiResponse.ok) {
      const err = await aiResponse.text();
      console.error("BluesMinds API error:", err);
      throw new Error("BluesMinds API failed");
    }

    const data = await aiResponse.json();
    let content = data.choices[0].message.content;

    // Clean up any remaining emojis or special symbols
    content = content.replace(/[\u{1F300}-\u{1F9FF}]/gu, ''); // Remove emojis
    content = content.replace(/[━]+/g, '─'); // Replace heavy lines with simple lines
    content = content.replace(/[""]/g, ''); // Remove curly quotes
    content = content.replace(/['']/g, ''); // Remove curly apostrophes

    return Response.json({ response: content });
  } catch (error) {
    console.error("Chat error:", error);
    return Response.json({ error: "Gagal memproses chat. Coba lagi." }, { status: 500 });
  }
}
