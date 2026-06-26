import sql from "@/app/api/utils/sql";

// GET - List product categories
export async function GET() {
  const categories = sql`SELECT id, name, icon FROM product_categories ORDER BY name`;
  return Response.json(categories);
}

// POST - Create product category
export async function POST(request) {
  const body = await request.json();
  const { name, icon } = body;
  
  if (!name || !name.trim()) {
    return Response.json({ error: "Nama kategori wajib diisi" }, { status: 400 });
  }
  
  const id = crypto.randomUUID();
  try {
    sql`INSERT INTO product_categories (id, name, icon, created_at) VALUES (${id}, ${name.trim()}, ${icon || '📦'}, datetime('now'))`;
    return Response.json({ id, name: name.trim(), icon: icon || '📦' });
  } catch (e) {
    if (e.message?.includes('UNIQUE')) {
      return Response.json({ error: "Kategori sudah ada" }, { status: 400 });
    }
    throw e;
  }
}

// DELETE - Delete product category
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  
  if (!id) {
    return Response.json({ error: "ID wajib diisi" }, { status: 400 });
  }
  
  sql`DELETE FROM product_categories WHERE id = ${id}`;
  return Response.json({ message: "Kategori dihapus" });
}
