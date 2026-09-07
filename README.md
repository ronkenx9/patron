# PATRON — crowdfunding without a public supporter list

PATRON is a crowdfunding platform for creators, open-source teams, and communities, built on the live [STRK20](https://strk20.starknet.io/) pool on Starknet mainnet. A campaign's progress bar is the sum of **qualifying pool receipts**: STRK `Transfer` events from the pool to one campaign treasury inside one block window. PATRON does not publish a supporter list. Amounts, timing, and the deposit that funded a note stay public. A relayer on `tx.from` is not proof of untraceability.

Private tipping rides the same rails as the **silent gift**: a private transfer that is not a qualifying pool receipt, so no bar ever counts it.

It started as a tip jar (RFP-12, private patronage / creator inbound). The pivot: communities don't just want to tip a person — they want to fund things together, without the funding act turning every backer into a public entry on a supporter list.

## How a campaign works

A campaign is a goal, a deadline, and a unique open treasury window. Backers choose between two rails:

- **Public pledge** — a withdrawal from a shielded balance straight to the treasury, through the Wallet API. The amount lands as a normal STRK transfer from the pool to the treasury, so anyone can verify the bar by reading the chain. PATRON does not publish who sent it. The transfer amount, its timing, and any earlier public deposit remain visible.
- **Silent gift** — a plain private transfer to the creator. Not a qualifying pool receipt, so it never moves the bar. Only the creator's own wallet can read it.

The bar cannot prove donor intent, unique donors, or that the creator did not fund the campaign themselves. Pledge counts count **transactions, not people**.

Campaigns are **keep-what-you-raise**: the treasury keeps whatever the bar shows, goal or not. All-or-nothing refunds would need an escrow contract, which the owner would have to write, review, and audit — deliberately not in v1. That disclosure sits next to the pledge control.

Live campaigns cannot share an open treasury. If a treasury is reused, the previous campaign must close with an exclusive `toBlock` so one withdrawal cannot increase two independent totals.

## Privacy model

| Not published by PATRON | Public at the pool edge |
| --- | --- |
| A supporter list | Pledge amounts paid to a campaign treasury |
| Per-backer totals or identity claims | The fact and timing of any pool interaction |
| Silent-gift amounts (wallet-only) | Shield amount, token, and depositor |
| Subsequent spends of notes that stay in the pool | Unshield amounts and destinations |

The honest trade: pledge amounts are public because a verifiable bar is worth more to a campaign than hiding the size of a gift. Timing/amount correlation and deposit visibility still matter. PATRON never attributes activity to `tx.from`; it also does not claim that the absence of a sender field makes the flow untraceable. Shielding is public, and PATRON will not pretend otherwise.

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

1. `/fund` — campaign index and campaign pages. The progress bar reads STRK `Transfer` events (pool → treasury) via `starknet_getEvents` inside one block window. Contributing is a Wallet API `withdraw` from an already-shielded balance.
2. `/tip` — the silent-gift rail on its own: a private transfer to any registered creator, fee-checked, not counted on any bar.
3. `/creator` — the aggregate-only book: a self-reported supporter count, plus a wallet-mediated read of the creator's own shielded balance (the read fires only on an explicit click; the app never sees a viewing key).
4. `/pool` — the shield / private transfer / unshield proof bench used for the sprint's mainnet proof.

## Going live with a campaign

Campaigns are defined in `src/lib/campaigns.ts`. A campaign ships as a **preview** — form off, clearly labelled — until the owner sets:

1. `beneficiary` — the treasury's Starknet address (it receives real STRK; get it right).
2. `fromBlock` — the block where counting starts. Receipts before it never appear on the bar.
3. No other **live** campaign may already use that treasury. To reuse a treasury, close the previous campaign with `toBlock` (exclusive).
4. The `isLive` gate then flips automatically, and the page starts counting receipts from the chain.

Until then the page refuses to fabricate numbers: a preview shows an empty bar, never a fake one. If the event page cap is hit, the UI labels the total as **partial**, not complete.

## Architecture

`/fund` → pledge = Wallet API `withdraw` action to the treasury; bar from `starknet_getEvents` (STRK `Transfer`, pool → treasury, one window)  
`/tip` → Wallet API `transfer` action → STRK20 pool, with a live pool-fee read and size guards  
`/creator` → self-reported aggregate book + wallet-mediated shielded-balance read (`strk20Balances`)  
`/pool` → Wallet API `deposit`, `transfer`, `withdraw` actions  
`src/lib/strk20.ts` → pure action builders and Wallet API invocation  
`src/lib/pool.ts` → pool-fee read (`get_fee_amount`) and size guards  
`src/lib/campaigns.ts` → campaign config, live/closed/preview gate, unique live treasury  
`src/lib/fundIndexer.ts` → receipt indexer: u256 decode, pagination, coverage flag, totals

## Sprint entry (STRK20 Private Sprint)

Public repo, MIT license, live demo, three mainnet pool transactions. The hub reads `strk20.json` at this root.

| Field | Value |
| --- | --- |
| Demo | https://patron-topaz.vercel.app |
| Video | https://patron-topaz.vercel.app/demo.mp4 — pitch Night School, then the live 8/80 bar and the verified receipt |
| Registry | https://github.com/ronkenx9/patron · Telegram `Kenshixronin` |
| Inspired by | RFP-12 |

### Mainnet transactions (live STRK20 pool)

Each hash succeeded on Starknet mainnet and touched pool `0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a`. PATRON deploys no contract of its own — scoring is on the pool, as the hub allows.

| Step | Hash |
| --- | --- |
| Shield (deposit) | [`0x2e0b97e9…dafa`](https://voyager.online/tx/0x2e0b97e9a0294854bd530f7272c377d3282f57d0a46682619946a505d40dafa) |
| Private transfer | [`0x7072d3f3…76bc`](https://voyager.online/tx/0x7072d3f3d612f46d8c7e39877028ae864c5535687ba89604ffd48e0cc0a76bc) |
| Unshield (withdraw to campaign treasury) | [`0xbda1e01e…bc07`](https://voyager.online/tx/0xbda1e01ed58a533fae14a185ec839988a1fdf7927a0cad430ecd199755bc07) |

**Night School** (`/fund/night-school`) is the one live campaign — four STRK20 office-hour sessions, goal 80 STRK, treasury `0x02da976cd4fc7689541d66612491ec49de859f97556c60933407bbd85be0c86f`, counting from block `14518740`. A public pledge of 8 STRK landed from a shielded note:

| Step | Hash |
| --- | --- |
| Unshield / public pledge to Night School | [`0x4a45932d…2a42`](https://voyager.online/tx/0x4a45932de83dc6cf23fc80bf473682b4e7c909d27a9ddf72b72c319d8d82a42) |

The bar reads that as 8 / 80 STRK in qualifying pool receipts. Season 02 is **closed** on the same treasury with `toBlock: 14518740`, so this withdrawal cannot also increase Season 02. `strk20.json` keeps the original shield → transfer → unshield triple.

### What the demo actually proves

The recorded video is a **browser walkthrough of the live site** plus an on-chain receipt:

1. Pitch Night School on `/submit` (unauthenticated review queue).
2. Open the live campaign and wait for the 8 STRK bar.
3. Paste the pledge hash and verify it as a qualifying pool receipt.

The 8 STRK (and the three `strk20.json` hashes) were produced with the **Privacy SDK CLI** against the hosted prover, using a team-owned OpenZeppelin account. That is not the same as a new user's Ready-wallet Wallet API flow completing in the browser. The public app still exposes that Wallet API path (`deposit` / `transfer` / `withdraw` via `WalletAccountV6` on `/pool`, `/fund`, `/tip`); the sprint video does not record a connected-wallet confirmation.

### Integration depth (honest)

| Piece | In PATRON |
| --- | --- |
| Shield / unshield / private transfer | Yes — Wallet API `deposit` / `withdraw` / `transfer` on `/pool`, `/fund`, `/tip` |
| Shielded balance | Yes — wallet-mediated `strk20Balances`, click-gated, no viewing key in the dapp |
| Privacy SDK | Used to produce the mainnet hashes (register → deposit → transfer → withdraw against the hosted prover). The public app stays on the Wallet API so a user's viewing key never leaves their wallet. |
| Anonymizer / stealth accounts | Not shipped. All-or-nothing escrow is specified in `ESCROW_DESIGN.md` and is the owner's Cairo to write and audit. |

Pledge amounts are public on purpose so the bar is chain-verifiable. PATRON does not publish a supporter list. Relayed txs are never attributed to `tx.from`.

## Builder

Kenn Ronin (`@kenn_ronin`), solo builder in Lagos.
