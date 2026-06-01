# Database Migration Guide

## Issue: Product Creation Error

If you're getting an error when creating products, it's likely because the database schema hasn't been updated with the new fields.

## Solution: Run Database Migration

### Step 1: Generate Prisma Client
```bash
npx prisma generate
```

### Step 2: Create and Apply Migration
```bash
npx prisma migrate dev --name add_shop_enhancements
```

This will:
- Add the `condition` field to the Product table
- Add `sellerAddress`, `sellerTerms`, and `sellerPhone` fields to the User table
- Create the necessary indexes

### Step 3: Verify Migration
After running the migration, restart your server and try creating a product again.

## Alternative: If Migration Fails

If you're using PostgreSQL and the migration fails, you can manually add the fields:

```sql
-- Add condition field to Product table
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "condition" TEXT DEFAULT 'BRAND_NEW';

-- Add seller fields to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sellerAddress" JSONB;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sellerTerms" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sellerPhone" TEXT;

-- Create index on condition
CREATE INDEX IF NOT EXISTS "Product_condition_idx" ON "Product"("condition");
```

## Check Current Schema

To see what fields your database currently has:
```bash
npx prisma db pull
```

This will update your schema.prisma file to match your actual database structure.



