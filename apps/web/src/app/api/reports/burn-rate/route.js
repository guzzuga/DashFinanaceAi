import sql from "@/app/api/utils/sql";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  if (!userId)
    return Response.json({ error: "Missing user_id" }, { status: 400 });

  const rows = sql`
    SELECT 
      SUM(CASE WHEN t.type = 'pengeluaran' THEN t.amount ELSE 0 END) as total_expense,
      SUM(CASE WHEN t.type = 'pemasukan' THEN t.amount ELSE 0 END) as total_income,
      MIN(t.date) as first_date,
      MAX(t.date) as last_date
    FROM transactions t
    WHERE t.user_id = ${userId}
    AND t.date >= date('now', '-30 days')
  `;

  const row = rows[0] || {};
  const total_expense = Number(row.total_expense) || 0;
  const total_income = Number(row.total_income) || 0;
  const daily_avg = Math.round(total_expense / 30);
  const monthly_burn = total_expense;
  const income_monthly = total_income;
  const ratio_pct = total_income > 0 ? Math.round((total_expense / total_income) * 100) : 0;

  return Response.json({
    daily_avg,
    monthly_burn,
    income_monthly,
    ratio_pct,
  });
}
