import React, { useState, useEffect } from 'react';
import { X, Check } from './Icons';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const storedKey = localStorage.getItem('wholesale_crm_api_key');
      if (storedKey) setApiKey(storedKey);
      setSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('wholesale_crm_api_key', apiKey.trim());
    setSaved(true);
    setTimeout(() => {
        setSaved(false);
        onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">Configurações</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chave da API do Gemini (Google)</label>
            <p className="text-xs text-gray-500 mb-2">
              Necessário para gerar as mensagens automáticas.
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              placeholder="Cole sua chave API aqui..."
            />
          </div>

          <div className="pt-2">
            <button
              onClick={handleSave}
              className={`w-full flex items-center justify-center px-4 py-2 rounded-md text-white transition-colors font-medium ${
                saved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {saved ? <><Check className="w-5 h-5 mr-2" /> Salvo!</> : 'Salvar Configuração'}
            </button>
          </div>
          
          <p className="text-xs text-center text-gray-400 mt-2">
            A chave fica salva apenas no seu computador.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;