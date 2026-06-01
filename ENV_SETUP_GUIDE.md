# 🔐 Environment Variables Setup Guide

## ⚠️ IMPORTANT: Security Notice

**NEVER share your credentials in chat or commit them to Git!**
- The `.env` file is already in `.gitignore` (it won't be committed)
- Add all sensitive data directly to your `.env` file
- Keep your `.env` file private and secure

---

## 📝 Required Configuration

### 1. Database (Currently Using SQLite - No Credentials Needed)
Your `.env` already has:
```
DATABASE_URL="file:./dev.db"
```
✅ **No action needed** - SQLite works without credentials

**For Production (PostgreSQL):**
If you want to switch to PostgreSQL later, you'll need:
```
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
```

---

## 🔑 Optional Integrations (Add as Needed)

### 2. OpenAI API (For AI Assistant)
**Status:** Optional - AI assistant works with fallback responses without it

If you have an OpenAI API key:
```
OPENAI_API_KEY=sk-your-actual-api-key-here
OPENAI_API_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-3.5-turbo
```

**How to get:**
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy and paste it into `.env`

---

### 3. Telegram Bot (For Telegram Authentication)
**Status:** Optional

If you want Telegram login:
```
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here
```

**How to get:**
1. Open Telegram and search for @BotFather
2. Send `/newbot` command
3. Follow instructions to create a bot
4. Copy the token and add to `.env`

---

### 4. Payment Gateways (For Deposits/Withdrawals)
**Status:** Optional - Add as you integrate each gateway

#### PayPal
```
PAYPAL_ACCESS_TOKEN=your-paypal-access-token
```

#### Payeer
```
PAYEER_ACCOUNT=your-payeer-account-id
PAYEER_API_SECRET=your-payeer-api-secret
```

#### Chappa (Ethiopia)
```
CHAPPA_SECRET_KEY=your-chappa-secret-key
```

#### SantimPay (Ethiopia)
```
SANTIMPAY_API_KEY=your-santimpay-api-key
```

**How to get:**
- Register with each payment provider
- Get API credentials from their developer dashboard
- Add to `.env`

---

### 5. Social Boost APIs (For Social Boost Services)
**Status:** Optional

#### N1Panel
```
N1PANEL_API_KEY=your-n1panel-api-key
```

#### JustAnotherPanel
```
JUSTANOTHERPANEL_API_KEY=your-justanotherpanel-api-key
```

**How to get:**
1. Register at n1panel.com or justanotherpanel.com
2. Get API key from your account dashboard
3. Add to `.env`

---

## 🔒 Security Settings (Already Configured)

These are already set in your `.env`:
```
JWT_SECRET=auto-generated-secret
CHAT_ENCRYPTION_KEY=default-32-byte-encryption-key-change-this!!-32-chars
```

**⚠️ For Production:**
- Change `JWT_SECRET` to a strong random string (32+ characters)
- Change `CHAT_ENCRYPTION_KEY` to a secure 32-byte key
- Use: `openssl rand -hex 32` to generate secure keys

---

## 📋 Quick Setup Checklist

### Minimum Required (Already Done ✅)
- [x] Database URL (SQLite)
- [x] JWT Secret
- [x] Chat Encryption Key
- [x] Server Ports
- [x] CORS Settings

### Optional (Add When Ready)
- [ ] OpenAI API Key (for better AI responses)
- [ ] Telegram Bot Token (for Telegram login)
- [ ] Payment Gateway Keys (as you integrate them)
- [ ] Social Boost API Keys (as you integrate them)

---

## 🛠️ How to Add Credentials

1. **Open `.env` file** in your project root
2. **Add your credentials** in this format:
   ```
   VARIABLE_NAME=your-value-here
   ```
3. **Save the file**
4. **Restart your servers** for changes to take effect

**Example:**
```
OPENAI_API_KEY=sk-1234567890abcdef
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

---

## ✅ Current Status

Your platform works **without any additional credentials**! 

All features work with:
- ✅ User registration/login
- ✅ Wallet system
- ✅ Shop, Jobs, Social Boost, P2P, Promotion
- ✅ Chat system
- ✅ AI Assistant (with fallback responses)
- ✅ Search functionality

**Add credentials only when you want to:**
- Enable real OpenAI responses (instead of fallback)
- Enable Telegram authentication
- Process real payments
- Connect to real Social Boost panels

---

## 🚀 Next Steps

1. **Test the platform first** - Make sure everything works
2. **Add credentials gradually** - Start with what you need most
3. **Test each integration** - After adding each credential
4. **Keep `.env` secure** - Never share or commit it

---

## ❓ Need Help?

If you need help with:
- **Which credentials to add first?** → Start with OpenAI if you want better AI
- **How to get API keys?** → Check each provider's documentation
- **Testing integrations?** → Test one at a time after adding credentials

**Remember:** Your platform is fully functional without any additional credentials! 🎉

