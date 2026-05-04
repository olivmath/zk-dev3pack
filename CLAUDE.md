# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo shape

Two distinct halves — treat them differently:

| Path | Nature | Edits expected |
|---|---|---|
| `01-…` … `08-…/` | Study notes from ZK & Privacy Bootcamp (Apr–May 2026) | Mostly READMEs + raw transcripts + slides; no build, no code |
| `projects/attendance-toy-rsa/` | Live Stellar Soroban dApp (Toy RSA proof-of-presence) | All code/build/test work happens here |

Top-level `README.md` is the bootcamp index. Course folders contain `README.md` (curated notes), `transcript-raw.md` (NotebookLM dump), plus PDFs/slides. There is no monorepo root config — commands run inside the project subdir.

## The active project: `projects/attendance-toy-rsa/`

**Always `cd projects/attendance-toy-rsa/` before running anything below.**

### Stack at a glance

```
contracts/attendance/        Rust + Soroban SDK 23.4 (no_std, target wasm32v1-none)
  src/lib.rs                 AttendanceContract (state machine: Registration → Challenging → Closed)
  src/test.rs                cargo unit tests with mock_all_auths
packages/attendance/         Generated TypeScript bindings (committed — see "quirks" below)
src/                         React 19 + Vite 7 frontend
  pages/{Landing,TeacherView,TeacherAulaView,StudentView}.tsx   route components
  providers/WalletProvider.tsx   polls StellarWalletsKit every 1s, caches in localStorage
  hooks/useAttendance.ts     wraps the generated client + signTransaction
  contracts/{attendance,util}.ts   GENERATED at build (gitignored except util.ts + attendance.ts)
environments.toml            Stellar scaffold CLI config (development/staging/production networks)
.env                         Frontend env (PUBLIC_ prefix required by vite envPrefix)
```

The contract is **Toy RSA** with `n ≤ 99` (mathematically correct, cryptographically broken). Educational only — never widen `u32 → u64` in hopes of "making it real." See top README for the manual paper protocol.

### Common commands

| Goal | Command |
|---|---|
| Install (matches Vercel build) | `HUSKY=0 npm install --workspaces --include-workspace-root` |
| Dev (watches contract + serves frontend) | `npm run dev` (alias of `npm start`) |
| Build all | `npm run build --workspaces --if-present && npm run build` |
| Lint | `npm run lint` |
| Typecheck only | `npm run typecheck` |
| Format | `npm run format` |
| Build contract Wasm | `cargo build --target wasm32v1-none --release -p attendance` |
| Run contract tests | `cargo test -p attendance` |
| Single contract test | `cargo test -p attendance <test_name>` (e.g. `full_flow_single_student`) |
| Regenerate TS bindings | `stellar contract bindings typescript --network testnet --contract-id <id> --output-dir packages/attendance --overwrite` then `(cd packages/attendance && npm install && npm run build)` |

`npm run dev` runs `stellar scaffold watch --build-clients` + `vite` concurrently. The scaffold watcher rebuilds the contract Wasm and regenerates `src/contracts/*.ts` on change — do not hand-edit those files (gitignored except `util.ts` and `attendance.ts`).

### Rust toolchain

Pinned in `rust-toolchain.toml`: channel `1.89.0`, target `wasm32v1-none`. `release` profile uses `opt-level = "z"` + `lto = true` + `panic = "abort"` for small Wasm. Soroban deps are workspace-pinned (`soroban-sdk 23.4.0`, OpenZeppelin stellar-contracts at tag `v0.6.0`).

### Contract data model

State per `aula_id: u64`:

```
DataKey::Aula(id)                → AulaData { name, teacher, state, students }
DataKey::PubKey(id, student)     → PubKey { n, e }
DataKey::Challenge(id, student)  → m: u32
DataKey::ValidSub(id, student)   → bool
DataKey::Nft(id, student)        → token_id: u64
DataKey::AulaCounter             → u64 (instance)
DataKey::NftCounter(id)          → u64 (instance, per-aula token counter)
```

Flow: `create_aula` → many `register(n,e)` → teacher `issue_challenges([(addr,m)…])` (locks state) → each student `submit_signature(s)` (verified `s^e mod n == m` via `pow_mod`) → teacher `close_aula` mints NFT for each `ValidSub=true`. The on-chain `pow_mod` is the same square-and-multiply the student does on paper.

## Quirks worth knowing

- **`packages/attendance/` is committed** even though it's a generated client. Reason: Vercel can't run `stellar contract bindings`, so the frontend build needs the bindings already on disk. The package's `dist` and `node_modules` are still gitignored. After redeploying the contract, regenerate and commit the new bindings.
- **`HUSKY=0` is required** when installing in containers/Vercel — `.git` isn't present and the husky `prepare` script will fail otherwise.
- **`PUBLIC_` env prefix is mandatory** for any var to reach the frontend (`vite.config.ts` sets `envPrefix: "PUBLIC_"`).
- **Two separate config layers**: `.env` configures the *runtime frontend* (`PUBLIC_STELLAR_*`); `environments.toml` configures the *Stellar CLI / scaffold tooling* (development/staging/production network defs + `client = true` to autogen bindings). They overlap on network/RPC URL — keep them in sync.
- **Wallet popup behaviors** are wallet-specific — see `WALLET_BEHAVIORS` in `WalletProvider.tsx`. Freighter is "standard" (popup only on connect); most others are "popup-always" and require caching the address to avoid spamming the user.
- **Vite needs node polyfills** (`buffer` only) and `vite-plugin-wasm` for `@stellar/stellar-xdr-json`. Don't remove either.
- **`.env` is gitignored** but `.env.example` is committed. Live testnet contract id is in `DEPLOY.md` and the project README.

## Deploy

Frontend → Vercel (root dir = `projects/attendance-toy-rsa`, `vercel.json` already wires the install/build/SPA-rewrites). Contract → Stellar testnet via `stellar contract deploy --wasm target/wasm32v1-none/release/attendance.wasm --network testnet --alias attendance`. After deploy: update `PUBLIC_ATTENDANCE_CONTRACT_ID` and regenerate + commit the `packages/attendance` bindings. Full recipe in `DEPLOY.md` and the project README.

<!-- token-policy: v1.0 -->
