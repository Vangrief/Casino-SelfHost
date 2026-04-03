import { create } from 'zustand';
import type { TransactionDTO } from '@casino/shared';

interface WalletState {
  transactions: TransactionDTO[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  setTransactions: (data: { data: TransactionDTO[]; total: number; page: number; pageSize: number }) => void;
  setLoading: (loading: boolean) => void;
}

export const useWalletStore = create<WalletState>()((set) => ({
  transactions: [],
  total: 0,
  page: 1,
  pageSize: 20,
  loading: false,
  setTransactions: (data) =>
    set({
      transactions: data.data,
      total: data.total,
      page: data.page,
      pageSize: data.pageSize,
    }),
  setLoading: (loading) => set({ loading }),
}));
