import { ensureConnectionForUser, getAuthenticatedUser, getSupabaseAdmin, json } from './_common.js';

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
        .select('instance_name,message_template,is_active,updated_at')
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
    const messageTemplate = String(body.messageTemplate || '').trim();
    const isActive = body.isActive !== false;

    const saved = await ensureConnectionForUser(user, {
      message_template: messageTemplate || null,
      is_active: isActive
    });

    json(res, 200, {
      ok: true,
      config: {
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
