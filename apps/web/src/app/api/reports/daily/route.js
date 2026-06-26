import sql from "@/app/api/utils/sql";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!userId)
    return Response.json({ error: "Missing user_id" }, { status: 400 });

  let daily;
  if (from && to) {
    daily = sql`
      SELECT 
        date(t.date) as date,
        SUM(CASE WHEN t.type = 'pemasukan' THEN t.amount ELSE 0 END) as income,
        SUM(CASE WHEN t.type = 'pengeluaran' THEN t.amount ELSE 0 END) as expense
      FROM transactions t
      WHERE t.user_id = ${userId} AND t.date >= ${from} AND t.date <= ${to}
      GROUP BY date(t.date)
      ORDER BY date DESC
    `;
  } else {
    daily = sql`
      SELECT 
        date(t.date) as date,
        SUM(CASE WHEN t.type = 'pemasukan' THEN t.amount ELSE 0 END) as income,
        SUM(CASE WHEN t.type = 'pengeluaran' THEN t.amount ELSE 0 END) as expense
      FROM transactions t
      WHERE t.user_id = ${userId}
      GROUP BY date(t.date)
      ORDER BY date DESC
    `;
  }

  return Response.json(daily);
}
