import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, RefreshCcw, X } from './Icons';
import { supabase } from '../services/supabase';

interface WhatsAppConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type StatusTone = 'neutral' | 'success' | 'error';

const WhatsAppConnectionModal: React.FC<WhatsAppConnectionModalProps> = ({ isOpen, onClose }) => {
  const [instanceName, setInstanceName] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('nao verificado');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusTone, setStatusTone] = useState<StatusTone>('neutral');

  const setFeedback = (message: string, tone: StatusTone = 'neutral') => {
    setStatusMessage(message);
    setStatusTone(tone);
  };

  const getAuthHeaders = async () => {
    if (!supabase) {
      throw new Error('Supabase nao configurado.');
    }
    const { data, error } = await supabase.auth.getSession();
    if (error || !data?.session?.access_token) {
      throw new Error('Sessao expirada. Entre novamente.');
    }
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session.access_token}`
    };
  };

  const apiCall = async (path: string, method = 'GET', body?: Record<string, unknown>) => {
    const headers = await getAuthHeaders();
    const response = await fetch(path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || `Falha HTTP ${response.status}`);
    }
    return payload;
  };

  const loadConfig = async () => {
    setLoading(true);
    try {
      const payload = await apiCall('/api/whatsapp/config');
      const config = payload?.config;
      if (config) {
        setInstanceName(config.instance_name || '');
        setMessageTemplate(config.message_template || '');
        setIsActive(config.is_active !== false);
      }
      setFeedback('Configuracao carregada.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Erro ao carregar configuracao.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      await apiCall('/api/whatsapp/config', 'PUT', {
        messageTemplate,
        isActive
      });
      setFeedback('Preferencias salvas com sucesso.', 'success');
      await loadConfig();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Erro ao salvar configuracao.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateQrCode = async () => {
    setLoading(true);
    try {
      const payload = await apiCall('/api/whatsapp/instance', 'POST');
      setQrCode(payload?.qrCode || null);
      setFeedback(payload?.qrCode ? 'QR Code atualizado. Escaneie no WhatsApp.' : 'Instancia criada. Gere/atualize o QR novamente.', 'success');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Erro ao gerar QR Code.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = async () => {
    setLoading(true);
    try {
      const payload = await apiCall('/api/whatsapp/status');
      setConnectionStatus(String(payload?.status || 'desconhecido'));
      setFeedback(`Status atualizado: ${payload?.status || 'desconhecido'}.`, 'success');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Erro ao consultar status.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const refreshQrOnly = async () => {
    setLoading(true);
    try {
      const payload = await apiCall('/api/whatsapp/qrcode');
      setQrCode(payload?.qrCode || null);
      setFeedback(payload?.qrCode ? 'QR Code recarregado.' : 'Sem QR Code disponivel no momento.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Erro ao atualizar QR Code.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const disconnectInstance = async () => {
    setLoading(true);
    try {
      await apiCall('/api/whatsapp/disconnect', 'POST');
      setConnectionStatus('desconectado');
      setQrCode(null);
      setFeedback('Instancia desconectada.', 'success');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Erro ao desconectar instancia.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setStatusMessage('');
    setStatusTone('neutral');
    setQrCode(null);
    setConnectionStatus('nao verificado');
    loadConfig();
  }, [isOpen]);

  if (!isOpen) return null;

  const feedbackClass =
    statusTone === 'success'
      ? 'bg-green-50 text-green-700 border-green-200'
      : statusTone === 'error'
        ? 'bg-red-50 text-red-700 border-red-200'
        : 'bg-blue-50 text-blue-700 border-blue-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">Conexao WhatsApp (Evolution)</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
              <p className="text-xs text-gray-500">Instancia deste vendedor</p>
              <p className="text-sm font-medium text-gray-800">{instanceName || 'sera criada automaticamente'}</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Template (opcional)</label>
              <textarea
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm h-20 resize-none"
                placeholder="Ex: Oi {{first_name}}, faltam {{days_remaining}} dia(s)..."
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Ativar envio automatico para este vendedor
          </label>

          <div className="text-sm text-gray-600">
            <span className="font-medium">Status atual:</span> {connectionStatus}
          </div>

          {statusMessage && (
            <div className={`p-3 border rounded-md text-sm flex items-center ${feedbackClass}`}>
              {statusTone === 'error' ? <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" /> : <Check className="w-4 h-4 mr-2 flex-shrink-0" />}
              {statusMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={saveConfig}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-md text-sm font-medium"
            >
              Salvar Preferencias
            </button>
            <button
              onClick={refreshStatus}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-60 rounded-md text-sm font-medium flex items-center justify-center"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Atualizar Status
            </button>
            <button
              onClick={generateQrCode}
              disabled={loading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-md text-sm font-medium"
            >
              Conectar e Gerar QR
            </button>
            <button
              onClick={refreshQrOnly}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-60 rounded-md text-sm font-medium"
            >
              Atualizar QR
            </button>
            <button
              onClick={disconnectInstance}
              disabled={loading}
              className="md:col-span-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-md text-sm font-medium"
            >
              Desconectar WhatsApp
            </button>
          </div>

          <div className="border rounded-md p-4 bg-gray-50">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">QR Code</h4>
            {qrCode ? (
              <img src={qrCode} alt="QR Code WhatsApp" className="w-56 h-56 object-contain bg-white border rounded-md p-2" />
            ) : (
              <p className="text-sm text-gray-500">
                Clique em "Conectar e Gerar QR" para conectar seu WhatsApp.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppConnectionModal;
