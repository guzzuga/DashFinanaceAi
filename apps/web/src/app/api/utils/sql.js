import Database from "better-sqlite3";
import path from "path";

const DB_PATH = process.env.DATABASE_URL || "/home/ubuntu/ai-finance-manager/backend/data/finance.db";

let db;
try {
  db = new Database(DB_PATH, { readonly: false });
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
} catch (e) {
  console.error("Failed to connect to SQLite:", e.message);
}

/**
 * SQLite compatibility layer that mimics Neon's tagged template literal syntax.
 * Converts sql`SELECT ...` calls to SQLite prepared statements.
 */
function sql(strings, ...values) {
  if (!db) throw new Error("Database not connected");

  let query = "";
  const params = [];

  for (let i = 0; i < strings.length; i++) {
    query += strings[i];
    if (i < values.length) {
      query += "?";
      params.push(values[i]);
    }
  }

  query = query.trim();

  // Convert PostgreSQL syntax to SQLite
  query = query.replace(/DATE_TRUNC\('day',\s*(\w+)\)/gi, "date($1)");
  query = query.replace(/DATE_TRUNC\('month',\s*(\w+)\)/gi, "strftime('%Y-%m-01', $1)");
  query = query.replace(/DATE_TRUNC\('year',\s*(\w+)\)/gi, "strftime('%Y-01-01', $1)");
  query = query.replace(/NOW\(\)\s*-\s*INTERVAL\s*'(\d+)\s+days?'/gi, "date('now', '-$1 days')");
  query = query.replace(/NOW\(\)\s*-\s*INTERVAL\s*'(\d+)\s+months?'/gi, "date('now', '-$1 months')");
  query = query.replace(/NOW\(\)/gi, "date('now')");

  // Debug
  // console.log("SQL:", query, params);

  try {
    if (query.toUpperCase().startsWith("SELECT") || query.toUpperCase().startsWith("WITH")) {
      const stmt = db.prepare(query);
      return stmt.all(...params);
    } else {
      const stmt = db.prepare(query);
      return stmt.run(...params);
    }
  } catch (e) {
    console.error("SQL Error:", e.message, "\nQuery:", query, "\nParams:", params);
    throw e;
  }
}

sql.transaction = (fn) => {
  return db.transaction(fn)();
};

export default sql;
