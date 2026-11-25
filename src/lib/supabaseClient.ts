import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const useLocalPg = import.meta.env.VITE_USE_LOCAL_PG === 'true' || !rawUrl;

function isValidHttpUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export const isSupabaseConfigured = useLocalPg
  ? true
  : Boolean(
      rawUrl &&
        rawAnonKey &&
        isValidHttpUrl(rawUrl) &&
        !rawUrl.includes('your_supabase_url') &&
        !rawUrl.includes('placeholder') &&
        !rawAnonKey.includes('your_supabase_anon_key')
    );

type QueryResult<T = any> = {
  data: T | null;
  error: { message: string } | null;
  count?: number | null;
};

class LocalPgQueryBuilder implements PromiseLike<QueryResult> {
  private table: string;
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private selectCols = '*';
  private payload: unknown = null;
  private filters: Array<{ column: string; op: string; value: unknown }> = [];
  private orderBy: { column: string; ascending: boolean } | null = null;
  private isSingle = false;
  private isMaybeSingle = false;
  private countMode: string | null = null;
  private isHead = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns = '*', options?: { count?: string; head?: boolean }) {
    if (this.action === 'select') {
      this.action = 'select';
    }
    this.selectCols = columns;
    if (options?.count) this.countMode = options.count;
    if (options?.head) this.isHead = options.head;
    return this;
  }

  insert(values: unknown) {
    this.action = 'insert';
    this.payload = values;
    return this;
  }

  update(values: unknown) {
    this.action = 'update';
    this.payload = values;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, op: 'eq', value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending ?? true };
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  private async execute(): Promise<QueryResult> {
    try {
      const res = await fetch('/api/db/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: this.table,
          action: this.action,
          select: this.selectCols,
          payload: this.payload,
          filters: this.filters,
          order: this.orderBy,
          single: this.isSingle,
          maybeSingle: this.isMaybeSingle,
          count: this.countMode,
          head: this.isHead,
        }),
      });
      return await res.json();
    } catch (err: unknown) {
      return {
        data: null,
        error: { message: err instanceof Error ? err.message : 'Network error' },
        count: null,
      };
    }
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

const localPgClient = {
  from: (table: string) => new LocalPgQueryBuilder(table),
  storage: {
    from: (_bucket: string) => ({
      upload: async () => ({
        data: null,
        error: { message: 'Local PostgreSQL mode uses inline signature data' },
      }),
      getPublicUrl: (filePath: string) => ({
        data: { publicUrl: filePath },
      }),
    }),
  },
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
    signInWithPassword: async () => ({
      data: { session: null, user: null },
      error: new Error('Email atau password admin tidak valid.'),
    }),
    signOut: async () => ({ error: null }),
  },
};

const safeUrl = isValidHttpUrl(rawUrl) ? rawUrl! : 'https://placeholder-project.supabase.co';
const safeKey =
  rawAnonKey && !rawAnonKey.includes('your_supabase_anon_key')
    ? rawAnonKey
    : 'placeholder-anon-key-00000000000000000000000000000000';

export const supabase = useLocalPg
  ? (localPgClient as unknown as ReturnType<typeof createClient>)
  : createClient(safeUrl, safeKey);
