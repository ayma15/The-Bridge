# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
cd client && npm install && cd ..
```

### 2. Set Up Database
```bash
# Create PostgreSQL database
createdb allinone

# Or using SQL
psql -U postgres
CREATE DATABASE allinone;
```

### 3. Configure Environment
```bash
# Copy example env file
cp .env.example .env

# Edit .env and add:
# - Database URL
# - JWT Secret (generate with: openssl rand -hex 32)
# - Telegram Bot Token (from @BotFather)
# - Payment gateway keys (as needed)
```

### 4. Run Migrations
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Start Development
```bash
# Start both server and client
npm run dev

# Or separately:
npm run dev:server  # Backend on :5000
npm run dev:client  # Frontend on :3000
```

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Wallet
- `GET /api/wallet/balance` - Get balance
- `GET /api/wallet/transactions` - Transaction history
- `POST /api/wallet/deposit` - Create deposit
- `POST /api/wallet/withdraw` - Request withdrawal

### SMM Panel
- `GET /api/smm/services` - Get available services
- `POST /api/smm/orders` - Create order
- `GET /api/smm/orders` - Get user orders

### Freelancing
- `POST /api/freelance/profile` - Create/update profile
- `GET /api/freelance/profile/:userId` - Get profile
- `POST /api/freelance/services` - Create service
- `GET /api/freelance/services` - Browse services
- `POST /api/freelance/orders` - Create order

### Products
- `POST /api/products` - Create product
- `GET /api/products` - Browse products
- `POST /api/products/orders` - Create order

### P2P Crypto
- `POST /api/p2p/buy` - Buy crypto
- `GET /api/p2p/orders` - Get orders
- `POST /api/p2p/orders/:id/approve` - Approve (admin)

### Ads
- `POST /api/ads` - Create ad campaign
- `GET /api/ads` - Get ads
- `POST /api/ads/:id/impression` - Track impression
- `POST /api/ads/:id/click` - Track click

### Chat
- `POST /api/chat/rooms` - Get/create room
- `GET /api/chat/rooms` - List rooms
- `GET /api/chat/rooms/:id/messages` - Get messages
- `POST /api/chat/rooms/:id/messages` - Send message

## 🔑 Key Features

### Custom Currency System
- Users purchase "POINTS" (game currency)
- Points used for all transactions
- Complies with financial regulations
- No direct cash conversion

### Multi-Authentication
- Email/Password
- Phone number
- Telegram account

### Payment Gateways
- International: PayPal, Payeer, Crypto
- Ethiopia: Chappa, SantimPay, Telebirr, Bank Transfer

### Security
- Encrypted chat (AES-256-GCM)
- JWT authentication
- Role-based access control
- Admin-controlled withdrawals

## 📝 Example API Calls

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "username": "johndoe"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Get Balance
```bash
curl -X GET http://localhost:5000/api/wallet/balance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create SMM Order
```bash
curl -X POST http://localhost:5000/api/smm/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "123",
    "serviceName": "Instagram Followers",
    "quantity": 1000,
    "provider": "N1PANEL",
    "link": "https://instagram.com/username"
  }'
```

## 🛠️ Development Tips

1. **Database Changes**: Use Prisma migrations
   ```bash
   npx prisma migrate dev --name description
   ```

2. **View Database**: Use Prisma Studio
   ```bash
   npx prisma studio
   ```

3. **Environment Variables**: Never commit `.env` file

4. **Testing**: Use Postman or similar for API testing

5. **Logs**: Check server console for errors

## 📚 Documentation

- `README.md` - Project overview
- `SETUP.md` - Detailed setup instructions
- `ARCHITECTURE.md` - System architecture
- `QUICK_START.md` - This file

## 🐛 Troubleshooting

### Database Connection Error
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Ensure database exists

### Port Already in Use
- Change PORT in .env
- Kill process using port: `lsof -ti:5000 | xargs kill`

### Migration Errors
- Reset database: `npx prisma migrate reset`
- Check schema.prisma for errors

### Module Not Found
- Run `npm install` again
- Delete node_modules and reinstall

## 🎯 Next Steps

1. Set up payment gateway accounts
2. Configure SMM panel API keys
3. Create admin user
4. Test authentication flow
5. Test wallet deposit/withdrawal
6. Integrate with external services
7. Build frontend components
8. Deploy to production

