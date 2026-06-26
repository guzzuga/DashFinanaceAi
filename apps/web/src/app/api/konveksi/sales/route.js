import sql from "@/app/api/utils/sql";

// GET - List sales with filters
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const marketplaceId = searchParams.get("marketplace_id");
  const limit = parseInt(searchParams.get("limit") || "50");

  let sales;
  if (userId && startDate && endDate) {
    sales = sql`
      SELECT s.*, p.name as product_name, m.name as marketplace_name, m.icon as marketplace_icon
      FROM sales s LEFT JOIN products p ON s.product_id = p.id LEFT JOIN marketplaces m ON s.marketplace_id = m.id
      WHERE s.user_id = ${userId} AND s.date >= ${startDate} AND s.date <= ${endDate}
      ORDER BY s.date DESC, s.created_at DESC LIMIT ${limit}
    `;
  } else if (userId) {
    sales = sql`
      SELECT s.*, p.name as product_name, m.name as marketplace_name, m.icon as marketplace_icon
      FROM sales s LEFT JOIN products p ON s.product_id = p.id LEFT JOIN marketplaces m ON s.marketplace_id = m.id
      WHERE s.user_id = ${userId}
      ORDER BY s.date DESC, s.created_at DESC LIMIT ${limit}
    `;
  } else {
    sales = sql`
      SELECT s.*, p.name as product_name, m.name as marketplace_name, m.icon as marketplace_icon
      FROM sales s LEFT JOIN products p ON s.product_id = p.id LEFT JOIN marketplaces m ON s.marketplace_id = m.id
      ORDER BY s.date DESC, s.created_at DESC LIMIT ${limit}
    `;
  }

  return Response.json(sales);
}

// POST - Create sale
export async function POST(request) {
  try {
    const body = await request.json();
    const { user_id, product_id, marketplace_id, date, quantity, price_per_unit, hpp_per_unit, shipping_cost, discount, order_id, notes } = body;

    if (!user_id || !product_id || !marketplace_id || !date) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get marketplace fee
    const mp = sql`SELECT * FROM marketplaces WHERE id = ${marketplace_id}`;
    const feePercent = mp[0]?.fee_percent || 0;
    const feeFixed = mp[0]?.fee_fixed || 0;
    const settlementDays = mp[0]?.settlement_days || 0;

    const qty = quantity || 1;
    const ppu = price_per_unit || 0;
    const hpp = hpp_per_unit || 0;
    const ship = shipping_cost || 0;
    const disc = discount || 0;

    const totalRevenue = qty * ppu;
    const totalHpp = qty * hpp;
    const marketplaceFee = Math.floor(totalRevenue * feePercent / 100) + feeFixed;
    const netRevenue = totalRevenue - marketplaceFee - ship - disc;
    const profit = netRevenue - totalHpp;

    // Settlement date
    let settlementDate = null;
    if (settlementDays > 0) {
      const d = new Date(date);
      d.setDate(d.getDate() + settlementDays);
      settlementDate = d.toISOString().split('T')[0];
    }

    const id = crypto.randomUUID();
    sql`
      INSERT INTO sales (id, user_id, product_id, marketplace_id, date, quantity, price_per_unit, total_revenue, hpp_per_unit, total_hpp, marketplace_fee, shipping_cost, discount, net_revenue, profit, order_id, status, settled, settlement_date, notes, source, created_at, updated_at)
      VALUES (${id}, ${user_id}, ${product_id}, ${marketplace_id}, ${date}, ${qty}, ${ppu}, ${totalRevenue}, ${hpp}, ${totalHpp}, ${marketplaceFee}, ${ship}, ${disc}, ${netRevenue}, ${profit}, ${order_id || null}, 'completed', 0, ${settlementDate}, ${notes || null}, 'web', datetime('now'), datetime('now'))
    `;

    // Decrease product stock
    sql`UPDATE products SET stock = MAX(0, stock - ${qty}), updated_at = datetime('now') WHERE id = ${product_id}`;

    // Auto-create pemasukan transaction
    const productName = sql`SELECT name FROM products WHERE id = ${product_id}`[0]?.name || '';
    const mpName = mp[0]?.name || '';
    const txNote = `Penjualan ${productName} × ${qty} di ${mpName}`;
    const txId = crypto.randomUUID();
    sql`
      INSERT INTO transactions (id, user_id, date, type, amount, note, source, quantity, unit, price_per_unit, created_at, updated_at)
      VALUES (${txId}, ${user_id}, ${date}, 'pemasukan', ${netRevenue}, ${txNote}, 'web', ${qty}, 'pcs', ${ppu}, datetime('now'), datetime('now'))
    `;

    const sale = sql`SELECT s.*, p.name as product_name, m.name as marketplace_name, m.icon as marketplace_icon FROM sales s LEFT JOIN products p ON s.product_id = p.id LEFT JOIN marketplaces m ON s.marketplace_id = m.id WHERE s.id = ${id}`;
    return Response.json(sale[0], { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
