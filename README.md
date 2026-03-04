<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1TTpWbb_qec4dVK9kMNTaJ-IubMB0xxKy

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## WhatsApp Automacao (Evolution API)

Primeira versao implementada:
- Endpoint: `GET/POST /api/whatsapp/reminders`
- Cron Vercel diario: `0 12 * * *` (12:00 UTC)
- Regra: envia para clientes que faltam `1` ou `2` dias para sair da base (`owner_type = 'me'`)
- Envio individual por vendedor via conexao em `seller_whatsapp_connections`
- Antiduplicidade: no maximo 1 envio por cliente/dia em `whatsapp_message_logs`

### Setup no Supabase

1. Execute o SQL: [supabase/whatsapp_evolution_setup.sql](supabase/whatsapp_evolution_setup.sql)
2. Cadastre uma conexao por vendedor em `seller_whatsapp_connections`:
   - `user_id`
   - `evolution_base_url` (ex: `https://seu-host-evolution`)
   - `evolution_api_key`
   - `instance_name`
   - `is_active = true`
   - `message_template` opcional com placeholders:
     - `{{name}}`, `{{first_name}}`, `{{days_remaining}}`, `{{days_since_purchase}}`, `{{company_name}}`

### Variaveis de ambiente na Vercel

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WHATSAPP_CRON_SECRET` (opcional, recomendado)

### Teste manual

Dispare manualmente:
- `POST https://SEU-DOMINIO/api/whatsapp/reminders`
- Header: `x-cron-secret: <WHATSAPP_CRON_SECRET>` (se configurado)
