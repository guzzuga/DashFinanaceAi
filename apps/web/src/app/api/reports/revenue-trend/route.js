import sql from "@/app/api/utils/sql";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  if (!userId)
    return Response.json({ error: "Missing user_id" }, { status: 400 });

  const rows = sql`
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

  if (rows.length < 2) {
    return Response.json(rows.map(r => ({
      month: r.month,
      income: Number(r.income) || 0,
      expense: Number(r.expense) || 0,
      forecast_income: null,
      forecast_expense: null,
    })));
  }

  const incomeArr = rows.map(r => Number(r.income) || 0);
  const expenseArr = rows.map(r => Number(r.expense) || 0);

  // Simple linear regression for forecast
  function linearRegression(values) {
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumXX += i * i;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) || 0;
    const intercept = (sumY - slope * sumX) / n;
    return { slope, intercept };
  }

  const incReg = linearRegression(incomeArr);
  const expReg = linearRegression(expenseArr);

  const result = rows.map((r) => ({
    month: r.month,
    income: Number(r.income) || 0,
    expense: Number(r.expense) || 0,
    forecast_income: null,
    forecast_expense: null,
  }));

  // Add 3 month forecasts
  const lastMonth = new Date(rows[rows.length - 1].month + "-01");
  for (let i = 1; i <= 3; i++) {
    const forecastDate = new Date(lastMonth);
    forecastDate.setMonth(forecastDate.getMonth() + i);
    const monthStr = forecastDate.toISOString().slice(0, 7);
    const idx = rows.length + i - 1;
    result.push({
      month: monthStr,
      income: null,
      expense: null,
      forecast_income: Math.max(0, Math.round(incReg.slope * idx + incReg.intercept)),
      forecast_expense: Math.max(0, Math.round(expReg.slope * idx + expReg.intercept)),
    });
  }

  return Response.json(result);
}
