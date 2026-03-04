import React, { useState, useEffect } from 'react';
import { X, Plus, Check } from './Icons';
import { Customer } from '../types';
import { getTodayISO, DEFAULT_PORTFOLIO_LIMIT_DAYS } from '../utils/dateUtils';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Omit<Customer, 'id'> | Customer) => void;
  customerToEdit?: Customer | null;
}

const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, onSave, customerToEdit }) => {
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [lastPurchaseDate, setLastPurchaseDate] = useState(getTodayISO());
  const [ownerType, setOwnerType] = useState<'me' | 'other'>('me');
  const [retentionLimit, setRetentionLimit] = useState(DEFAULT_PORTFOLIO_LIMIT_DAYS);

  // Populate form when editing
  useEffect(() => {
    if (isOpen) {
        if (customerToEdit) {
            setName(customerToEdit.name);
            setCompanyName(customerToEdit.companyName || '');
            setCnpj(customerToEdit.cnpj || '');
            setPhone(customerToEdit.phone);
            setEmail(customerToEdit.email || '');
            setLastPurchaseDate(customerToEdit.lastPurchaseDate);
            setOwnerType(customerToEdit.ownerType);
            setRetentionLimit(customerToEdit.retentionLimit || DEFAULT_PORTFOLIO_LIMIT_DAYS);
        } else {
            // Reset for new customer
            setName('');
            setCompanyName('');
            setCnpj('');
            setPhone('');
            setEmail('');
            setLastPurchaseDate(getTodayISO());
            setOwnerType('me');
            setRetentionLimit(DEFAULT_PORTFOLIO_LIMIT_DAYS);
        }
    }
  }, [isOpen, customerToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = {
      name,
      companyName,
      cnpj,
      phone,
      email,
      lastPurchaseDate,
      ownerType,
      retentionLimit
    };

    if (customerToEdit) {
        onSave({ ...formData, id: customerToEdit.id });
    } else {
        onSave(formData);
    }
    
    onClose();
  };

  if (!isOpen) return null;

  const isEditing = !!customerToEdit;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Tipo de Cadastro */}
          <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Cadastro</label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="ownerType"
                  value="me"
                  checked={ownerType === 'me'}
                  onChange={() => setOwnerType('me')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-800">Minha Carteira</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="ownerType"
                  value="other"
                  checked={ownerType === 'other'}
                  onChange={() => setOwnerType('other')}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-800">Acompanhamento</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: João Silva"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Razão Social"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="00.000.000/0000-00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp *</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="joao@email.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Última Compra</label>
                <input
                type="date"
                value={lastPurchaseDate}
                onChange={(e) => setLastPurchaseDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Retenção (Dias)</label>
                <input
                type="number"
                min="1"
                value={retentionLimit}
                onChange={(e) => setRetentionLimit(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
          </div>
          <p className="text-xs text-gray-500">
             Padrão: {DEFAULT_PORTFOLIO_LIMIT_DAYS} dias. Ajuste se este cliente tiver um ciclo de compra diferente.
          </p>

          <div className="pt-4">
            <button
              type="submit"
              className={`w-full flex items-center justify-center px-4 py-2 text-white rounded-md transition-colors font-medium ${ownerType === 'me' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}
            >
              {isEditing ? <Check className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
              {isEditing ? 'Salvar Alterações' : (ownerType === 'me' ? 'Salvar na Carteira' : 'Salvar no Acompanhamento')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerModal;