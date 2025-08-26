# Hedera Agent Kit Next.js Example

This is a [Next.js 15](https://nextjs.org/) template bootstrapped for the Hedera Agent Kit, supporting both **AUTONOMOUS** and **RETURN_BYTES (HITL)** execution modes.

## Quickstart

1. **Install dependencies:**
   ```bash
   npm install
   # or
yarn
   # or
pnpm install
   ```

2. **Copy and configure environment variables:**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local to set your keys and mode
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   # or
yarn dev
   # or
pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file based on the provided `.env.local.example`:

| Variable                      | Mode         | Description                                 |
|-------------------------------|--------------|---------------------------------------------|
| `NEXT_PUBLIC_AGENT_MODE`      | all          | `autonomous` or `human` (RETURN_BYTES/HITL) |
| `NEXT_PUBLIC_NETWORK`         | all          | `testnet` (default) or `mainnet`            |
| `HEDERA_OPERATOR_ID`          | autonomous   | Operator account ID (server only)           |
| `HEDERA_OPERATOR_KEY`         | autonomous   | Operator private key (server only)          |
| `NEXT_PUBLIC_WC_PROJECT_ID`   | human/HITL   | WalletConnect Project ID (client safe)      |
| `WC_RELAY_URL`                | human/HITL   | (Optional) Custom WalletConnect relay URL   |
| `OPENAI_API_KEY`              | optional     | (Optional) For OpenAI integration           |

> **Note:** Never expose `HEDERA_OPERATOR_KEY` or non-public AI keys to the client.

## Project Structure

```
nextjs/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── agent/
│   │   │   │   └── route.ts        # Autonomous agent execution endpoint
│   │   │   └── wallet/
│   │   │       └── prepare/
│   │   │           └── route.ts    # Human-in-the-loop transaction preparation
│   │   ├── layout.tsx              # Root layout, global styles
│   │   ├── page.tsx                # Home page
│   │   ├── globals.css             # Base styles
│   │   └── favicon.ico
│   ├── components/
│   │   ├── Chat.tsx                # Main chat interface
│   │   ├── WalletConnect.tsx       # WalletConnect integration
│   │   ├── WalletConnectClient.tsx # WalletConnect client wrapper
│   │   └── ui/                     # Reusable UI components (shadcn/ui)
│   └── lib/
│       ├── agent.ts                # Agent configuration and utilities
│       ├── llm.ts                  # LLM integration
│       ├── schemas.ts              # Zod validation schemas
│       ├── utils.ts                # General utilities
│       └── walletconnect.ts        # WalletConnect setup
├── public/                         # Static assets
├── package.json                    # Scripts and dependencies
├── tsconfig.json                   # TypeScript configuration
├── next.config.ts                  # Next.js configuration
└── README.md                       # This file
```

## Included Dependencies
- `next@15`, `react@19`, `typescript`, `zod`
- `hedera-agent-kit`, `@hashgraph/sdk`
- `@walletconnect/universal-provider`, `@hashgraph/hedera-wallet-connect`

## Requirements & Notes
- Requires **Node.js >= 20** and **Next.js 15**.
- Default network is **testnet**; mainnet use is discouraged for development.
- API routes must run with `runtime = 'nodejs'` for SDK compatibility.
- Keep server-only secrets off the client at all times.
- This template intentionally omits automated tests.

## Learn More
- [Hedera Agent Kit Documentation](https://github.com/hashgraph/hedera-agent-kit)
- [Next.js Documentation](https://nextjs.org/docs)
- [WalletConnect Docs](https://docs.walletconnect.com/)
