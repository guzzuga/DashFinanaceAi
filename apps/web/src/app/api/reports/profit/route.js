import sql from "@/app/api/utils/sql";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  if (!userId)
    return Response.json({ error: "Missing user_id" }, { status: 400 });

  const profit = sql`
    SELECT 
      strftime('%Y-%m-01', t.date) as month,
      SUM(CASE WHEN t.type = 'pemasukan' THEN t.amount ELSE -t.amount END) as profit
    FROM transactions t
    WHERE t.user_id = ${userId}
    GROUP BY strftime('%Y-%m-01', t.date)
    ORDER BY month ASC
  `;

  return Response.json(profit);
}
