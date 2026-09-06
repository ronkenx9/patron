# PATRON — private crowdfunding without a supporter list

PATRON is a crowdfunding platform for creators, open-source teams, and communities, built on the live [STRK20](https://strk20.starknet.io/) pool on Starknet mainnet. A campaign's progress bar is verifiable by anyone — it is derived from STRK transfer events out of the pool, not from anyone's word — while the people behind the pledges are not on the chain at all. Private tipping rides the same rails as the **silent gift**: a private transfer no bar ever counts.

It started as a tip jar (RFP-12, private patronage / creator inbound). The pivot: communities don't just want to tip a person — they want to fund things together, without the funding act turning every backer into a public entry on a supporter list.

## How a campaign works

A campaign is a goal, a deadline, and a treasury address. Backers choose between two rails:

- **Public pledge** — a withdrawal from the backer's shielded balance straight to the treasury, through the Wallet API. The amount lands as a normal STRK transfer from the pool to the treasury, so anyone can verify the bar by reading the chain. The backer stays invisible: a relayer submits the transaction and the backer's public wallet never appears.
- **Silent gift** — a plain private transfer to the creator. Invisible to the bar, to any indexer, and to everyone except the creator's own wallet.

Campaigns are **keep-what-you-raise**: the treasury keeps whatever the bar shows, goal or not. All-or-nothing refunds would need an escrow contract, which the owner would have to write, review, and audit — deliberately not in v1.

## Privacy model

| Stays inside the pool | Stays public at the pool edge |
| --- | --- |
| Who pledged, how often, how much in total | Pledge amounts paid to a campaign treasury |
| The backer → creator link of a silent gift | The fact and timing of any pool interaction |
| Silent-gift amounts and shielded balances | Shield amount, token, and depositor |
| Every subsequent spend of a pledged note | Unshield amounts and destinations |

The honest trade, stated plainly: pledge amounts are public because a verifiable bar is worth more to a campaign than pledge privacy. Pledge counts count **transactions, not people** — one wallet can pledge twice, and nobody can prove otherwise. Private transactions are submitted by a relayer, so even the transaction sender says nothing about the user; PATRON never attributes activity to `tx.from`. Shielding is public, and PATRON will not pretend otherwise.

The pool charges a flat fee per private operation (read live from the pool via `get_fee_amount`). Pledges or tips at or below the fee are blocked, and anything near it is warned about — most of that value would go to the pool, not the recipient.

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

1. `/fund` — the main event: campaign index and campaign pages. The progress bar reads STRK `Transfer` events (pool → treasury) via `starknet_getEvents`; contributing is a Wallet API `withdraw` from an already-shielded balance.
2. `/tip` — the silent-gift rail on its own: a private transfer to any registered creator, fee-checked and invisible by design.
3. `/creator` — the aggregate-only book: a self-reported supporter count, plus a wallet-mediated read of the creator's own shielded balance (the read fires only on an explicit click; the app never sees a viewing key).
4. `/pool` — the shield / private transfer / unshield proof bench used for the sprint's mainnet proof.

## Going live with a campaign

Campaigns are defined in `src/lib/campaigns.ts`. A campaign ships as a **preview** — form off, clearly labelled — until the owner sets:

1. `beneficiary` — the treasury's Starknet address (it receives real STRK; get it right).
2. `fromBlock` — the block where counting starts. Pledges withdrawn before it never appear on the bar.
3. The `isLive` gate then flips automatically, and the page starts counting pledges from the chain.

Until then the page refuses to fabricate numbers: a preview shows an empty bar, never a fake one.

## Architecture

`/fund` → pledge = Wallet API `withdraw` action to the treasury; bar from `starknet_getEvents` (STRK `Transfer`, pool → treasury)  
`/tip` → Wallet API `transfer` action → STRK20 pool, with a live pool-fee read and size guards  
`/creator` → self-reported aggregate book + wallet-mediated shielded-balance read (`strk20Balances`)  
`/pool` → Wallet API `deposit`, `transfer`, `withdraw` actions  
`src/lib/strk20.ts` → pure action builders and Wallet API invocation  
`src/lib/pool.ts` → pool-fee read (`get_fee_amount`) and size guards  
`src/lib/campaigns.ts` → campaign config and the live/preview gate  
`src/lib/fundIndexer.ts` → pledge indexer: u256 decode, pagination, totals

## Sprint status

What ships now: the three pool actions against the live mainnet pool, a live pool-fee read, size guards, a wallet-mediated creator balance, and the crowdfunding layer with a chain-derived progress bar — validated against real mainnet event data. `strk20.json` still holds no transaction hashes, no deployed URL, and no video. Those fields are filled only after the owner completes the wallet proof and production deployment; the campaign treasury is configured at the same time.

## Builder

Kenn Ronin (`@kenn_ronin`), solo builder in Lagos.
