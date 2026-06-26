import sql from "@/app/api/utils/sql";

// GET - Inventory dashboard data
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  // Total materials
  const materials = sql`
    SELECT m.*, 
      (SELECT COUNT(*) FROM material_batches mb WHERE mb.material_id = m.id AND mb.active = 1 AND mb.remaining_quantity > 0) as batch_count,
      (SELECT COALESCE(SUM(mb.remaining_quantity * mb.cost_per_unit), 0) FROM material_batches mb WHERE mb.material_id = m.id AND mb.active = 1) as inventory_value
    FROM materials m
    WHERE m.active = 1 AND (m.user_id = ${userId} OR m.user_id IS NULL)
    ORDER BY m.name
  `;

  // Low stock materials
  const lowStock = materials.filter(m => m.min_stock > 0 && m.stock <= m.min_stock);

  // Products with BOM and producible quantity
  const products = sql`
    SELECT p.*,
      (SELECT bom.id FROM bill_of_materials bom WHERE bom.product_id = p.id AND bom.active = 1 LIMIT 1) as bom_id
    FROM products p
    WHERE p.active = 1 AND (p.user_id = ${userId} OR p.user_id IS NULL)
    ORDER BY p.name
  `;

  // Calculate max producible for each product
  const productEstimates = [];
  const productsWithoutBom = [];

  for (const product of products) {
    if (!product.bom_id) {
      productsWithoutBom.push({ id: product.id, name: product.name });
      continue;
    }

    // Get BOM items
    const bomItems = sql`
      SELECT bi.quantity_per_unit, m.stock as available, m.name as material_name, m.unit as material_unit
      FROM bom_items bi
      JOIN materials m ON bi.material_id = m.id
      WHERE bi.bom_id = ${product.bom_id}
    `;

    let maxProducible = 999999;
    for (const item of bomItems) {
      if (item.quantity_per_unit > 0) {
        const canMake = Math.floor(item.available / item.quantity_per_unit);
        maxProducible = Math.min(maxProducible, canMake);
      }
    }
    if (maxProducible === 999999) maxProducible = 0;

    productEstimates.push({
      id: product.id,
      name: product.name,
      current_stock: product.stock,
      max_producible: maxProducible,
      has_bom: true,
    });
  }

  const totalValue = materials.reduce((s, m) => s + (m.inventory_value || 0), 0);
  const totalBatches = materials.reduce((s, m) => s + (m.batch_count || 0), 0);

  return Response.json({
    total_materials: materials.length,
    total_batches: totalBatches,
    total_inventory_value: totalValue,
    low_stock_count: lowStock.length,
    low_stock_materials: lowStock.map(m => ({
      id: m.id,
      name: m.name,
      stock: m.stock,
      min_stock: m.min_stock,
      unit: m.unit,
      deficit: m.min_stock - m.stock,
    })),
    materials: materials.map(m => ({
      id: m.id,
      name: m.name,
      unit: m.unit,
      stock: m.stock,
      min_stock: m.min_stock,
      fabric_type: m.fabric_type,
      default_color: m.default_color,
      batch_count: m.batch_count,
      inventory_value: m.inventory_value,
      low_stock: m.min_stock > 0 && m.stock <= m.min_stock,
    })),
    product_estimates: productEstimates,
    products_without_bom: productsWithoutBom,
  });
}
