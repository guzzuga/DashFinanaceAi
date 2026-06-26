import sql from "@/app/api/utils/sql";

// GET - Konveksi report
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  const startDate = searchParams.get("start_date") || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const endDate = searchParams.get("end_date") || new Date().toISOString().split('T')[0];

  // Sales summary
  const salesSummary = userId
    ? sql`
        SELECT 
          COALESCE(SUM(s.total_revenue), 0) as total_revenue,
          COALESCE(SUM(s.total_hpp), 0) as total_hpp,
          COALESCE(SUM(s.marketplace_fee), 0) as total_fee,
          COALESCE(SUM(s.shipping_cost), 0) as total_shipping,
          COALESCE(SUM(s.discount), 0) as total_discount,
          COALESCE(SUM(s.net_revenue), 0) as total_net_revenue,
          COALESCE(SUM(s.profit), 0) as total_profit,
          COALESCE(SUM(s.quantity), 0) as total_qty_sold,
          COUNT(s.id) as total_orders
        FROM sales s
        WHERE s.date >= ${startDate} AND s.date <= ${endDate} AND s.status = 'completed' AND s.user_id = ${userId}
      `
    : sql`
        SELECT 
          COALESCE(SUM(s.total_revenue), 0) as total_revenue,
          COALESCE(SUM(s.total_hpp), 0) as total_hpp,
          COALESCE(SUM(s.marketplace_fee), 0) as total_fee,
          COALESCE(SUM(s.shipping_cost), 0) as total_shipping,
          COALESCE(SUM(s.discount), 0) as total_discount,
          COALESCE(SUM(s.net_revenue), 0) as total_net_revenue,
          COALESCE(SUM(s.profit), 0) as total_profit,
          COALESCE(SUM(s.quantity), 0) as total_qty_sold,
          COUNT(s.id) as total_orders
        FROM sales s
        WHERE s.date >= ${startDate} AND s.date <= ${endDate} AND s.status = 'completed'
      `;

  // Marketplace breakdown
  const marketplaceBreakdown = userId
    ? sql`
        SELECT m.name, m.icon, SUM(s.quantity) as qty, SUM(s.total_revenue) as revenue, SUM(s.profit) as profit, COUNT(s.id) as orders
        FROM sales s JOIN marketplaces m ON s.marketplace_id = m.id
        WHERE s.date >= ${startDate} AND s.date <= ${endDate} AND s.status = 'completed' AND s.user_id = ${userId}
        GROUP BY m.name, m.icon ORDER BY profit DESC
      `
    : sql`
        SELECT m.name, m.icon, SUM(s.quantity) as qty, SUM(s.total_revenue) as revenue, SUM(s.profit) as profit, COUNT(s.id) as orders
        FROM sales s JOIN marketplaces m ON s.marketplace_id = m.id
        WHERE s.date >= ${startDate} AND s.date <= ${endDate} AND s.status = 'completed'
        GROUP BY m.name, m.icon ORDER BY profit DESC
      `;

  // Product breakdown
  const productBreakdown = userId
    ? sql`
        SELECT p.name, SUM(s.quantity) as qty, SUM(s.total_revenue) as revenue, SUM(s.profit) as profit, SUM(s.marketplace_fee) as fee
        FROM sales s JOIN products p ON s.product_id = p.id
        WHERE s.date >= ${startDate} AND s.date <= ${endDate} AND s.status = 'completed' AND s.user_id = ${userId}
        GROUP BY p.name ORDER BY profit DESC
      `
    : sql`
        SELECT p.name, SUM(s.quantity) as qty, SUM(s.total_revenue) as revenue, SUM(s.profit) as profit, SUM(s.marketplace_fee) as fee
        FROM sales s JOIN products p ON s.product_id = p.id
        WHERE s.date >= ${startDate} AND s.date <= ${endDate} AND s.status = 'completed'
        GROUP BY p.name ORDER BY profit DESC
      `;

  // Category breakdown (by product category)
  const categoryBreakdown = userId
    ? sql`
        SELECT COALESCE(p.category, 'Lainnya') as category, SUM(s.quantity) as qty, SUM(s.total_revenue) as revenue, SUM(s.profit) as profit, COUNT(s.id) as orders
        FROM sales s JOIN products p ON s.product_id = p.id
        WHERE s.date >= ${startDate} AND s.date <= ${endDate} AND s.status = 'completed' AND s.user_id = ${userId}
        GROUP BY p.category ORDER BY revenue DESC
      `
    : sql`
        SELECT COALESCE(p.category, 'Lainnya') as category, SUM(s.quantity) as qty, SUM(s.total_revenue) as revenue, SUM(s.profit) as profit, COUNT(s.id) as orders
        FROM sales s JOIN products p ON s.product_id = p.id
        WHERE s.date >= ${startDate} AND s.date <= ${endDate} AND s.status = 'completed'
        GROUP BY p.category ORDER BY revenue DESC
      `;

  // Production summary
  const productionSummary = userId
    ? sql`
        SELECT COALESCE(SUM(total_cost), 0) as total_production_cost, COALESCE(SUM(quantity), 0) as total_produced
        FROM productions WHERE date >= ${startDate} AND date <= ${endDate} AND user_id = ${userId}
      `
    : sql`
        SELECT COALESCE(SUM(total_cost), 0) as total_production_cost, COALESCE(SUM(quantity), 0) as total_produced
        FROM productions WHERE date >= ${startDate} AND date <= ${endDate}
      `;

  return Response.json({
    total_revenue: salesSummary[0]?.total_revenue || 0,
    total_hpp: salesSummary[0]?.total_hpp || 0,
    total_fee: salesSummary[0]?.total_fee || 0,
    total_shipping: salesSummary[0]?.total_shipping || 0,
    total_discount: salesSummary[0]?.total_discount || 0,
    total_net_revenue: salesSummary[0]?.total_net_revenue || 0,
    total_profit: salesSummary[0]?.total_profit || 0,
    total_qty_sold: salesSummary[0]?.total_qty_sold || 0,
    total_orders: salesSummary[0]?.total_orders || 0,
    total_production_cost: productionSummary[0]?.total_production_cost || 0,
    total_produced: productionSummary[0]?.total_produced || 0,
    marketplace_breakdown: marketplaceBreakdown,
    product_breakdown: productBreakdown,
    category_breakdown: categoryBreakdown,
  });
}
