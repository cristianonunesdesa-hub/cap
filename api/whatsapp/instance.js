import {
  ensureConnectionForUser,
  extractQrCode,
  getAuthenticatedUser,
  json,
  tryEvolutionEndpoints
} from './_common.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    json(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      json(res, 401, { error: 'Unauthorized' });
      return;
    }

    const connection = await ensureConnectionForUser(user);
    const instanceName = connection.instance_name;

    await tryEvolutionEndpoints(connection, [
      {
        method: 'POST',
        path: '/instance/create',
        body: {
          instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS'
        }
      },
      {
        method: 'POST',
        path: '/instance/create',
        body: { instanceName }
      }
    ]);

    const qrPayload = await tryEvolutionEndpoints(connection, [
      { method: 'GET', path: `/instance/connect/${encodeURIComponent(instanceName)}` },
      { method: 'POST', path: `/instance/connect/${encodeURIComponent(instanceName)}` },
      { method: 'GET', path: `/instance/qrcode/${encodeURIComponent(instanceName)}` }
    ]);

    const qrCode = extractQrCode(qrPayload);
    json(res, 200, { ok: true, instanceName, qrCode, payload: qrPayload });
  } catch (error) {
    json(res, 500, { error: error instanceof Error ? error.message : 'Unexpected error' });
  }
}
