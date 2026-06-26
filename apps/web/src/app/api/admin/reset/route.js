import sql from "@/app/api/utils/sql";

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  const apiKey = searchParams.get("api_key");

  if (apiKey !== "SECRET_KEY") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await sql`DELETE FROM transactions WHERE user_id = ${userId}`;

  return Response.json({ success: true, message: "Data reset successfully" });
}
