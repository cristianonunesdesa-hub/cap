import {
  extractQrCode,
  getAuthenticatedUser,
  json,
  requireConnectionForUser,
  tryEvolutionEndpoints
} from './_common.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    json(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      json(res, 401, { error: 'Unauthorized' });
      return;
    }

    const connection = await requireConnectionForUser(user.id);
    const instanceName = connection.instance_name;

    const payload = await tryEvolutionEndpoints(connection, [
      { method: 'GET', path: `/instance/connect/${encodeURIComponent(instanceName)}` },
      { method: 'POST', path: `/instance/connect/${encodeURIComponent(instanceName)}` },
      { method: 'GET', path: `/instance/qrcode/${encodeURIComponent(instanceName)}` }
    ]);

    const qrCode = extractQrCode(payload);
    json(res, 200, { ok: true, instanceName, qrCode, payload });
  } catch (error) {
    json(res, 500, { error: error instanceof Error ? error.message : 'Unexpected error' });
  }
}
