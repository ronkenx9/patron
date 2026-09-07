# PATRON

PATRON is crowdfunding for creators, open-source teams, and communities on the STRK20 pool. Backers fund what they love without joining a published supporter list: the campaign bar is the sum of public pool-to-treasury STRK transfers in one block window. Amounts and timing stay public. Tipping rides the same rails as the silent gift, which the bar never counts.

## The first user moment

A backer pledges 8 STRK to Night School. The bar reads 8 / 80 STRK — a qualifying pool receipt, verifiable by anyone from STRK transfer events out of the pool. PATRON does not publish who sent it. An observer still sees the amount, the timing, and any earlier public deposit. The creator spends from the treasury when they want; that spend is public too.

## Campaigns

A crowdfund is the tip jar with a goal and a treasury. Backers choose between two rails: a **public pledge** (withdraw from a shielded balance straight to the treasury — the amount is public so anyone can verify the progress bar from STRK transfer events) and a **silent gift** (a plain private tip the bar never counts). The bar is a receipt total: it does not prove unique donors, donor intent, or that the creator did not self-fund. Campaigns are keep-what-you-raise; all-or-nothing refunds would need an escrow contract, which the owner would have to write and audit, so v1 ships without one. A campaign goes live only when the owner names a real treasury and the block to start counting from, and no other live campaign already uses that treasury.

## Honest boundary

PATRON does not index silent gifts. The creator book on `/creator` shows a self-reported supporter count plus, once the creator connects a wallet, a wallet-mediated read of their own shielded balance through the Wallet API (the app never sees a viewing key, and the read fires only on an explicit click). The `/tip` and `/pool` flows call the Wallet API against Starknet mainnet when a user connects a compatible wallet and has already shielded funds.

The pool charges a flat fee per private operation; PATRON reads it live from the pool and blocks or warns on tips small enough to be mostly fee. Shielding is public. A shield immediately followed by a tip can be correlated, so the app tells users to use an already-mature shielded balance and names the wallet's two deposit prompts (approve, then deposit) up front. PATRON never handles viewing keys or private keys. Relayed transactions are not attributed to `tx.from`; that is not a claim of untraceability.
