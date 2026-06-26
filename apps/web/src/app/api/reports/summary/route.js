import sql from "@/app/api/utils/sql";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  if (!userId)
    return Response.json({ error: "Missing user_id" }, { status: 400 });

  const stats = sql`
    SELECT 
      COALESCE(SUM(CASE WHEN t.type = 'pemasukan' THEN t.amount ELSE 0 END), 0) as total_income,
      COALESCE(SUM(CASE WHEN t.type = 'pengeluaran' THEN t.amount ELSE 0 END), 0) as total_expense
    FROM transactions t
    WHERE t.user_id = ${userId}
  `;

  const totalIncome = parseFloat(stats[0].total_income);
  const totalExpense = parseFloat(stats[0].total_expense);
  const balance = totalIncome - totalExpense;

  return Response.json({
    total_income: totalIncome,
    total_expense: totalExpense,
    balance: balance,
    currency: "IDR",
  });
}
