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

1. `/tip` — connect a wallet, enter a creator address and a tip amount, then submit a private transfer from an already shielded balance.
2. `/creator` — inspect the aggregate-only demo book.
3. `/pool` — use the small shield / private transfer / unshield proof bench. The sprint's three mainnet transaction hashes will be recorded in `strk20.json` only after they exist and succeed.

## Privacy model

| Stays inside the pool | Stays public at the pool edge |
| --- | --- |
| Fan → creator link for a private transfer | Shield amount, token, and depositor |
| Private transfer amount | The fact and timing of a pool interaction |
| Shielded balances | Unshield amount and destination |

The demo book is not an indexer. It is a fixture until live event indexing is shipped. The app does not claim that a public deposit is private, and it does not attribute relayed activity to `tx.from`.

## Architecture

`/tip` → Wallet API `transfer` action → STRK20 pool  
`/creator` → aggregate-only demo book (live indexer is next)  
`/pool` → Wallet API `deposit`, `transfer`, `withdraw` actions  
`src/lib/strk20.ts` → pure action builders and Wallet API invocation

## Sprint status

The public repository is intentionally honest at the first commit: no mainnet transaction hashes, no deployed URL, and no video are claimed yet. Those fields are filled only after the owner completes the wallet proof and production deployment.

## Builder

Kenn Ronin (`@kenn_ronin`), solo builder in Lagos.
