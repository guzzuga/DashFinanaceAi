import sql from "@/app/api/utils/sql";
import { randomUUID } from "crypto";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId)
    return Response.json({ error: "Missing user_id" }, { status: 400 });

  const categories = sql`
    SELECT id, name, type, icon, created_at
    FROM categories 
    WHERE user_id = ${userId} OR user_id IS NULL
    ORDER BY type ASC, name ASC
  `;

  return Response.json(categories);
}

export async function POST(request) {
  const { user_id, name, type } = await request.json();

  if (!user_id || !name || !type) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const id = randomUUID();
  sql`INSERT INTO categories (id, name, type, user_id, created_at) VALUES (${id}, ${name}, ${type}, ${user_id}, datetime('now'))`;

  return Response.json({ success: true, id });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Missing category id" }, { status: 400 });
  }

  sql`DELETE FROM categories WHERE id = ${id}`;

  return Response.json({ success: true });
}
