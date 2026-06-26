import sql from "@/app/api/utils/sql";

// GET - List all materials
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  let materials;
  if (userId) {
    materials = sql`SELECT * FROM materials WHERE active = 1 AND (user_id = ${userId} OR user_id IS NULL) ORDER BY name`;
  } else {
    materials = sql`SELECT * FROM materials WHERE active = 1 ORDER BY name`;
  }

  return Response.json(materials);
}

// POST - Create material
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, unit, stock, price_per_unit, min_stock, supplier, notes, user_id } = body;

    if (!name) return Response.json({ error: "Name required" }, { status: 400 });

    const id = crypto.randomUUID();
    sql`
      INSERT INTO materials (id, name, unit, stock, price_per_unit, min_stock, supplier, notes, user_id, active, created_at, updated_at)
      VALUES (${id}, ${name}, ${unit || "meter"}, ${stock || 0}, ${price_per_unit || 0}, ${min_stock || 0}, ${supplier || null}, ${notes || null}, ${user_id || null}, 1, datetime('now'), datetime('now'))
    `;

    const material = sql`SELECT * FROM materials WHERE id = ${id}`;
    return Response.json(material[0], { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
