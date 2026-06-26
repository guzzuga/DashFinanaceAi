import sql from "@/app/api/utils/sql";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  if (!userId)
    return Response.json({ error: "Missing user_id" }, { status: 400 });

  const transactions = sql`
    SELECT t.id, t.type, c.name as category, t.amount, t.note, t.date 
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ${userId} 
    ORDER BY t.date DESC
  `;

  // Generate Excel-compatible CSV with BOM for UTF-8
  const BOM = "\uFEFF";
  const header = "ID,Tipe,Kategori,Jumlah,Catatan,Tanggal\n";
  const rows = transactions
    .map(
      (t) =>
        `${t.id},${t.type},"${t.category || ''}",${t.amount},"${t.note || ""}",${t.date}`,
    )
    .join("\n");

  return new Response(BOM + header + rows, {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": "attachment; filename=laporan-keuangan.xls",
    },
  });
}
