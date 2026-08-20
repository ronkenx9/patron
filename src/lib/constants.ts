import { RpcProvider, type ProviderInterface } from "starknet";

export const POOL_ADDRESS = "0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a";
export const STRK_ADDRESS = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
export const SN_MAIN = "0x534e5f4d41494e";
export const MAINNET_RPC = "https://rpc.starknet.lava.build";
export const NOTE_MATURITY_BLOCKS = 10;
export const TX_WAIT_MS = 180_000;

export function rpcUrl(): string {
  return process.env.NEXT_PUBLIC_STARKNET_RPC || MAINNET_RPC;
}

export function makeProvider(): ProviderInterface {
  return new RpcProvider({ nodeUrl: rpcUrl() });
}

export function explorerTx(hash: string): string {
  return `https://voyager.online/tx/${hash}`;
}
