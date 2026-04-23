# Proof-of-Presence — Manual Protocol

> An open attendance protocol built on Stellar Soroban. Anyone can open a
> class, anyone can join — you compute your key by hand, sign the
> challenge, and the contract mints a soulbound NFT as proof. Verified by
> math, not by a server.

**Live:** https://presence-toy-rsa.vercel.app
**Contract (testnet):** [`CDNQA5P2EOSRGAS4DTZKVTZRVWEDWTFRG7NZDUOBLU3X3PCUOAHF7NSY`](https://stellar.expert/explorer/testnet/contract/CDNQA5P2EOSRGAS4DTZKVTZRVWEDWTFRG7NZDUOBLU3X3PCUOAHF7NSY)

---

## How it works (5 steps)

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. PAPER     Each participant generates (n, e, d) by hand        │
│ 2. ON-CHAIN  Register only the public part (n, e)                │
│ 3. CHALLENGE Host issues a random m to each participant          │
│ 4. PEN       Participant computes s = m^d mod n on paper         │
│ 5. DIPLOMA   On close, the contract mints a soulbound NFT        │
└──────────────────────────────────────────────────────────────────┘
```

The contract verifies `s^e mod n == m`. If it does, attendance counts.
That's the whole protocol — no servers, no roll sheets, no cameras.

> ⚠️ **This is Toy RSA.** With `n < 100` it is mathematically correct but
> cryptographically broken in seconds. It exists to teach the mechanism;
> never use these parameters for anything that matters.

---

# Doing it on paper

Two manual jobs: **(A)** make a key once, **(B)** sign each challenge.

## A. Build your key `(n, e, d)`

| step | operation | example |
|---|---|---|
| 1 | pick two small primes `p`, `q` | p = 7, q = 11 |
| 2 | multiply: `n = p · q` | n = 77 |
| 3 | totient: `φ = (p−1)(q−1)` | φ = 6·10 = 60 |
| 4 | choose `e` coprime with φ (gcd(e, φ) = 1) | e = 7 |
| 5 | find `d` such that `e · d ≡ 1 (mod φ)` | d = 43 |

You publish `(n, e)`. You keep `d` on your paper, forever.

### How to find `d` (brute force)

You want an integer `d` such that `e·d − 1` is a multiple of `φ`. Try
`k = 1, 2, 3, …` until `(k·φ + 1)` is divisible by `e`:

```
e·d = k·φ + 1     →     d = (k·φ + 1) / e

φ=60, e=7:
 k=1 →  61 / 7 = 8.71  ✗
 k=2 → 121 / 7 = 17.28 ✗
 k=3 → 181 / 7 = 25.85 ✗
 k=4 → 241 / 7 = 34.42 ✗
 k=5 → 301 / 7 = 43    ✓     d = 43
```

For tiny `n` brute force is plenty. (For real RSA you'd use the extended
Euclidean algorithm — same idea, fewer false starts.)

### Pre-baked pairs to play with

All have `n ≤ 99`, so they fit on one line of a notebook:

| p · q | n   | φ   | e | d   | note                       |
|-------|-----|-----|---|-----|----------------------------|
| 7·11  | **77**  | 60  | 7 | **43**  | default in the app         |
| 7·13  | 91  | 72  | 5 | 29  |                            |
| 5·17  | 85  | 64  | 5 | **13**  | small d → fast signing     |
| 5·19  | 95  | 72  | 5 | 29  |                            |
| 11·13 | 143 | 120 | 7 | 103 | larger but still by hand   |

### Rules of thumb

1. `e` must be **coprime with φ** — if `φ` is even, avoid even `e`.
2. **Smaller `e`** → contract verifies faster. `e ∈ {3, 5, 7}` is great.
3. **Smaller `d`** → less paperwork when signing.
4. **Never type `d`** anywhere. Only `(n, e)` leaves the page.

---

## B. Sign a challenge `m`

The host calls `issue_challenges` and the contract picks a random `m`
for each participant. Your job: compute `s = m^d mod n` on paper.

### Trick: square-and-multiply

`m^d mod n` with `d = 43` would mean 43 multiplications. Instead, decompose
`d` into powers of two and only do `log₂(d)` squarings.

**Example:** sign `m = 2` with `(n, e, d) = (77, 7, 43)`.

**1. Decompose `d` in binary:**

```
43 = 32 + 8 + 2 + 1     ← only these powers of two are "on"
```

**2. Build powers of `m` mod `n`, doubling each time:**

| power | value | how                          |
|------:|------:|-------------------------------|
|   2¹  |     2 | start                         |
|   2²  |     4 | 2² = 4                        |
|   2⁴  |    16 | 4² = 16                       |
|   2⁸  |    25 | 16² = 256 ≡ 256 − 3·77 = 25   |
|   2¹⁶ |     9 | 25² = 625 ≡ 625 − 8·77 = 9    |
|   2³² |     4 | 9² = 81 ≡ 81 − 77 = 4         |

**3. Multiply only the rows whose bits are "on":**

```
s = 2³² · 2⁸ · 2² · 2¹  (mod 77)
  =  4   · 25 ·  4 ·  2
  =       800
  ≡  800 − 10·77 = 30

s = 30
```

**4. (Optional) double-check before submitting:**

```
s^e mod n = 30^7 mod 77  ─→  must equal m = 2
```

You only ever type `s`. The contract runs `s^e mod n` and compares it to
the original `m` it stored when challenges were issued.

### Verified vectors (n=77, e=7, d=43)

| m | s = m^d mod n | check s^e mod n |
|---|---------------|-----------------|
| 2 | 30            | 30^7 mod 77 = 2 ✓ |
| 3 | 38            | 38^7 mod 77 = 3 ✓ |
| 5 | 26            | 26^7 mod 77 = 5 ✓ |

---

# Stack

- **Smart contract**: Rust + Soroban SDK ([`contracts/attendance/`](./contracts/attendance/src/lib.rs))
- **Frontend**: React 19 + Vite + TypeScript
- **Wallet**: StellarWalletsKit (Freighter / Albedo / xBull / Lobstr)
- **Network**: Stellar testnet via Soroban RPC
- **Deploy**: Vercel (frontend) + Stellar testnet (contract)

---

# Local development

Requirements: [Rust](https://rustup.rs), [Node 22+](https://nodejs.org),
[Stellar CLI](https://github.com/stellar/stellar-cli), and the Scaffold
Stellar plugin.

```bash
# install deps
HUSKY=0 npm install --workspaces --include-workspace-root

# build the contract package + frontend
npm run build --workspaces --if-present
npm run build

# dev mode (watches the contract + serves the frontend)
npm run dev
```

Visit `http://localhost:5173`. Configure the network and contract id in
`.env` (see `.env.example`).

# Deploy

See [`DEPLOY.md`](./DEPLOY.md) for the Vercel setup. The Soroban contract
is deployed via:

```bash
cargo build --target wasm32v1-none --release -p attendance
stellar contract deploy \
  --wasm target/wasm32v1-none/release/attendance.wasm \
  --source <your-identity> \
  --network testnet \
  --alias attendance
```

Update `PUBLIC_ATTENDANCE_CONTRACT_ID` in your environment with the new
contract id, then regenerate the TypeScript client:

```bash
stellar contract bindings typescript \
  --network testnet \
  --contract-id <new-contract-id> \
  --output-dir packages/attendance \
  --overwrite
(cd packages/attendance && npm install && npm run build)
```

---

_Built for the Dev3Pack edition. Educational use only._
