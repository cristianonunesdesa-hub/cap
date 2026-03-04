import { createClient } from '@supabase/supabase-js';

const REMINDER_TYPE = 'retention_warning';
const TARGET_DAYS = new Set([1, 2]);

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function dateOnlyTodayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetweenDateOnly(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00.000Z`).getTime();
  const end = new Date(`${endDate}T00:00:00.000Z`).getTime();
  return Math.floor((end - start) / 86400000);
}

function normalizeWhatsappNumber(rawPhone) {
  if (!rawPhone) return null;
  const digits = String(rawPhone).replace(/\D/g, '');
  if (digits.length < 10) return null;
  if (digits.startsWith('55')) return digits;
  return `55${digits}`;
}

function buildMessage(customer, daysRemaining, daysSincePurchase, template) {
  const firstName = (customer.name || '').trim().split(/\s+/)[0] || 'cliente';
  const defaultMessage =
    `Oi ${firstName}, tudo bem? Percebi que faltam ${daysRemaining} dia(s) para você sair da minha base ativa. ` +
    'Posso te ajudar com uma reposicao hoje?';

  if (!template) return defaultMessage;

  return template
    .replaceAll('{{name}}', customer.name || '')
    .replaceAll('{{first_name}}', firstName)
    .replaceAll('{{days_remaining}}', String(daysRemaining))
    .replaceAll('{{days_since_purchase}}', String(daysSincePurchase))
    .replaceAll('{{company_name}}', customer.company_name || '');
}

async function sendEvolutionText({
  baseUrl,
  apiKey,
  instanceName,
  number,
  text
}) {
  const url = `${baseUrl.replace(/\/$/, '')}/message/sendText/${encodeURIComponent(instanceName)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: apiKey
    },
    body: JSON.stringify({
      number,
      text
    })
  });

  const responseText = await response.text();
  let payload = null;

  try {
    payload = responseText ? JSON.parse(responseText) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error = payload?.message || responseText || `Evolution API error ${response.status}`;
    throw new Error(error);
  }

  const messageId =
    payload?.key?.id ||
    payload?.data?.key?.id ||
    payload?.id ||
    null;

  return { payload, messageId };
}

function isAuthorized(req) {
  const secret = process.env.WHATSAPP_CRON_SECRET;
  if (!secret) return true;

  const headerSecret = req.headers['x-cron-secret'];
  const authHeader = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const querySecret = req.query?.secret;
  return headerSecret === secret || authHeader === secret || querySecret === secret;
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!isAuthorized(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const supabase = createClient(
      getRequiredEnv('SUPABASE_URL'),
      getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')
    );

    const today = dateOnlyTodayUTC();

    const { data: customerRows, error: customersError } = await supabase
      .from('customers')
      .select('id,user_id,name,company_name,phone,last_purchase_date,retention_limit,owner_type')
      .eq('owner_type', 'me')
      .not('phone', 'is', null);

    if (customersError) {
      throw customersError;
    }

    const candidates = (customerRows || [])
      .map((customer) => {
        const retentionLimit = Number(customer.retention_limit || 90);
        const daysSincePurchase = daysBetweenDateOnly(customer.last_purchase_date, today);
        const daysRemaining = retentionLimit - daysSincePurchase;
        return { ...customer, retentionLimit, daysSincePurchase, daysRemaining };
      })
      .filter((customer) => TARGET_DAYS.has(customer.daysRemaining));

    if (candidates.length === 0) {
      res.status(200).json({ ok: true, total: 0, sent: 0, skipped: 0, failed: 0 });
      return;
    }

    const userIds = [...new Set(candidates.map((c) => c.user_id).filter(Boolean))];
    const customerIds = candidates.map((c) => c.id);

    const [{ data: connectionRows, error: connectionsError }, { data: logRows, error: logsError }] =
      await Promise.all([
        supabase
          .from('seller_whatsapp_connections')
          .select('user_id,evolution_base_url,evolution_api_key,instance_name,is_active,message_template')
          .in('user_id', userIds)
          .eq('is_active', true),
        supabase
          .from('whatsapp_message_logs')
          .select('customer_id,sent_on')
          .eq('reminder_type', REMINDER_TYPE)
          .eq('sent_on', today)
          .in('customer_id', customerIds)
      ]);

    if (connectionsError) {
      throw connectionsError;
    }
    if (logsError) {
      throw logsError;
    }

    const connectionsByUser = new Map((connectionRows || []).map((row) => [row.user_id, row]));
    const alreadySentToday = new Set((logRows || []).map((row) => row.customer_id));

    let sent = 0;
    let skipped = 0;
    let failed = 0;
    const errors = [];

    for (const customer of candidates) {
      if (alreadySentToday.has(customer.id)) {
        skipped += 1;
        continue;
      }

      const connection = connectionsByUser.get(customer.user_id);
      if (!connection) {
        skipped += 1;
        continue;
      }

      const number = normalizeWhatsappNumber(customer.phone);
      if (!number) {
        failed += 1;
        await supabase.from('whatsapp_message_logs').insert({
          customer_id: customer.id,
          user_id: customer.user_id,
          phone_number: customer.phone,
          reminder_type: REMINDER_TYPE,
          days_remaining: customer.daysRemaining,
          sent_on: today,
          status: 'failed',
          error_message: 'Invalid phone number'
        });
        continue;
      }

      const text = buildMessage(
        customer,
        customer.daysRemaining,
        customer.daysSincePurchase,
        connection.message_template
      );

      try {
        const { messageId } = await sendEvolutionText({
          baseUrl: connection.evolution_base_url,
          apiKey: connection.evolution_api_key,
          instanceName: connection.instance_name,
          number,
          text
        });

        const { error: insertError } = await supabase.from('whatsapp_message_logs').insert({
          customer_id: customer.id,
          user_id: customer.user_id,
          phone_number: number,
          reminder_type: REMINDER_TYPE,
          days_remaining: customer.daysRemaining,
          sent_on: today,
          status: 'sent',
          provider_message_id: messageId
        });

        if (insertError) {
          throw insertError;
        }
        sent += 1;
      } catch (err) {
        failed += 1;
        const message = err instanceof Error ? err.message : 'Unknown send error';
        errors.push({ customerId: customer.id, message });
        await supabase.from('whatsapp_message_logs').insert({
          customer_id: customer.id,
          user_id: customer.user_id,
          phone_number: number,
          reminder_type: REMINDER_TYPE,
          days_remaining: customer.daysRemaining,
          sent_on: today,
          status: 'failed',
          error_message: message
        });
      }
    }

    res.status(200).json({
      ok: true,
      total: candidates.length,
      sent,
      skipped,
      failed,
      errors: errors.slice(0, 20)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    res.status(500).json({ ok: false, error: message });
  }
}
