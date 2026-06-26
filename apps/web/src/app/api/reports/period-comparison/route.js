import sql from "@/app/api/utils/sql";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  if (!userId)
    return Response.json({ error: "Missing user_id" }, { status: 400 });

  // Current week (Monday to today)
  const currentIncome = sql`
    SELECT SUM(amount) as total FROM transactions 
    WHERE user_id = ${userId} AND type = 'pemasukan' 
    AND date >= date('now', 'weekday 0', '-6 days')
  `;
  const currentExpense = sql`
    SELECT SUM(amount) as total FROM transactions 
    WHERE user_id = ${userId} AND type = 'pengeluaran' 
    AND date >= date('now', 'weekday 0', '-6 days')
  `;
  const currentCount = sql`
    SELECT COUNT(*) as total FROM transactions 
    WHERE user_id = ${userId} 
    AND date >= date('now', 'weekday 0', '-6 days')
  `;

  // Last week (Mon-Sun)
  const lastIncome = sql`
    SELECT SUM(amount) as total FROM transactions 
    WHERE user_id = ${userId} AND type = 'pemasukan' 
    AND date >= date('now', 'weekday 0', '-13 days')
    AND date < date('now', 'weekday 0', '-6 days')
  `;
  const lastExpense = sql`
    SELECT SUM(amount) as total FROM transactions 
    WHERE user_id = ${userId} AND type = 'pengeluaran'
    AND date >= date('now', 'weekday 0', '-13 days')
    AND date < date('now', 'weekday 0', '-6 days')
  `;
  const lastCount = sql`
    SELECT COUNT(*) as total FROM transactions 
    WHERE user_id = ${userId} 
    AND date >= date('now', 'weekday 0', '-13 days')
    AND date < date('now', 'weekday 0', '-6 days')
  `;

  const calcGrowth = (curr, prev) => {
    const c = parseFloat(curr || 0);
    const p = parseFloat(prev || 0);
    if (p === 0 && c === 0) return 0;
    if (p === 0) return 0; // No previous data = no comparison basis
    return Math.round(((c - p) / p) * 100);
  };

  const ci = parseFloat(currentIncome[0].total || 0);
  const ce = parseFloat(currentExpense[0].total || 0);
  const cc = parseFloat(currentCount[0].total || 0);
  const li = parseFloat(lastIncome[0].total || 0);
  const le = parseFloat(lastExpense[0].total || 0);
  const lc = parseFloat(lastCount[0].total || 0);

  return Response.json({
    income_growth: calcGrowth(ci, li),
    expense_growth: calcGrowth(ce, le),
    balance_growth: calcGrowth(ci - ce, li - le),
    count_growth: calcGrowth(cc, lc),
  });
}
