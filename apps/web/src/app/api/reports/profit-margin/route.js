import sql from "@/app/api/utils/sql";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  if (!userId)
    return Response.json({ error: "Missing user_id" }, { status: 400 });

  const rows = sql`
    SELECT 
      SUM(CASE WHEN t.type = 'pemasukan' THEN t.amount ELSE 0 END) as income,
      SUM(CASE WHEN t.type = 'pengeluaran' THEN t.amount ELSE 0 END) as expense
    FROM transactions t
    WHERE t.user_id = ${userId}
    AND t.date >= date('now', '-30 days')
  `;

  const row = rows[0] || { income: 0, expense: 0 };
  const income = Number(row.income) || 0;
  const expense = Number(row.expense) || 0;
  const margin_pct = income > 0 ? ((income - expense) / income) * 100 : 0;
  const status = margin_pct > 20 ? "sehat" : margin_pct > 10 ? "cukup" : "kritis";

  return Response.json({
    margin_pct: Math.round(margin_pct * 100) / 100,
    income,
    expense,
    status,
  });
}
