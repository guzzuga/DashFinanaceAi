import sql from "@/app/api/utils/sql";

// GET - Stock card (kartu stok) for a material
export async function GET(request, { params }) {
  const { materialId } = await params;
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");

  // Get material info
  const materials = sql`SELECT * FROM materials WHERE id = ${materialId}`;
  if (materials.length === 0) {
    return Response.json({ error: "Material not found" }, { status: 404 });
  }
  const material = materials[0];

  // Get movements
  let movements;
  if (startDate && endDate) {
    movements = sql`
      SELECT sm.*, mb.batch_code
      FROM stock_movements sm
      LEFT JOIN material_batches mb ON sm.batch_id = mb.id
      WHERE sm.material_id = ${materialId} AND sm.date >= ${startDate} AND sm.date <= ${endDate}
      ORDER BY sm.date ASC, sm.created_at ASC
    `;
  } else {
    movements = sql`
      SELECT sm.*, mb.batch_code
      FROM stock_movements sm
      LEFT JOIN material_batches mb ON sm.batch_id = mb.id
      WHERE sm.material_id = ${materialId}
      ORDER BY sm.date ASC, sm.created_at ASC
    `;
  }

  // Calculate opening stock
  let openingStock = 0;
  if (startDate) {
    const prev = sql`
      SELECT COALESCE(SUM(quantity), 0) as total
      FROM stock_movements
      WHERE material_id = ${materialId} AND date < ${startDate}
    `;
    openingStock = prev[0]?.total || 0;
  }

  // Calculate totals
  const totalIn = movements.filter(m => m.quantity > 0).reduce((s, m) => s + m.quantity, 0);
  const totalOut = movements.filter(m => m.quantity < 0).reduce((s, m) => s + Math.abs(m.quantity), 0);
  const closingStock = openingStock + totalIn - totalOut;

  // Get inventory value from batches
  const batchData = sql`
    SELECT COALESCE(SUM(remaining_quantity * cost_per_unit), 0) as total_value
    FROM material_batches
    WHERE material_id = ${materialId} AND active = 1 AND remaining_quantity > 0
  `;
  const inventoryValue = batchData[0]?.total_value || 0;

  return Response.json({
    material: {
      id: material.id,
      name: material.name,
      unit: material.unit,
      current_stock: material.stock,
      fabric_type: material.fabric_type,
      default_color: material.default_color,
    },
    opening_stock: openingStock,
    movements: movements.map(m => ({
      id: m.id,
      date: m.date,
      type: m.movement_type,
      quantity: m.quantity,
      unit: m.unit,
      cost_per_unit: m.cost_per_unit,
      total_value: m.total_value,
      balance_after: m.balance_after,
      batch_code: m.batch_code,
      notes: m.notes,
      source: m.source,
    })),
    total_in: totalIn,
    total_out: totalOut,
    closing_stock: closingStock,
    inventory_value: inventoryValue,
  });
}
