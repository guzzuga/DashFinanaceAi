import sql from "@/app/api/utils/sql";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  if (!userId)
    return Response.json({ error: "Missing user_id" }, { status: 400 });

  // Current month data
  const currentRows = sql`
    SELECT 
      SUM(CASE WHEN t.type = 'pemasukan' THEN t.amount ELSE 0 END) as income,
      SUM(CASE WHEN t.type = 'pengeluaran' THEN t.amount ELSE 0 END) as expense
    FROM transactions t
    WHERE t.user_id = ${userId}
    AND t.date >= date('now', 'start of month')
  `;

  // Previous month data
  const prevRows = sql`
    SELECT 
      SUM(CASE WHEN t.type = 'pemasukan' THEN t.amount ELSE 0 END) as income,
      SUM(CASE WHEN t.type = 'pengeluaran' THEN t.amount ELSE 0 END) as expense
    FROM transactions t
    WHERE t.user_id = ${userId}
    AND t.date >= date('now', 'start of month', '-1 month')
    AND t.date < date('now', 'start of month')
  `;

  // Last 6 months for stability
  const stabilityRows = sql`
    SELECT 
      strftime('%Y-%m', t.date) as month,
      SUM(CASE WHEN t.type = 'pemasukan' THEN t.amount ELSE 0 END) as income,
      SUM(CASE WHEN t.type = 'pengeluaran' THEN t.amount ELSE 0 END) as expense
    FROM transactions t
    WHERE t.user_id = ${userId}
    AND t.date >= date('now', '-6 months')
    GROUP BY strftime('%Y-%m', t.date)
    ORDER BY month ASC
  `;

  const current = currentRows[0] || { income: 0, expense: 0 };
  const prev = prevRows[0] || { income: 0, expense: 0 };
  const curIncome = Number(current.income) || 0;
  const curExpense = Number(current.expense) || 0;
  const prevIncome = Number(prev.income) || 0;

  // Margin score (0-100): based on profit margin
  const margin = curIncome > 0 ? ((curIncome - curExpense) / curIncome) * 100 : 0;
  const marginScore = Math.min(100, Math.max(0, margin * 2.5)); // 40% margin = 100 score

  // Growth score (0-100): income growth vs previous month
  let growthScore = 50; // neutral if no previous data
  if (prevIncome > 0) {
    const growthPct = ((curIncome - prevIncome) / prevIncome) * 100;
    growthScore = Math.min(100, Math.max(0, 50 + growthPct * 2));
  } else if (curIncome > 0) {
    growthScore = 70; // new income is positive
  }

  // Stability score (0-100): consistency of income across months
  let stabilityScore = 50;
  if (stabilityRows.length >= 2) {
    const incomes = stabilityRows.map(r => Number(r.income) || 0).filter(v => v > 0);
    if (incomes.length >= 2) {
      const avg = incomes.reduce((a, b) => a + b, 0) / incomes.length;
      const variance = incomes.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / incomes.length;
      const cv = avg > 0 ? Math.sqrt(variance) / avg : 1; // coefficient of variation
      stabilityScore = Math.min(100, Math.max(0, 100 - cv * 100));
    }
  }

  const score = Math.round(marginScore * 0.4 + growthScore * 0.3 + stabilityScore * 0.3);

  return Response.json({
    score,
    factors: {
      margin: Math.round(marginScore),
      growth: Math.round(growthScore),
      stability: Math.round(stabilityScore),
    },
  });
}
