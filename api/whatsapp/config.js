import { getAuthenticatedUser, getSupabaseAdmin, json, upsertConnectionForUser } from './_common.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    json(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      json(res, 401, { error: 'Unauthorized' });
      return;
    }

    if (req.method === 'GET') {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('seller_whatsapp_connections')
        .select('evolution_base_url,instance_name,message_template,is_active,updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      json(res, 200, {
        config: data || null
      });
      return;
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const evolutionBaseUrl = String(body.evolutionBaseUrl || '').trim();
    const instanceName = String(body.instanceName || '').trim();
    const messageTemplate = String(body.messageTemplate || '').trim();
    const isActive = body.isActive !== false;

    if (!evolutionBaseUrl || !instanceName) {
      json(res, 400, { error: 'evolutionBaseUrl e instanceName sao obrigatorios.' });
      return;
    }

    const supabase = getSupabaseAdmin();
    const { data: current, error: currentError } = await supabase
      .from('seller_whatsapp_connections')
      .select('evolution_api_key')
      .eq('user_id', user.id)
      .maybeSingle();

    if (currentError) {
      throw currentError;
    }

    const apiKeyFromBody = String(body.evolutionApiKey || '').trim();
    const evolutionApiKey = apiKeyFromBody || current?.evolution_api_key || '';

    if (!evolutionApiKey) {
      json(res, 400, { error: 'evolutionApiKey obrigatoria no primeiro salvamento.' });
      return;
    }

    const saved = await upsertConnectionForUser(user.id, {
      evolution_base_url: evolutionBaseUrl,
      evolution_api_key: evolutionApiKey,
      instance_name: instanceName,
      message_template: messageTemplate || null,
      is_active: isActive
    });

    json(res, 200, {
      ok: true,
      config: {
        evolution_base_url: saved.evolution_base_url,
        instance_name: saved.instance_name,
        message_template: saved.message_template,
        is_active: saved.is_active,
        updated_at: saved.updated_at
      }
    });
  } catch (error) {
    json(res, 500, { error: error instanceof Error ? error.message : 'Unexpected error' });
  }
}
