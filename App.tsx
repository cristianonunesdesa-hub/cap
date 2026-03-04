import { useState, useEffect } from 'react';
import { Users, AlertTriangle, Archive, Plus, Check, Calendar, Settings, LogOut } from './components/Icons';
import CustomerList from './components/CustomerList';
import CustomerModal from './components/AddCustomerModal';
import GenerateMessageModal from './components/GenerateMessageModal';
import ApiKeyModal from './components/ApiKeyModal';
import LoginScreen from './components/LoginScreen';
import { Customer, TabView, PortfolioStatus } from './types';
import { getCustomerStatus, getTodayISO } from './utils/dateUtils';
import { hasSecuritySetup } from './utils/security';
import { supabase, db, isSupabaseConfigured } from './services/supabase';

// Seed data to show initially if empty (Only used if no existing data found at all)
const INITIAL_DATA: Customer[] = [
  { id: '1', name: 'Carlos Mendes', companyName: 'Mendes Varejo', phone: '(11) 98888-7777', lastPurchaseDate: getTodayISO(), ownerType: 'me' },
  { id: '2', name: 'Ana Pereira', companyName: 'Mercado Central', phone: '(21) 97777-6666', lastPurchaseDate: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], ownerType: 'me' },
  { id: '3', name: 'Roberto Santos', companyName: 'Santos & Filhos', phone: '(31) 96666-5555', lastPurchaseDate: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], ownerType: 'me' },
];

export default function App() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasSetup, setHasSetup] = useState(false);

  // App State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeTab, setActiveTab] = useState<TabView>('portfolio');

  // Modal States
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerForMessage, setSelectedCustomerForMessage] = useState<Customer | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Check if security is set up on mount and listen for Supabase Auth
  useEffect(() => {
    setHasSetup(hasSecuritySetup());
    if (!isSupabaseConfigured || !supabase) {
      setIsAuthenticated(false);
      setCustomers([]);
      return;
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setIsAuthenticated(true);
        loadCustomers(); // Load data from DB when logged in
      } else {
        setIsAuthenticated(false);
        setCustomers([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await db.getCustomers();
      // Map snake_case from DB back to camelCase for the frontend
      const mapped = data.map((c: any) => ({
        ...c,
        companyName: c.company_name,
        lastPurchaseDate: c.last_purchase_date,
        retentionLimit: c.retention_limit,
        ownerType: c.owner_type
      }));
      setCustomers(mapped.length > 0 ? mapped : INITIAL_DATA);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      showToast("Erro ao carregar dados do servidor.");
    }
  };

  // No longer saving to localStorage via AES in effect
  // Persistent data is now handled via explicit DB calls in handleSaveCustomer and registerPurchase

  const handleLoginSuccess = () => {
    // Session is handled by onAuthStateChange listener
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    if (!supabase) {
      setIsAuthenticated(false);
      setCustomers([]);
      return;
    }
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setCustomers([]);
      showToast("Sessão encerrada com sucesso.");
    } catch (err) {
      showToast("Erro ao sair do sistema.");
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveCustomer = async (data: Omit<Customer, 'id'> | Customer) => {
    try {
      const saved = await db.saveCustomer(data);
      // Map back for UI
      const mapped: Customer = {
        ...saved,
        companyName: (saved as any).company_name,
        lastPurchaseDate: (saved as any).last_purchase_date,
        retentionLimit: (saved as any).retention_limit,
        ownerType: (saved as any).owner_type
      };

      if ('id' in data) {
        setCustomers((prev) => prev.map(c => c.id === mapped.id ? mapped : c));
        showToast("Cliente atualizado no banco!");
      } else {
        setCustomers((prev) => [mapped, ...prev]);
        showToast("Cliente salvo na nuvem!");
      }
    } catch (err: any) {
      console.error('Erro detalhado:', err);
      const msg = err.message || "Erro desconhecido";
      showToast(`Erro no Banco: ${msg}`);
    }
  };

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setIsCustomerModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsCustomerModalOpen(true);
  };

  const registerPurchase = async (id: string) => {
    const today = getTodayISO();
    const customer = customers.find(c => c.id === id);
    if (!customer) return;

    try {
      await db.saveCustomer({ ...customer, lastPurchaseDate: today });
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, lastPurchaseDate: today } : c
        )
      );
      showToast("Compra registrada na nuvem!");
    } catch (err: any) {
      console.error('Erro detalhado:', err);
      const msg = err.message || "Erro desconhecido";
      showToast(`Erro na compra: ${msg}`);
    }
  };

  // --- RENDER LOGIN SCREEN IF NOT AUTHENTICATED ---
  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLogin={handleLoginSuccess}
        isFirstAccess={!hasSetup}
        supabaseConfigured={isSupabaseConfigured}
      />
    );
  }

  // --- MAIN APP ---

  // Filter customers based on active tab and search
  const filteredCustomers = customers.filter((customer) => {
    const statusData = getCustomerStatus(customer.lastPurchaseDate, customer.retentionLimit);
    const q = searchQuery.toLowerCase();

    // 1. Apply Search Filter
    const matchesSearch =
      customer.name.toLowerCase().includes(q) ||
      (customer.companyName && customer.companyName.toLowerCase().includes(q)) ||
      (customer.cnpj && customer.cnpj.includes(q));

    if (!matchesSearch) return false;

    // 2. Apply Tab Logic
    if (activeTab === 'monitoring') {
      return customer.ownerType === 'other';
    }

    // All other tabs are for "my" customers
    if (customer.ownerType !== 'me') return false;

    if (activeTab === 'portfolio') {
      // "Minha Carteira" shows ACTIVE and AT_RISK
      return statusData.status === PortfolioStatus.ACTIVE || statusData.status === PortfolioStatus.AT_RISK;
    } else if (activeTab === 'risk') {
      // "Próximos de Sair" shows only AT_RISK
      return statusData.status === PortfolioStatus.AT_RISK;
    } else {
      // "Prospecção" shows PROSPECTING
      return statusData.status === PortfolioStatus.PROSPECTING;
    }
  }).sort((a, b) => {
    // Sort logic
    if (activeTab !== 'prospecting' && activeTab !== 'monitoring') {
      // Ascending: Oldest date first (closest to leaving)
      return a.lastPurchaseDate.localeCompare(b.lastPurchaseDate);
    }
    // Descending: Newest date first 
    return b.lastPurchaseDate.localeCompare(a.lastPurchaseDate);
  });

  // Counts for badges (Own Customers)
  const riskCount = customers.filter(c => c.ownerType === 'me' && getCustomerStatus(c.lastPurchaseDate, c.retentionLimit).status === PortfolioStatus.AT_RISK).length;
  const prospectCount = customers.filter(c => c.ownerType === 'me' && getCustomerStatus(c.lastPurchaseDate, c.retentionLimit).status === PortfolioStatus.PROSPECTING).length;
  const monitoringCount = customers.filter(c => c.ownerType === 'other').length;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">

            {/* Logo & Title */}
            <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-start">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Carteira Atacado</h1>
              </div>

              <div className="flex gap-2 lg:hidden">
                <button onClick={() => setIsApiKeyModalOpen(true)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full" title="Configurações">
                  <Settings className="w-5 h-5" />
                </button>
                <button onClick={handleLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-full" title="Sair">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="w-full lg:flex-1 lg:max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por nome, empresa ou CNPJ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow shadow-sm"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="flex gap-2 w-full lg:w-auto">
              <button
                onClick={() => setIsApiKeyModalOpen(true)}
                className="hidden lg:flex items-center justify-center px-3 py-2 text-gray-500 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                title="Configurações e API Key"
              >
                <Settings className="w-5 h-5" />
              </button>

              <button
                onClick={handleLogout}
                className="hidden lg:flex items-center justify-center px-3 py-2 text-red-500 hover:bg-red-50 rounded-md transition-colors gap-2"
                title="Sair do Sistema"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Sair</span>
              </button>

              <button
                onClick={handleOpenAdd}
                className="flex-1 lg:flex-none flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-5 h-5 mr-2" />
                Novo Cliente
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto">
          <nav className="-mb-px flex space-x-6 md:space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
                ${activeTab === 'portfolio'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              <Users className="w-4 h-4" />
              Minha Carteira
            </button>

            <button
              onClick={() => setActiveTab('risk')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors relative
                ${activeTab === 'risk'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              <AlertTriangle className="w-4 h-4" />
              Próximos de Sair
              {riskCount > 0 && (
                <span className="ml-1 bg-orange-100 text-orange-600 py-0.5 px-2 rounded-full text-xs font-bold">
                  {riskCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('prospecting')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
                ${activeTab === 'prospecting'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              <Archive className="w-4 h-4" />
              Prospecção
              {prospectCount > 0 && (
                <span className="ml-1 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs font-bold">
                  {prospectCount}
                </span>
              )}
            </button>

            <div className="w-px h-8 bg-gray-300 my-auto hidden md:block"></div>

            <button
              onClick={() => setActiveTab('monitoring')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
                ${activeTab === 'monitoring'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              <Calendar className="w-4 h-4" />
              Acompanhamento
              {monitoringCount > 0 && (
                <span className="ml-1 bg-purple-100 text-purple-600 py-0.5 px-2 rounded-full text-xs font-bold">
                  {monitoringCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            {activeTab === 'portfolio' && "Minha Carteira Ativa"}
            {activeTab === 'risk' && "Atenção: Risco de Perda"}
            {activeTab === 'prospecting' && "Fora da Carteira"}
            {activeTab === 'monitoring' && "Monitoramento de Outros Vendedores"}
          </h2>
          <p className="text-sm text-gray-500">
            {activeTab === 'portfolio' && "Clientes sob sua gestão dentro do prazo de retenção."}
            {activeTab === 'risk' && "Clientes que precisam de atenção imediata para não caírem em prospecção (últimos 15 dias do prazo)."}
            {activeTab === 'prospecting' && "Seus clientes que excederam o limite de retenção sem comprar."}
            {activeTab === 'monitoring' && "Acompanhe quanto tempo falta para clientes de outros vendedores ficarem disponíveis."}
          </p>
        </div>

        <CustomerList
          customers={filteredCustomers}
          onRegisterPurchase={registerPurchase}
          onOpenMessage={(c) => setSelectedCustomerForMessage(c)}
          onEditCustomer={handleOpenEdit}
        />
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center animate-bounce">
          <Check className="w-5 h-5 mr-2" />
          {toastMessage}
        </div>
      )}

      {/* Modals */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSave={handleSaveCustomer}
        customerToEdit={editingCustomer}
      />

      <GenerateMessageModal
        isOpen={!!selectedCustomerForMessage}
        customer={selectedCustomerForMessage}
        onClose={() => setSelectedCustomerForMessage(null)}
      />

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />
    </div>
  );
}
