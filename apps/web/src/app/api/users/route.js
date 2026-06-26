import sql from "@/app/api/utils/sql";

export async function GET() {
  const users = sql`SELECT id, platform, name FROM users ORDER BY created_at ASC`;
  return Response.json(users);
}
