import sql from "@/app/api/utils/sql";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  if (!userId)
    return Response.json({ error: "Missing user_id" }, { status: 400 });

  const recentExpenses = sql`
    SELECT SUM(amount) as total FROM transactions 
    WHERE user_id = ${userId} AND type = 'pengeluaran' AND date >= date('now', '-30 days')
  `;

  const totalExpense = parseFloat(recentExpenses[0].total || 0);

  let insight =
    "Berdasarkan data 30 hari terakhir, performa keuangan Anda stabil.";
  let action = "Lihat Detail";

  if (totalExpense > 1000000) {
    insight =
      "Pengeluaran operasional Anda meningkat cukup signifikan bulan ini. Cek rincian bahan baku.";
    action = "Review Operasional";
  }

  return Response.json({ insight, action });
}
