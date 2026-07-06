/**
 * API Adapter
 * 
 * Switches between local storage (for dev/offline) and remote API (production).
 * Controlled by import.meta.env.VITE_USE_API or similar logic.
 * Currently defaulting to LOCAL for transition.
 */

import { Quotation, Client, Invoice, Receipt } from "./types";

const USE_API = import.meta.env.VITE_USE_API === 'true';

// Mock/LocalStorage Implementation
const LocalAPI = {
  // Clients
  getClients: async (): Promise<Client[]> => {
    const raw = localStorage.getItem('clients');
    return raw ? JSON.parse(raw) : [];
  },
  
  createClient: async (client: Client): Promise<Client> => {
    const clients = await LocalAPI.getClients();
    clients.push(client);
    localStorage.setItem('clients', JSON.stringify(clients));
    return client;
  },

  // Quotations
  getQuotations: async (): Promise<Quotation[]> => {
    const raw = localStorage.getItem('quotations');
    return raw ? JSON.parse(raw) : [];
  },
  
  // Invoices
  getInvoices: async (): Promise<Invoice[]> => {
     const raw = localStorage.getItem('invoices');
     return raw ? JSON.parse(raw) : [];
  },
  
  // Receipts
  getReceipts: async (): Promise<Receipt[]> => {
     const raw = localStorage.getItem('receipts');
     return raw ? JSON.parse(raw) : [];
  }
};

// Remote API Implementation (Stubs for now)
const RemoteAPI = {
  getClients: async (): Promise<Client[]> => {
    const res = await fetch('/api/clients');
    if (!res.ok) throw new Error('Failed to fetch clients');
    return res.json();
  },
  // ... implement others
};

export const api = USE_API ? RemoteAPI : LocalAPI;
