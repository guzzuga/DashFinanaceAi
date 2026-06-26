import sql from "@/app/api/utils/sql";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  if (!userId)
    return Response.json({ error: "Missing user_id" }, { status: 400 });

  const cashFlow = sql`
    SELECT 
      date(t.date) as day,
      SUM(CASE WHEN t.type = 'pemasukan' THEN t.amount ELSE 0 END) as income,
      SUM(CASE WHEN t.type = 'pengeluaran' THEN t.amount ELSE 0 END) as expense
    FROM transactions t
    WHERE t.user_id = ${userId}
    AND t.date >= date('now', '-30 days')
    GROUP BY date(t.date)
    ORDER BY day ASC
  `;

  return Response.json(cashFlow);
}
