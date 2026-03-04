import React, { useState } from 'react';
import { Customer, PortfolioStatus } from '../types';
import { getCustomerStatus, formatDate } from '../utils/dateUtils';
import { RefreshCcw, MessageCircle, Calendar, AlertTriangle, Edit } from './Icons';

interface CustomerListProps {
    customers: Customer[];
    onRegisterPurchase: (id: string) => void;
    onOpenMessage: (customer: Customer) => void;
    onEditCustomer: (customer: Customer) => void;
}

const CustomerList: React.FC<CustomerListProps> = ({ customers, onRegisterPurchase, onOpenMessage, onEditCustomer }) => {
    const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);

    const formatPhone = (value: string) => {
        const digits = String(value || '').replace(/\D/g, '');
        if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        return value || '-';
    };

    const formatCnpj = (value?: string) => {
        const digits = String(value || '').replace(/\D/g, '');
        if (digits.length !== 14) return value || '-';
        return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    };

    if (customers.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                <p className="text-gray-500 text-lg">Nenhum cliente encontrado com estes critérios.</p>
            </div>
        );
    }

    const toggleExpand = (id: string) => {
        if (expandedCustomerId === id) {
            setExpandedCustomerId(null);
        } else {
            setExpandedCustomerId(id);
        }
    };

    return (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            {/* Header da Lista (Visível apenas em Desktop) */}
            <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="col-span-3">Cliente / Empresa</div>
                <div className="col-span-2">Contato</div>
                <div className="col-span-2">CNPJ</div>
                <div className="col-span-2">Dias para sair</div>
                <div className="col-span-1 text-center">Status</div>
                <div className="col-span-2 text-right">Ações</div>
            </div>

            <div className="divide-y divide-gray-200">
                {customers.map((customer) => {
                    const statusData = getCustomerStatus(customer.lastPurchaseDate, customer.retentionLimit);
                    const isRisk = statusData.status === PortfolioStatus.AT_RISK;
                    const isProspecting = statusData.status === PortfolioStatus.PROSPECTING;
                    const isMonitoring = customer.ownerType === 'other';
                    const isExpanded = expandedCustomerId === customer.id;

                    let statusBadge = null;

                    if (isMonitoring) {
                        const daysOver = statusData.daysSinceLastPurchase - statusData.retentionLimit;
                        if (isProspecting) {
                            statusBadge = (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Disponível ({daysOver > 0 ? daysOver : 0}d)
                                </span>
                            );
                        } else {
                            statusBadge = (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    Acompanhando
                                </span>
                            );
                        }
                    } else {
                        if (isRisk) {
                            statusBadge = (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                    <AlertTriangle className="w-3 h-3 mr-1" /> Risco
                                </span>
                            );
                        } else if (isProspecting) {
                            statusBadge = (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Fora da Carteira
                                </span>
                            );
                        } else {
                            statusBadge = (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Ativo
                                </span>
                            );
                        }
                    }

                    return (
                        <div key={customer.id} className={`transition-colors ${isExpanded ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>

                            {/* LINHA RESUMIDA (Clicável) */}
                            <div
                                onClick={() => toggleExpand(customer.id)}
                                className="cursor-pointer p-4 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center"
                            >
                                {/* Coluna 1: Nome e Empresa */}
                                <div className="md:col-span-3 flex flex-col justify-center">
                                    <span className="text-sm font-bold text-gray-900 truncate">{customer.name}</span>
                                    {customer.companyName && (
                                        <span className="text-xs text-gray-500 truncate">{customer.companyName}</span>
                                    )}
                                </div>

                                {/* Coluna 2: Contato */}
                                <div className="md:col-span-2 text-sm text-gray-600 flex items-center gap-2 md:block">
                                    <span className="md:hidden font-medium text-gray-700 mr-2">Tel:</span>
                                    {formatPhone(customer.phone)}
                                </div>

                                {/* Coluna 3: CNPJ */}
                                <div className="md:col-span-2 text-sm text-gray-500 hidden md:block truncate">
                                    {formatCnpj(customer.cnpj)}
                                </div>

                                {/* Coluna 4: Dias para sair */}
                                <div className="md:col-span-2 text-sm hidden md:block">
                                    {statusData.daysRemaining > 0 ? (
                                        <span className="text-gray-700 font-medium">{statusData.daysRemaining} dias</span>
                                    ) : (
                                        <span className="text-red-700 font-medium">Expirado</span>
                                    )}
                                </div>

                                {/* Coluna 5: Badge e Indicador */}
                                <div className="md:col-span-1 flex justify-between md:justify-center items-center">
                                    <div className="md:hidden text-xs text-gray-400">{customer.cnpj}</div>
                                    <div className="flex items-center gap-3">
                                        {statusBadge}
                                    </div>
                                </div>

                                {/* Coluna 6: Acoes rapidas */}
                                <div className="md:col-span-2 flex items-center justify-end gap-2">
                                    {(isRisk || isProspecting) && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onOpenMessage(customer); }}
                                            className="hidden md:inline-flex items-center px-2.5 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                                        >
                                            <MessageCircle className="w-3.5 h-3.5 mr-1" /> Enviar
                                        </button>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <svg
                                            className={`w-5 h-5 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* ÁREA EXPANDIDA (Detalhes e Ações) */}
                            {isExpanded && (
                                <div className="px-4 pb-4 pt-0 md:px-8 md:pb-6 md:pt-2 border-t border-gray-100 md:border-none animate-in fade-in duration-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/50 p-4 rounded-md border border-gray-100">

                                        {/* Detalhes */}
                                        <div className="space-y-2 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-blue-500" />
                                                <span>Última compra: <strong>{formatDate(customer.lastPurchaseDate)}</strong></span>
                                                <span className="text-gray-400">({statusData.daysSinceLastPurchase} dias atrás)</span>
                                            </div>

                                            {customer.email && (
                                                <div className="flex items-center gap-2">
                                                    <span className="w-4 text-center text-gray-400">@</span>
                                                    <span>{customer.email}</span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 mt-2">
                                                {statusData.daysRemaining > 0 ? (
                                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                        Restam {statusData.daysRemaining} dias na carteira
                                                    </span>
                                                ) : (
                                                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                                        Excedeu prazo em {Math.abs(statusData.daysRemaining)} dias
                                                    </span>
                                                )}
                                                {customer.retentionLimit !== 75 && customer.retentionLimit && (
                                                    <span className="text-xs text-gray-400 border border-gray-200 px-1 rounded">Meta: {customer.retentionLimit}d</span>
                                                )}
                                            </div>

                                            <div className="text-xs text-gray-500">
                                                Telefone: <span className="font-medium text-gray-700">{formatPhone(customer.phone)}</span>
                                            </div>
                                        </div>

                                        {/* Botões de Ação */}
                                        <div className="flex flex-wrap gap-2 justify-start md:justify-end items-center mt-2 md:mt-0">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onEditCustomer(customer); }}
                                                className="flex items-center px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors"
                                            >
                                                <Edit className="w-4 h-4 mr-1" /> Editar
                                            </button>

                                            <button
                                                onClick={(e) => { e.stopPropagation(); onOpenMessage(customer); }}
                                                className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                                            >
                                                <MessageCircle className="w-4 h-4 mr-1" /> Mensagem
                                            </button>

                                            <button
                                                onClick={(e) => { e.stopPropagation(); onRegisterPurchase(customer.id); }}
                                                className="flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors shadow-sm"
                                            >
                                                <RefreshCcw className="w-4 h-4 mr-1" /> Nova Compra
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CustomerList;
