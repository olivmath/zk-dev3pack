# Deploy on Vercel

## One-time setup

1. **Import the project on Vercel** and set:
   - **Root directory**: `projects/attendance-toy-rsa`
   - **Framework preset**: Vite (auto-detected)
   - The build/install/output commands and SPA rewrites are handled by `vercel.json`.

2. **Environment variables** (Project Settings → Environment Variables):

   ```
   PUBLIC_STELLAR_NETWORK              = TESTNET
   PUBLIC_STELLAR_NETWORK_PASSPHRASE   = Test SDF Network ; September 2015
   PUBLIC_STELLAR_RPC_URL              = https://soroban-testnet.stellar.org
   PUBLIC_STELLAR_HORIZON_URL          = https://horizon-testnet.stellar.org
   PUBLIC_ATTENDANCE_CONTRACT_ID       = CBJ3FZJ7CRJROPLFBWHUKXCX6EH3R3GEXSQBNCYRLWJJ24K6I6TERXFZ
   ```

   (Use the contract ID from your `.env` if you redeploy the contract.)

## How the build works

- `installCommand`: `HUSKY=0 npm install --workspaces --include-workspace-root` — disables the husky git hook (no `.git` in the build container) and installs the workspace.
- `buildCommand`: builds the `attendance` workspace package first (TypeScript client, generated locally with `stellar scaffold watch`) then runs `tsc -b && vite build`.
- `outputDirectory`: `dist`
- `rewrites`: SPA fallback so React Router routes (`/host`, `/host/class/:id`, `/join`) work on hard refresh.

## Local build (matches Vercel)

```bash
HUSKY=0 npm install --workspaces --include-workspace-root
npm run build --workspaces --if-present
npm run build
npm run preview   # serves dist/
```
