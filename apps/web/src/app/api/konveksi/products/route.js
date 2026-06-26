import sql from "@/app/api/utils/sql";

// GET - List all products
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  let products;
  if (userId) {
    products = sql`SELECT * FROM products WHERE active = 1 AND (user_id = ${userId} OR user_id IS NULL) ORDER BY name`;
  } else {
    products = sql`SELECT * FROM products WHERE active = 1 ORDER BY name`;
  }

  return Response.json(products);
}

// POST - Create product
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, sku, category, hpp, price, stock, unit, min_stock, notes, user_id } = body;

    if (!name) return Response.json({ error: "Name required" }, { status: 400 });

    const id = crypto.randomUUID();
    sql`
      INSERT INTO products (id, name, sku, category, hpp, price, stock, unit, min_stock, notes, user_id, active, created_at, updated_at)
      VALUES (${id}, ${name}, ${sku || null}, ${category || null}, ${hpp || 0}, ${price || 0}, ${stock || 0}, ${unit || "pcs"}, ${min_stock || 0}, ${notes || null}, ${user_id || null}, 1, datetime('now'), datetime('now'))
    `;

    const product = sql`SELECT * FROM products WHERE id = ${id}`;
    return Response.json(product[0], { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// PUT - Update product
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, sku, category, hpp, price, stock, unit, min_stock, notes, active } = body;
    if (!id) return Response.json({ error: "ID required" }, { status: 400 });

    sql`
      UPDATE products SET 
        name = COALESCE(${name || null}, name),
        sku = COALESCE(${sku || null}, sku),
        category = COALESCE(${category || null}, category),
        hpp = COALESCE(${hpp ?? null}, hpp),
        price = COALESCE(${price ?? null}, price),
        stock = COALESCE(${stock ?? null}, stock),
        unit = COALESCE(${unit || null}, unit),
        min_stock = COALESCE(${min_stock ?? null}, min_stock),
        notes = COALESCE(${notes || null}, notes),
        active = COALESCE(${active ?? null}, active),
        updated_at = datetime('now')
      WHERE id = ${id}
    `;

    const product = sql`SELECT * FROM products WHERE id = ${id}`;
    return Response.json(product[0]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
