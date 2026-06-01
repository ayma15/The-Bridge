# Architecture Overview

## System Architecture

The All in One Platform is built with a modular architecture to support multiple services:

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│              - User Interface                            │
│              - Real-time Chat (Socket.io Client)         │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTP/WebSocket
                     │
┌────────────────────▼────────────────────────────────────┐
│              Backend API (Express.js)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │   Auth   │  │  Wallet  │  │   SMM    │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │Freelance │  │ Products │  │   P2P    │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │   Ads    │  │   Chat   │  │ Payments │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼───┐  ┌─────▼─────┐  ┌───▼──────────┐
│ PostgreSQL│  │  Socket.io│  │  External    │
│  Database │  │  (Chat)   │  │  Services    │
└───────────┘  └───────────┘  └──────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
            ┌───────▼────┐    ┌──────▼────┐    ┌──────▼────┐
            │  N1Panel   │    │JustAnother│    │  Payment   │
            │    API     │    │   Panel   │    │  Gateways  │
            └────────────┘    └───────────┘    └───────────┘
```

## Core Components

### 1. Authentication System
- **Multi-provider**: Email, Phone, Telegram
- **JWT-based**: Secure token authentication
- **Role-based**: USER, ADMIN, MODERATOR

### 2. Wallet System
- **Balance Management**: Track user balances
- **Currency**: POINTS (custom currency for compliance)
- **Transactions**: All financial operations logged
- **Multi-currency Support**: Ready for expansion

### 3. Payment Processing
- **Deposit**: Multiple gateway support
- **Withdrawal**: Admin-controlled for security
- **Internal Payments**: Instant between users
- **Webhook Handling**: Automatic payment verification

### 4. Service Modules

#### SMM Panel
- Integrates with external panels
- Adds profit margin automatically
- Tracks order status
- Handles refunds if needed

#### Freelancing
- Service listings
- Order management
- Portfolio via Telegram channels
- Rating and review system
- Escrow payment system

#### Product Marketplace
- Product listings
- Inventory management
- Order processing
- Shipping tracking

#### P2P Crypto
- Admin-controlled trading
- Secure transaction handling
- Multiple crypto support
- Payment method flexibility

#### Ad Service
- Campaign management
- Multiple ad types
- Impression/click tracking
- Budget management

#### Encrypted Chat
- End-to-end encryption
- Real-time messaging
- Room-based conversations
- Secure message storage

## Database Schema

### Key Models
- **User**: Authentication and profile
- **Wallet**: Balance management
- **Transaction**: Financial records
- **SMMOrder**: SMM service orders
- **FreelancerProfile**: Freelancer information
- **FreelancerService**: Service listings
- **FreelancerOrder**: Service orders
- **Product**: Product listings
- **ProductOrder**: Product purchases
- **P2POrder**: Crypto trades
- **Ad**: Advertisement campaigns
- **ChatRoom**: Chat conversations
- **ChatMessage**: Encrypted messages
- **Review**: User reviews

## Security Features

1. **Encryption**
   - AES-256-GCM for chat messages
   - Password hashing with bcrypt
   - JWT token security

2. **Authentication**
   - Multi-factor support
   - Session management
   - Role-based access control

3. **Payment Security**
   - Admin-controlled withdrawals
   - Transaction logging
   - Webhook verification

4. **Data Protection**
   - Input validation
   - SQL injection prevention (Prisma)
   - XSS protection (Helmet)
   - Rate limiting

## API Structure

### REST Endpoints
- `/api/auth` - Authentication
- `/api/wallet` - Wallet operations
- `/api/smm` - SMM panel services
- `/api/freelance` - Freelancing platform
- `/api/products` - Product marketplace
- `/api/p2p` - P2P crypto trading
- `/api/ads` - Ad service
- `/api/chat` - Chat operations
- `/api/payments` - Payment processing

### WebSocket Events
- `join-room` - Join chat room
- `leave-room` - Leave chat room
- `send-message` - Send encrypted message
- `receive-message` - Receive message

## Custom Currency System

### Why Game Points?
To comply with financial regulations, especially in Ethiopia, the platform uses a "game points" system:

1. **Legal Compliance**: Points are treated as virtual currency, not real money
2. **User Experience**: Seamless transactions without regulatory hurdles
3. **Flexibility**: Can be used across all services
4. **Security**: Reduced risk of financial fraud

### How It Works
1. Users purchase points via payment gateways
2. Points are stored in user wallets
3. Points are used for all platform services
4. Points cannot be directly converted back to cash (compliance)
5. Points can be used for services, which can then be monetized

## Integration Points

### External Services
- **N1Panel API**: SMM service provider
- **JustAnotherPanel API**: SMM service provider
- **PayPal API**: Payment processing
- **Payeer API**: Payment processing
- **Chappa API**: Ethiopian payment gateway
- **SantimPay API**: Ethiopian payment gateway
- **Telegram Bot API**: Authentication and notifications
- **Crypto Networks**: TRX, USDT, etc.

## Scalability Considerations

1. **Database**: PostgreSQL with proper indexing
2. **Caching**: Redis (to be implemented)
3. **Load Balancing**: Multiple server instances
4. **CDN**: Static asset delivery
5. **Queue System**: Background job processing (to be implemented)

## Future Enhancements

1. **Travel Booking**: Flight and hotel reservations
2. **E-commerce Aggregator**: Amazon, eBay, Alibaba integration
3. **Mobile Apps**: iOS and Android applications
4. **Advanced Analytics**: Business intelligence dashboard
5. **Multi-language**: Internationalization support

