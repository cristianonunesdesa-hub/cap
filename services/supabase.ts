/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import { Customer } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Authentication will not work.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Database Helpers
export const db = {
  async getCustomers() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('last_purchase_date', { ascending: true });

    if (error) throw error;
    return (data || []) as Customer[];
  },

  async saveCustomer(customer: Omit<Customer, 'id'> | Customer) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const customerData: any = {
      user_id: user.id,
      name: customer.name,
      company_name: customer.companyName,
      cnpj: customer.cnpj,
      phone: customer.phone,
      last_purchase_date: customer.lastPurchaseDate,
      retention_limit: customer.retentionLimit || 90,
      owner_type: customer.ownerType || 'me'
    };

    // If customer has an ID, include it for upsert to work correctly
    if ('id' in customer && customer.id && customer.id !== '') {
      customerData.id = customer.id;
    }

    const { data, error } = await supabase
      .from('customers')
      .upsert(customerData)
      .select()
      .single();

    if (error) {
      console.error('Supabase Error:', error);
      throw error;
    }
    return data as Customer;
  },

  async deleteCustomer(id: string) {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
