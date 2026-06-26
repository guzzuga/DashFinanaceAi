import sql from "@/app/api/utils/sql";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  if (!userId)
    return Response.json({ error: "Missing user_id" }, { status: 400 });

  const count = sql`
    SELECT COUNT(*) as total FROM transactions WHERE user_id = ${userId}
  `;

  return Response.json({
    total_transactions: parseInt(count[0].total),
    trend: "+12% dari bulan lalu",
  });
}
