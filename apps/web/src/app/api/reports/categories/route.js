import sql from "@/app/api/utils/sql";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  if (!userId)
    return Response.json({ error: "Missing user_id" }, { status: 400 });

  const categories = sql`
    SELECT c.name as category, SUM(t.amount) as total, t.type
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ${userId}
    GROUP BY c.name, t.type
    ORDER BY total DESC
  `;

  return Response.json(categories);
}
