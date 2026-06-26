import sql from "@/app/api/utils/sql";

// GET - List all batches for a material or all batches
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  const materialId = searchParams.get("material_id");

  let batches;
  if (materialId) {
    batches = sql`
      SELECT mb.*, m.name as material_name, m.unit as material_unit
      FROM material_batches mb
      JOIN materials m ON mb.material_id = m.id
      WHERE mb.material_id = ${materialId} AND mb.active = 1 AND mb.remaining_quantity > 0
      ORDER BY mb.received_date ASC
    `;
  } else if (userId) {
    batches = sql`
      SELECT mb.*, m.name as material_name, m.unit as material_unit
      FROM material_batches mb
      JOIN materials m ON mb.material_id = m.id
      WHERE mb.user_id = ${userId} AND mb.active = 1 AND mb.remaining_quantity > 0
      ORDER BY m.name, mb.received_date ASC
    `;
  } else {
    batches = sql`
      SELECT mb.*, m.name as material_name, m.unit as material_unit
      FROM material_batches mb
      JOIN materials m ON mb.material_id = m.id
      WHERE mb.active = 1 AND mb.remaining_quantity > 0
      ORDER BY m.name, mb.received_date ASC
    `;
  }

  return Response.json(batches);
}
