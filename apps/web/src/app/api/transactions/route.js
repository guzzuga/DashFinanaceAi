import sql from "@/app/api/utils/sql";
import { randomUUID } from "crypto";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  if (!userId)
    return Response.json({ error: "Missing user_id" }, { status: 400 });

  const transactions = sql`
    SELECT t.id, t.type, c.name as category, t.amount, t.note, t.date 
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ${userId} 
    ORDER BY t.date DESC
  `;

  return Response.json(transactions);
}

export async function POST(request) {
  const { user_id, type, amount, note, category } = await request.json();

  if (!user_id || !type || !amount || !note) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Find or create category
  let catRows = sql`SELECT id FROM categories WHERE name = ${category} AND (user_id = ${user_id} OR user_id IS NULL) LIMIT 1`;
  let categoryId;
  
  if (catRows.length > 0) {
    categoryId = catRows[0].id;
  } else {
    categoryId = randomUUID();
    sql`INSERT INTO categories (id, name, type, user_id, created_at) VALUES (${categoryId}, ${category}, ${type}, ${user_id}, datetime('now'))`;
  }

  const txId = randomUUID();
  const date = new Date().toISOString().split('T')[0];
  
  sql`INSERT INTO transactions (id, user_id, date, type, category_id, amount, note, source, created_at, updated_at) 
      VALUES (${txId}, ${user_id}, ${date}, ${type}, ${categoryId}, ${amount}, ${note}, 'web', datetime('now'), datetime('now'))`;

  // Non-blocking Google Sheets sync (fire-and-forget)
  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
  fetch(`${backendUrl}/api/google-sheets/append`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tanggal: date,
      jenis: type,  // already "pemasukan" or "pengeluaran"
      kategori: category,
      nominal: parseInt(amount, 10),
      catatan: note,
      sumber: "web",
    }),
  })
    .then((res) => {
      if (!res.ok) {
        console.error("[SheetsSync] Non-OK response:", res.status);
      } else {
        console.log("[SheetsSync] Synced to Google Sheets:", type, category);
      }
    })
    .catch((err) => {
      // Non-blocking — log but don't fail the transaction
      console.error("[SheetsSync] Failed to sync to Google Sheets:", err.message);
    });

  return Response.json({ success: true, id: txId });
}

export async function PUT(request) {
  const { id, type, amount, note, category } = await request.json();

  if (!id) {
    return Response.json({ error: "Missing transaction id" }, { status: 400 });
  }

  // Find category
  let catRows = sql`SELECT id FROM categories WHERE name = ${category} AND (user_id = (SELECT user_id FROM transactions WHERE id = ${id}) OR user_id IS NULL) LIMIT 1`;
  let categoryId = catRows.length > 0 ? catRows[0].id : null;

  sql`UPDATE transactions SET type = ${type}, amount = ${amount}, note = ${note}, category_id = ${categoryId}, updated_at = datetime('now') WHERE id = ${id}`;

  return Response.json({ success: true });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Missing transaction id" }, { status: 400 });
  }

  sql`DELETE FROM transactions WHERE id = ${id}`;

  return Response.json({ success: true });
}
