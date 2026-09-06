# PATRON

PATRON is a private tip jar for creators on the STRK20 pool. Two fans can tip one creator without turning the public chain into a client list. The public board shows a count and an aggregate; the in-pool sender/recipient graph remains inside STRK20 notes.

## The first user moment

Fan A tips a creator. Fan B tips the same creator. The creator sees two supporters in PATRON's book, but a chain observer sees only pool-edge activity. The creator can unshield a slice to a public address when they want to spend it.

## Honest boundary

PATRON does not index pool events — private transfers are invisible to any indexer by design. The creator book on `/creator` shows a self-reported supporter count plus, once the creator connects a wallet, a wallet-mediated read of their own shielded balance through the Wallet API (the app never sees a viewing key, and the read fires only on an explicit click). The `/tip` and `/pool` flows call the Wallet API against Starknet mainnet when a user connects a compatible wallet and has already shielded funds.

The pool charges a flat fee per private operation; PATRON reads it live from the pool and blocks or warns on tips small enough to be mostly fee. Shielding is public. A shield immediately followed by a tip can be correlated, so the app tells users to use an already-mature shielded balance and names the wallet's two deposit prompts (approve, then deposit) up front. PATRON never handles viewing keys or private keys.
