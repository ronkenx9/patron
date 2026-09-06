# PATRON

PATRON is private crowdfunding for creators, open-source teams, and communities on the STRK20 pool. Backers fund what they love without ever joining a supporter list: the campaign bar is verifiable by anyone from chain data, and the people behind the pledges are not on the chain at all. Tipping rides the same rails as the silent gift.

## The first user moment

Backer A pledges 25 STRK to a campaign. Backer B pledges 50. The bar reads 75 STRK — verifiable by anyone, derived from STRK transfer events out of the pool — while an observer sees only pool-edge withdrawals and can never name a backer. The creator unshields the raise when they want to spend it; attribution never leaks, because it never existed on-chain.

## Campaigns

A crowdfund is the tip jar with a goal and a treasury. Backers choose between two rails: a **public pledge** (withdraw from shielded balance straight to the treasury — the amount is public so anyone can verify the progress bar from STRK transfer events, while the backer never appears on-chain) and a **silent gift** (a plain private tip the bar never counts). Campaigns are keep-what-you-raise; all-or-nothing refunds would need an escrow contract, which the owner would have to write and audit, so v1 ships without one. A campaign goes live only when the owner names a real treasury and the block to start counting from — until then the page renders as a preview with the form off.

## Honest boundary

PATRON does not index pool events — private transfers are invisible to any indexer by design. The creator book on `/creator` shows a self-reported supporter count plus, once the creator connects a wallet, a wallet-mediated read of their own shielded balance through the Wallet API (the app never sees a viewing key, and the read fires only on an explicit click). The `/tip` and `/pool` flows call the Wallet API against Starknet mainnet when a user connects a compatible wallet and has already shielded funds.

The pool charges a flat fee per private operation; PATRON reads it live from the pool and blocks or warns on tips small enough to be mostly fee. Shielding is public. A shield immediately followed by a tip can be correlated, so the app tells users to use an already-mature shielded balance and names the wallet's two deposit prompts (approve, then deposit) up front. PATRON never handles viewing keys or private keys.

## Campaigns

A crowdfund is the tip jar with a goal and a treasury. Backers choose between two rails: a **public pledge** (withdraw from shielded balance straight to the treasury — the amount is public so anyone can verify the progress bar from STRK transfer events, while the backer never appears on-chain) and a **silent gift** (a plain private tip the bar never counts). Campaigns are keep-what-you-raise; all-or-nothing refunds would need an escrow contract, which the owner would have to write and audit, so v1 ships without one. A campaign goes live only when the owner names a real treasury and the block to start counting from — until then the page renders as a preview with the form off.
