import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const { Pool, types } = pg;

// Keep DATE columns as 'YYYY-MM-DD' strings (matching Supabase PostgREST behavior)
types.setTypeParser(1082, (val) => val);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3001);
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('[Server] DATABASE_URL is not set in .env');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

const ALLOWED_TABLES = {
  events: new Set([
    'id',
    'title',
    'date',
    'time_start',
    'time_end',
    'location',
    'description',
    'is_active',
    'created_at',
    'updated_at',
  ]),
  attendances: new Set([
    'id',
    'event_id',
    'name',
    'position',
    'email',
    'phone',
    'address',
    'signature_url',
    'attended_at',
    'created_at',
    'updated_at',
  ]),
};

function sanitizeColumns(table, selectStr) {
  const allowed = ALLOWED_TABLES[table];
  if (!selectStr || selectStr.trim() === '*') return '*';
  const cols = selectStr
    .split(',')
    .map((c) => c.trim())
    .filter((c) => allowed.has(c));
  return cols.length > 0 ? cols.map((c) => `"${c}"`).join(', ') : '*';
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, database: 'absensi_pltgucilegon' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/db/query', async (req, res) => {
  const { table, action, select, payload, filters, order, single, maybeSingle, count, head } = req.body || {};

  const allowedCols = ALLOWED_TABLES[table];
  if (!allowedCols) {
    return res.json({ data: null, error: { message: `Table "${table}" is not allowed` }, count: null });
  }

  try {
    const params = [];
    const whereClauses = [];

    if (Array.isArray(filters)) {
      for (const f of filters) {
        if (!allowedCols.has(f.column)) {
          return res.json({
            data: null,
            error: { message: `Column "${f.column}" does not exist on "${table}"` },
            count: null,
          });
        }
        if (f.op === 'eq') {
          params.push(f.value);
          whereClauses.push(`"${f.column}" = $${params.length}`);
        }
      }
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const returningCols = sanitizeColumns(table, select);

    if (action === 'select') {
      if (head && count === 'exact') {
        const sql = `SELECT COUNT(*)::int AS total FROM "${table}" ${whereSql}`;
        const result = await pool.query(sql, params);
        return res.json({ data: null, error: null, count: result.rows[0]?.total ?? 0 });
      }

      let orderSql = '';
      if (order && allowedCols.has(order.column)) {
        orderSql = `ORDER BY "${order.column}" ${order.ascending === false ? 'DESC' : 'ASC'}`;
      }

      const sql = `SELECT ${returningCols} FROM "${table}" ${whereSql} ${orderSql}`;
      const result = await pool.query(sql, params);

      if (single) {
        if (result.rows.length === 0) {
          return res.json({ data: null, error: { message: 'Row not found' }, count: null });
        }
        return res.json({ data: result.rows[0], error: null, count: result.rowCount });
      }
      if (maybeSingle) {
        return res.json({ data: result.rows[0] ?? null, error: null, count: result.rowCount });
      }
      return res.json({ data: result.rows, error: null, count: result.rowCount });
    }

    if (action === 'insert') {
      const rows = Array.isArray(payload) ? payload : [payload];
      if (rows.length === 0 || !rows[0]) {
        return res.json({ data: null, error: { message: 'Empty insert payload' }, count: null });
      }

      const keys = Object.keys(rows[0]).filter((k) => {
        if (!allowedCols.has(k)) {
          throw new Error(`Column "${k}" does not exist on "${table}"`);
        }
        return true;
      });

      const valuesSql = rows
        .map((row) => {
          const placeholders = keys.map((k) => {
            params.push(row[k] ?? null);
            return `$${params.length}`;
          });
          return `(${placeholders.join(', ')})`;
        })
        .join(', ');

      const colsSql = keys.map((k) => `"${k}"`).join(', ');
      const sql = `INSERT INTO "${table}" (${colsSql}) VALUES ${valuesSql} RETURNING ${returningCols}`;
      const result = await pool.query(sql, params);

      if (single || maybeSingle) {
        return res.json({ data: result.rows[0] ?? null, error: null, count: result.rowCount });
      }
      return res.json({ data: result.rows, error: null, count: result.rowCount });
    }

    if (action === 'update') {
      const entries = Object.entries(payload || {}).filter(([k]) => {
        if (!allowedCols.has(k)) {
          throw new Error(`Column "${k}" does not exist on "${table}"`);
        }
        return true;
      });

      if (entries.length === 0) {
        return res.json({ data: null, error: { message: 'Empty update payload' }, count: null });
      }

      const setSql = entries
        .map(([k, v]) => {
          params.push(v ?? null);
          return `"${k}" = $${params.length}`;
        })
        .join(', ');

      // Rebuild where clauses with shifted parameter indices
      const updateWhereClauses = [];
      if (Array.isArray(filters)) {
        for (const f of filters) {
          params.push(f.value);
          updateWhereClauses.push(`"${f.column}" = $${params.length}`);
        }
      }
      const updateWhereSql = updateWhereClauses.length > 0 ? `WHERE ${updateWhereClauses.join(' AND ')}` : '';
      const sql = `UPDATE "${table}" SET ${setSql} ${updateWhereSql} RETURNING ${returningCols}`;
      const result = await pool.query(sql, params);

      if (single || maybeSingle) {
        return res.json({ data: result.rows[0] ?? null, error: null, count: result.rowCount });
      }
      return res.json({ data: result.rows, error: null, count: result.rowCount });
    }

    if (action === 'delete') {
      const sql = `DELETE FROM "${table}" ${whereSql} RETURNING ${returningCols}`;
      const result = await pool.query(sql, params);
      return res.json({ data: result.rows, error: null, count: result.rowCount });
    }

    return res.json({ data: null, error: { message: `Unsupported action "${action}"` }, count: null });
  } catch (err) {
    console.error(`[DB Error] ${table}.${action}:`, err.message);
    return res.json({ data: null, error: { message: err.message }, count: null });
  }
});

// Serve built frontend in production if dist/ exists
const distDir = path.resolve(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[API Server] Listening on http://localhost:${PORT} (PostgreSQL: absensi_pltgucilegon)`);
});
