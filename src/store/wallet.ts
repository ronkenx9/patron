"use client";

import { create } from "zustand";
import type { WalletAccountV6 } from "starknet";

type WalletState = {
  account?: WalletAccountV6;
  address?: string;
  connected: boolean;
  strk20: boolean;
  setWallet: (account: WalletAccountV6, address: string, strk20: boolean) => void;
  reset: () => void;
};

export const useWallet = create<WalletState>((set) => ({
  connected: false,
  strk20: false,
  setWallet: (account, address, strk20) => set({ account, address, connected: true, strk20 }),
  reset: () => set({ account: undefined, address: undefined, connected: false, strk20: false }),
}));
