import React, { useState, useEffect } from 'react';
import { X, Copy, Check, RefreshCcw, MessageCircle } from './Icons';
import { Customer } from '../types';
import { generateReengagementMessage } from '../services/geminiService';
import { getCustomerStatus } from '../utils/dateUtils';
import { getTemplatesByStatus, MessageTemplate } from '../utils/messageTemplates';

interface GenerateMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

type Tab = 'ai' | 'templates';

const GenerateMessageModal: React.FC<GenerateMessageModalProps> = ({ isOpen, onClose, customer }) => {
  const [activeTab, setActiveTab] = useState<Tab>('templates'); // Default to templates for speed
  const [generatedText, setGeneratedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<MessageTemplate[]>([]);

  useEffect(() => {
    if (isOpen && customer) {
      // 1. Carregar templates baseados no status
      const statusData = getCustomerStatus(customer.lastPurchaseDate, customer.retentionLimit);
      const templates = getTemplatesByStatus(statusData.status, customer.ownerType);
      setAvailableTemplates(templates);
      
      // 2. Resetar estado
      setGeneratedText('');
      
      // 3. Se tiver chave de API, sugere IA, senão vai para Templates
      const hasApiKey = !!localStorage.getItem('wholesale_crm_api_key') || !!process.env.API_KEY;
      setActiveTab(hasApiKey ? 'ai' : 'templates');

      if (hasApiKey) {
          handleGenerateAI();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, customer]);

  const handleGenerateAI = async () => {
    if (!customer) return;
    setIsLoading(true);
    
    const statusData = getCustomerStatus(customer.lastPurchaseDate);
    const message = await generateReengagementMessage(customer, statusData.status, statusData.daysSinceLastPurchase);
    
    setGeneratedText(message);
    setIsLoading(false);
  };

  const handleSelectTemplate = (templateText: string) => {
    if (!customer) return;
    // Substitui placeholder pelo primeiro nome
    const firstName = customer.name.split(' ')[0];
    const personalized = templateText.replace(/\[Nome\]/g, firstName);
    setGeneratedText(personalized);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">Mensagem para {customer.name}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
            <button 
                onClick={() => setActiveTab('templates')}
                className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${activeTab === 'templates' ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
            >
                Modelos Prontos
            </button>
            <button 
                onClick={() => {
                    setActiveTab('ai');
                    if(!generatedText) handleGenerateAI();
                }}
                className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${activeTab === 'ai' ? 'border-purple-600 text-purple-600 bg-purple-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
            >
                Gerar com IA (Gemini)
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          
          {/* CONTEÚDO DA ABA MODELOS */}
          {activeTab === 'templates' && (
             <div className="space-y-4">
                <p className="text-sm text-gray-500">Selecione uma mensagem abaixo para personalizar e copiar:</p>
                <div className="grid gap-3">
                    {availableTemplates.map((tmpl) => (
                        <button
                            key={tmpl.id}
                            onClick={() => handleSelectTemplate(tmpl.text)}
                            className="text-left p-3 border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-all text-sm text-gray-700 group"
                        >
                            {tmpl.text.replace(/\[Nome\]/g, customer.name.split(' ')[0])}
                        </button>
                    ))}
                    {availableTemplates.length === 0 && (
                        <p className="text-center text-gray-400 italic py-4">Nenhum modelo específico encontrado para este status.</p>
                    )}
                </div>
             </div>
          )}

          {/* CONTEÚDO DA ABA IA */}
          {activeTab === 'ai' && (
            <div className="h-full flex flex-col">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-8 flex-1">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-4"></div>
                    <p className="text-gray-600">A Inteligência Artificial está escrevendo...</p>
                    </div>
                ) : (
                    <div className="flex-1">
                        <p className="text-sm text-gray-500 mb-2">Mensagem criada exclusivamente para este cliente:</p>
                         <div className="bg-purple-50 p-4 rounded-md border border-purple-100 italic text-gray-700 whitespace-pre-wrap">
                            {generatedText || "Clique em 'Regenerar' para criar uma mensagem."}
                         </div>
                    </div>
                )}
            </div>
          )}
        </div>

        {/* Footer (Editor e Ações) */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
             <div className="mb-3">
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Editor Final (WhatsApp)</label>
                <textarea
                  value={generatedText}
                  onChange={(e) => setGeneratedText(e.target.value)}
                  className="w-full h-24 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none text-sm"
                  placeholder="Selecione um modelo ou gere com IA..."
                ></textarea>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCopy}
                  disabled={!generatedText}
                  className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-white transition-colors font-medium shadow-sm ${
                    copied ? 'bg-green-600' : 'bg-green-600 hover:bg-green-700 disabled:bg-gray-300'
                  }`}
                >
                  {copied ? <><Check className="w-5 h-5 mr-2" /> Copiado!</> : <><Copy className="w-5 h-5 mr-2" /> Copiar para WhatsApp</>}
                </button>
                
                {activeTab === 'ai' && (
                    <button
                    onClick={handleGenerateAI}
                    className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                    title="Gerar outra opção"
                    >
                    <RefreshCcw className="w-5 h-5" />
                    </button>
                )}
              </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateMessageModal;