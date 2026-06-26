import sql from "@/app/api/utils/sql";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  if (!userId)
    return Response.json({ error: "Missing user_id" }, { status: 400 });

  const balanceRows = sql`
    SELECT 
      SUM(CASE WHEN t.type = 'pemasukan' THEN t.amount ELSE -t.amount END) as balance
    FROM transactions t
    WHERE t.user_id = ${userId}
  `;

  const spendRows = sql`
    SELECT 
      SUM(CASE WHEN t.type = 'pengeluaran' THEN t.amount ELSE 0 END) as total_expense
    FROM transactions t
    WHERE t.user_id = ${userId}
    AND t.date >= date('now', '-30 days')
  `;

  const balance = Number(balanceRows[0]?.balance) || 0;
  const total_expense_30d = Number(spendRows[0]?.total_expense) || 0;
  const daily_spend = Math.round(total_expense_30d / 30);
  const days_remaining = daily_spend > 0 ? Math.floor(balance / daily_spend) : balance > 0 ? 999 : 0;

  return Response.json({
    balance,
    daily_spend,
    days_remaining,
  });
}
