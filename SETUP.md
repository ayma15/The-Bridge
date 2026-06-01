# Setup Guide

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE allinone;
```

2. Update `.env` file with your database URL:
```
DATABASE_URL="postgresql://user:password@localhost:5432/allinone?schema=public"
```

3. Run migrations:
```bash
npx prisma migrate dev
npx prisma generate
```

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in all required values:

- **JWT_SECRET**: Generate a strong random string for JWT tokens
- **TELEGRAM_BOT_TOKEN**: Get from @BotFather on Telegram
- **Payment Gateway Keys**: Get from respective providers
- **SMM Panel API Keys**: Get from n1panel.com and justanotherpanel.com
- **CHAT_ENCRYPTION_KEY**: Generate a 32-byte key (use `openssl rand -hex 32`)

### 4. Create Admin User

After running migrations, create an admin user manually in the database or via API:

```sql
-- Example SQL (adjust as needed)
INSERT INTO "User" (id, email, "passwordHash", role, "isVerified", "isActive")
VALUES ('admin-id', 'admin@example.com', '$2a$10$hashedpassword', 'ADMIN', true, true);
```

### 5. Start Development Server

```bash
npm run dev
```

The server will run on `http://localhost:5000`

## Custom Currency System (Game Points)

To comply with regulations, the platform uses a "game points" system:

1. **Users purchase points** like in-game currency
2. **Points are used** for all transactions on the platform
3. **Points are non-refundable** but can be used for services
4. **Points have no real-world value** outside the platform

This approach helps avoid financial regulations while still providing a seamless user experience.

## Payment Gateway Setup

### PayPal
1. Create a PayPal Business account
2. Get Client ID and Secret from PayPal Developer Dashboard
3. Add to `.env`

### Payeer
1. Register at payeer.com
2. Get API credentials from merchant panel
3. Add to `.env`

### Chappa (Ethiopia)
1. Register at chappa.co
2. Get API keys from dashboard
3. Add to `.env`

### SantimPay (Ethiopia)
1. Register at santimpay.com
2. Get API credentials
3. Add to `.env`

### Crypto
- Set up crypto wallet addresses for receiving payments
- Configure TRX node URL for Tron network
- Add private keys securely (use environment variables only)

## SMM Panel Integration

1. Register accounts at:
   - n1panel.com
   - justanotherpanel.com

2. Get API keys from both panels

3. Add to `.env`:
   - `N1PANEL_API_KEY`
   - `JUSTANOTHERPANEL_API_KEY`

## Telegram Bot Setup

1. Create a bot via @BotFather on Telegram
2. Get the bot token
3. Add to `.env` as `TELEGRAM_BOT_TOKEN`
4. Configure webhook (optional) for production

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a process manager like PM2
3. Set up SSL certificates
4. Configure proper CORS origins
5. Use environment-specific database
6. Set up backup strategy for database
7. Configure logging and monitoring

## Security Checklist

- [ ] Change all default secrets
- [ ] Use strong JWT secret
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Use environment variables for all secrets
- [ ] Enable database encryption at rest
- [ ] Set up regular backups
- [ ] Monitor for suspicious activity
- [ ] Keep dependencies updated

