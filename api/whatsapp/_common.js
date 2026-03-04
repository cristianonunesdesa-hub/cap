import { createClient } from '@supabase/supabase-js';

function getEnv(name, fallback) {
  return process.env[name] || fallback || '';
}

export function getSupabaseAdmin() {
  const url = getEnv('SUPABASE_URL', getEnv('VITE_SUPABASE_URL'));
  const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, serviceKey);
}

function getSupabaseAnon() {
  const url = getEnv('SUPABASE_URL', getEnv('VITE_SUPABASE_URL'));
  const anon = getEnv('SUPABASE_ANON_KEY', getEnv('VITE_SUPABASE_ANON_KEY'));
  if (!url || !anon) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  }
  return createClient(url, anon);
}

export async function getAuthenticatedUser(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return null;
  }

  const supabase = getSupabaseAnon();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return null;
  }
  return data.user;
}

export async function requireConnectionForUser(userId) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('seller_whatsapp_connections')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw new Error('Conexao WhatsApp nao encontrada para este vendedor.');
  }
  return data;
}

export async function upsertConnectionForUser(userId, payload) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('seller_whatsapp_connections')
    .upsert(
      {
        user_id: userId,
        evolution_base_url: payload.evolution_base_url,
        evolution_api_key: payload.evolution_api_key,
        instance_name: payload.instance_name,
        message_template: payload.message_template || null,
        is_active: payload.is_active !== false
      },
      { onConflict: 'user_id' }
    )
    .select('*')
    .single();

  if (error) {
    throw error;
  }
  return data;
}

export function extractQrCode(payload) {
  if (!payload) return null;
  if (typeof payload === 'string') {
    if (payload.startsWith('data:image/')) return payload;
    if (/^[A-Za-z0-9+/=]+$/.test(payload) && payload.length > 200) {
      return `data:image/png;base64,${payload}`;
    }
    return null;
  }
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const found = extractQrCode(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof payload === 'object') {
    for (const key of Object.keys(payload)) {
      const found = extractQrCode(payload[key]);
      if (found) return found;
    }
  }
  return null;
}

async function parseResponse(response) {
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text || null;
  }
  return body;
}

export async function evolutionRequest(connection, method, path, body) {
  const base = String(connection.evolution_base_url || '').replace(/\/$/, '');
  const url = `${base}${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      apikey: connection.evolution_api_key
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await parseResponse(response);
  if (!response.ok) {
    const detail = typeof payload === 'string' ? payload : payload?.message || JSON.stringify(payload || {});
    throw new Error(`Evolution ${response.status}: ${detail}`);
  }
  return payload;
}

export async function tryEvolutionEndpoints(connection, candidates) {
  const errors = [];
  for (const candidate of candidates) {
    try {
      return await evolutionRequest(connection, candidate.method, candidate.path, candidate.body);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }
  throw new Error(errors[errors.length - 1] || 'Evolution request failed');
}

export function json(res, status, payload) {
  res.status(status).json(payload);
}
