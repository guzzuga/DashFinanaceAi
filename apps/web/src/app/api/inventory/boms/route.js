import sql from "@/app/api/utils/sql";

// GET - List all BOMs or BOM for a specific product
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  const productId = searchParams.get("product_id");

  if (productId) {
    // Get BOM with items for a specific product
    const boms = sql`
      SELECT bom.*, p.name as product_name
      FROM bill_of_materials bom
      JOIN products p ON bom.product_id = p.id
      WHERE bom.product_id = ${productId} AND bom.active = 1
      LIMIT 1
    `;

    if (boms.length === 0) {
      return Response.json(null);
    }

    const bom = boms[0];
    const items = sql`
      SELECT bi.*, m.name as material_name, m.unit as material_unit, 
             m.stock as material_stock, m.price_per_unit as material_price
      FROM bom_items bi
      JOIN materials m ON bi.material_id = m.id
      WHERE bi.bom_id = ${bom.id}
      ORDER BY m.name
    `;

    return Response.json({ ...bom, items });
  }

  // List all BOMs
  let boms;
  if (userId) {
    boms = sql`
      SELECT bom.*, p.name as product_name
      FROM bill_of_materials bom
      JOIN products p ON bom.product_id = p.id
      WHERE bom.user_id = ${userId} AND bom.active = 1
      ORDER BY p.name
    `;
  } else {
    boms = sql`
      SELECT bom.*, p.name as product_name
      FROM bill_of_materials bom
      JOIN products p ON bom.product_id = p.id
      WHERE bom.active = 1
      ORDER BY p.name
    `;
  }

  // Attach items to each BOM
  for (const bom of boms) {
    bom.items = sql`
      SELECT bi.*, m.name as material_name, m.unit as material_unit
      FROM bom_items bi
      JOIN materials m ON bi.material_id = m.id
      WHERE bi.bom_id = ${bom.id}
      ORDER BY m.name
    `;
  }

  return Response.json(boms);
}
