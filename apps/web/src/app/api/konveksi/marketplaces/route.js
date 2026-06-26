import sql from "@/app/api/utils/sql";

// GET - List marketplaces
export async function GET() {
  const marketplaces = sql`SELECT * FROM marketplaces WHERE active = 1 ORDER BY name`;
  return Response.json(marketplaces);
}
