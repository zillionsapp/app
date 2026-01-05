# Zillions

Zillions is an on-chain, autonomous trading bot designed to help users participate in cryptocurrency markets without needing advanced trading expertise. This repository contains the **frontend web application** - the user interface for interacting with the trading bot.

## Architecture

The Zillions platform consists of two main components:

- **Frontend (this repo)**: Web interface built with Nuxt.js for user interaction, wallet connection, and vault management
- **[Core Trading Bot](https://github.com/zillionsapp/core)**: The actual trading engine that executes strategies on-chain

The trading bot ships with many enhanced algorithmic trading strategies, while the proprietary Smart Money Concept (SMC) algorithm - which analyzes institutional trading patterns including HTF Orderblocks, Fair Value Gaps, and Liquidity Zones - remains confidential.

## Features

- **Smart Money Algorithm**: Proprietary trading strategy based on institutional trading patterns
- **On-Chain Transparency**: All executions, history, and vault performance are fully transparent on-chain
- **Non-Custodial**: Users maintain full control of their funds
- **Referral System**: Invite friends and earn 10% commission on their trading profits
- **Commission Tracking**: Real-time earnings dashboard with detailed commission history
- **Invite Management**: Create, share, and track referral codes with full analytics
- **Multi-Language Support**: Available in English, French, German, and Spanish
- **Progressive Web App**: Installable PWA with offline capabilities
- **Dark/Light Mode**: Automatic theme switching based on system preferences
- **Responsive Design**: Optimized for desktop and mobile devices

## Referral & Commission System

Zillions includes a comprehensive referral system where users can invite friends and earn commissions from their trading profits.

### How It Works

1. **Invite Creation**: Users generate unique invite codes from their dashboard
2. **Code Sharing**: Invite links direct friends to registration with pre-filled codes
3. **Commission Earning**: Inviters earn 10% of their invited users' daily trading profits
4. **Automatic Calculation**: Daily commission snapshots are calculated via API endpoint

### API Endpoints

#### Commission Calculation (External Cron)
```http
POST /api/commissions/calculate
Authorization: Bearer YOUR_COMMISSION_API_KEY
```

**Environment Setup:**
```env
COMMISSION_API_KEY=your-secure-api-key-here
```

**Usage with cron-job.org:**
- URL: `https://your-app.vercel.app/api/commissions/calculate`
- Method: `POST`
- Headers: `Authorization: Bearer YOUR_COMMISSION_API_KEY`
- Schedule: Daily (e.g., 2:00 AM UTC)

#### Commission Data (Frontend)
```http
GET /api/commissions/summary
# Returns: total_earned, monthly_earned, invited_users_count, etc.
```

### Database Schema

Run the commission schema setup:
```sql
-- For new databases
\i supabase_schema.sql

-- For existing databases
\i supabase_schema_update.sql
```

### Commission Rate

- **Rate**: 10% of invited users' daily P&L
- **Source**: Based on `portfolio_snapshots.pnl` from trading activity
- **Calculation**: Daily snapshots via `calculate_daily_commissions()` function
- **Payment**: Tracked in `commission_payments` table for future payouts

## Tech Stack

- **Framework**: Nuxt 4 (Vue 3)
- **Styling**: Tailwind CSS + DaisyUI
- **Internationalization**: Nuxt i18n
- **Backend**: Supabase
- **PWA**: Vite PWA
- **Charts**: Nuxt Charts
- **Animations**: Anime.js
- **Testing**: Vitest (unit) + Playwright (e2e)
- **TypeScript**: Full TypeScript support

## Prerequisites

- Node.js 18+
- npm, pnpm, yarn, or bun

## Setup

1. Clone the repository:
```bash
git clone https://github.com/zillionsapp/app.git
cd app
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

5. Prepare Nuxt:
```bash
npm run postinstall
```

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Testing

Run unit tests:
```bash
npm run test
```

Run end-to-end tests:
```bash
npx playwright test
```

## Building

Build for production:
```bash
npm run build
```

Generate static site:
```bash
npm run generate
```

Preview production build:
```bash
npm run preview
```

## Project Structure

```
├── assets/           # Static assets (CSS, images)
├── components/       # Vue components
│   ├── app/         # App-specific components
│   └── LanguageSwitcher.vue
├── i18n/            # Internationalization
│   ├── locales/     # Translation files
│   └── config.ts    # i18n configuration
├── layouts/         # Page layouts
├── middleware/      # Route middleware
├── pages/           # File-based routing
│   └── app/         # Protected app pages
├── public/          # Public static files
├── tests/           # Test files
├── app.vue          # Root component
├── nuxt.config.ts   # Nuxt configuration
└── tailwind.config.js # Tailwind configuration
```

## Key Components

- **LanguageSwitcher**: Handles locale switching
- **ThemeToggle**: Manages dark/light mode
- **Sidebar**: Navigation component for app pages
- **Charts**: Data visualization using Nuxt Charts

## Internationalization

The app supports multiple languages with automatic browser language detection. Translation files are located in `i18n/locales/`. To add a new language:

1. Create a new JSON file in `i18n/locales/`
2. Add the locale to `nuxt.config.ts`
3. Update `i18n.config.ts` if needed

## PWA Features

- Offline support for cached resources
- Installable on desktop and mobile
- Automatic updates
- Service worker for background sync

## Deployment

The app can be deployed as a static site or server-side rendered application. For static deployment:

```bash
npm run generate
```

Upload the `dist/` folder to your hosting provider.

For SSR deployment, use the build output with a Node.js server.

## 🤝 Contributing
We welcome contributions! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

---

**License**: Apache License 2.0. contains **NOTICE** file with mandatory attribution to **Zillions.app** / **@christonomous**.

---

## 🔗 Connect

*   **App**:
    *   [Website](https://zillions.app)
    *   [GitHub](https://github.com/zillionsapp)
*   **Founder**: **@christonomous**
    *   [Website](https://chris.berlin)
    *   [GitHub](https://github.com/christonomous)
    *   [X.com](https://x.com/christonomous)
    *   [LinkedIn](https://linkedin.com/in/christonomous)
    *   [Instagram](https://instagram.com/christonomous)

---

*Trading involves risk, including possible loss of capital. Past performance does not guarantee future results.*
