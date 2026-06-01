# 🐘 PostgreSQL Setup Guide

## ✅ Schema Updated for PostgreSQL

The Prisma schema has been converted to use PostgreSQL with:
- ✅ Decimal types for money (precision)
- ✅ Json types for metadata
- ✅ String arrays for skills and images
- ✅ Proper PostgreSQL data types

---

## 📝 Database Connection Setup

### Step 1: Update .env File

Open your `.env` file and update the `DATABASE_URL`:

**Current (SQLite):**
```
DATABASE_URL="file:./dev.db"
```

**Change to (PostgreSQL):**
```
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"
```

### Step 2: Replace with Your Credentials

Replace these values with your actual PostgreSQL credentials:
- `username` - Your PostgreSQL username
- `password` - Your PostgreSQL password
- `localhost` - Your PostgreSQL host (or IP address)
- `5432` - Your PostgreSQL port (default is 5432)
- `database_name` - Your database name (e.g., "allinone")

**Example:**
```
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/allinone?schema=public"
```

---

## 🗄️ Create Database

### Option 1: Using psql (Command Line)
```bash
psql -U postgres
CREATE DATABASE allinone;
\q
```

### Option 2: Using pgAdmin
1. Open pgAdmin
2. Right-click on "Databases"
3. Select "Create" → "Database"
4. Name it "allinone" (or your preferred name)
5. Click "Save"

---

## 🚀 Run Migrations

After updating `.env` with your PostgreSQL connection string:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (creates all tables)
npx prisma migrate dev --name init

# Or if you want to reset and start fresh
npx prisma migrate reset
```

---

## ✅ Verify Connection

Test the connection:
```bash
npx prisma db pull
```

If successful, you're connected! 🎉

---

## 🔄 Migration from SQLite to PostgreSQL

If you have data in SQLite that you want to migrate:

1. **Export SQLite data** (if needed)
2. **Update .env** with PostgreSQL connection
3. **Run migrations** to create PostgreSQL tables
4. **Import data** (if you exported it)

**Note:** For a fresh start, just run migrations - no data to migrate.

---

## 📋 What Changed

### Data Types Converted:
- ✅ `Float` → `Decimal` (for money/precision)
- ✅ `String` (JSON) → `Json` type
- ✅ `String` (arrays) → `String[]` arrays
- ✅ Enums kept as `String` (for flexibility)

### Benefits:
- ✅ Better precision for financial data
- ✅ Native JSON support
- ✅ Native array support
- ✅ Better performance
- ✅ Production-ready

---

## 🐛 Troubleshooting

### Connection Error
- Check PostgreSQL is running: `pg_isready` or check services
- Verify credentials in `.env`
- Check firewall/port access

### Migration Errors
- Make sure database exists
- Check user has CREATE privileges
- Verify connection string format

### Permission Errors
- Ensure PostgreSQL user has proper permissions
- Grant necessary privileges to the database

---

## 🎯 Next Steps

1. **Update `.env`** with your PostgreSQL connection string
2. **Create database** (if not exists)
3. **Run migrations**: `npx prisma migrate dev`
4. **Test connection**: `npx prisma db pull`
5. **Restart servers** to use new database

---

## 💡 Need Help?

If you need help with:
- **Connection string format** → Check Prisma docs
- **Database creation** → Use pgAdmin or psql
- **Migration issues** → Check error messages

Your platform is now ready for PostgreSQL! 🚀

