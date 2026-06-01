# The Bridge

A comprehensive multi-service platform integrating:

1. **Social Boost** - Linked to n1panel.com and justanotherpanel.com
2. **Jobs** - Like Fiverr/Upwork with Telegram channel portfolio linking
3. **Promotion** - Sponsor management and Telegram ads integration
4. **Shop** - Physical product sales and listings
5. **P2P Crypto Trading** - Admin-controlled secure transactions
6. **Encrypted Chat Service** - Secure messaging for users
7. **Future Features** - Travel booking and e-commerce aggregator

## Features

- Multi-authentication (Phone, Email, Telegram)
- Balance/Wallet system
- Semi-automated deposit/withdrawal
- Multiple payment gateways (PayPal, Payeer, Crypto, Chappa, SantimPay, Telebirr)
- Custom currency/token system (game points) for regulatory compliance

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: Next.js (React)
- **Database**: PostgreSQL + Prisma ORM
- **Real-time**: Socket.io
- **Telegram**: Bot API integration

## Getting Started

1. Install dependencies:
```bash
npm install
cd client && npm install
```

2. Set up environment variables (see `.env.example`)

3. Set up database:
```bash
npx prisma migrate dev
npx prisma generate
```

4. Run development server:
```bash
npm run dev
```

## Project Structure

```
├── server/          # Backend API
│   ├── config/      # Configuration files
│   ├── controllers/ # Route controllers
│   ├── models/      # Database models (Prisma)
│   ├── routes/      # API routes
│   ├── services/    # Business logic
│   ├── middleware/  # Custom middleware
│   └── utils/       # Utility functions
├── client/          # Frontend Next.js app
└── prisma/          # Database schema
```

