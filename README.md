# PATRON — private tips without a public client list

PATRON is a creator tip jar built on the live [STRK20](https://strk20.starknet.io/) pool on Starknet mainnet. Two fans can privately tip one creator while the public creator book shows only the number of supporters and the aggregate received.

This is a new project for the STRK20 Private Sprint, inspired by RFP-12 (private patronage / creator inbound). It is not private payroll and it does not custody funds or wallet viewing keys.

## Quickstart

Requires Node 20+ and a privacy-capable Starknet wallet such as [Ready](https://www.ready.co/).

```bash
git clone https://github.com/ronkenx9/patron.git
cd patron
cp .env.example .env.local
npm install
npm test
npm run typecheck
npm run dev
```

Open `http://localhost:3000`.

1. `/tip` — connect a wallet, enter a creator address and a tip amount, then submit a private transfer from an already shielded balance. The page reads the pool's live fee and blocks tips that would be consumed by it.
2. `/fund` — anonymous crowdfunding. A public pledge withdraws a slice of shielded balance straight to the campaign treasury: the amount is public (the progress bar is derived from STRK transfer events, pool → treasury), the backer is not on the chain at all. A silent gift is a plain private tip the bar never sees.
3. `/creator` — the aggregate-only book: a self-reported supporter count, plus a wallet-mediated read of the creator's own shielded balance once they connect (the read fires only on an explicit click).
4. `/pool` — the shield / private transfer / unshield proof bench. The sprint's three mainnet transaction hashes will be recorded in `strk20.json` only after they exist and succeed.

## Privacy model

| Stays inside the pool | Stays public at the pool edge |
| --- | --- |
| Fan → creator link for a private transfer | Shield amount, token, and depositor |
| Private transfer amount | The fact and timing of a pool interaction |
| Shielded balances | Unshield amount and destination |

The creator book is not an indexer. Private transfers are invisible to any indexer by design, so `/creator` shows a self-reported supporter count and, once the creator connects a wallet, a wallet-mediated read of their own shielded balance through the Wallet API (`strk20Balances` — the app never sees a viewing key). The app does not claim that a public deposit is private, and it does not attribute relayed activity to `tx.from`.

The pool's flat fee per private operation is public state, read live from the pool (`get_fee_amount`). Tips at or below the fee are blocked and tips under twice the fee are warned about, because most of that value would go to the pool rather than the creator.

Crowdfunding leans the other way on purpose: a pledge is a withdrawal to the treasury, so the amount is public — that is what makes the progress bar verifiable by anyone. The backer stays private because the transaction is relayed and their public wallet never appears. Pledge counts count transactions, not people. Campaigns are keep-what-you-raise; all-or-nothing refunds would need an escrow contract and are deliberately not in this version.

## Architecture

`/tip` → Wallet API `transfer` action → STRK20 pool, with a live pool-fee read and a tip-size guard  
`/fund` → pledges via Wallet API `withdraw` action to the treasury; bar derived from `starknet_getEvents` (STRK `Transfer`, pool → treasury)  
`/creator` → self-reported aggregate book + wallet-mediated shielded-balance read (`strk20Balances`)  
`/pool` → Wallet API `deposit`, `transfer`, `withdraw` actions  
`src/lib/strk20.ts` → pure action builders and Wallet API invocation  
`src/lib/pool.ts` → pool-fee read (`get_fee_amount`) and size guards  
`src/lib/campaigns.ts` → campaign config (a campaign goes live only when the owner names a treasury and a start block)  
`src/lib/fundIndexer.ts` → pledge indexer: u256 decode, pagination, totals

## Sprint status

What ships now: the three pool actions against the live mainnet pool, a live pool-fee read, tip-size guards, and a wallet-mediated creator balance. `strk20.json` still holds no transaction hashes, no deployed URL, and no video — those fields are filled only after the owner completes the wallet proof and production deployment.

## Builder

Kenn Ronin (`@kenn_ronin`), solo builder in Lagos.
