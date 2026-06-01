/**
 * Seed script to add mockup products for development/demo purposes
 * Run this script to populate the shop with sample products
 * Admin can remove these products when the platform goes live
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const mockupProducts = [
  {
    name: "iPhone 15 Pro Max",
    description: "Latest iPhone with titanium design, A17 Pro chip, and advanced camera system. Perfect condition with all accessories included.",
    category: "Phones & Accessories",
    price: 1299.99,
    stock: 5,
    condition: "BRAND_NEW",
    images: [
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500",
      "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=500"
    ]
  },
  {
    name: "MacBook Pro 16-inch M3",
    description: "Powerful laptop with M3 chip, 18GB RAM, 512GB SSD. Perfect for creative professionals and developers.",
    category: "Computers & Accessories",
    price: 2499.99,
    stock: 3,
    condition: "BRAND_NEW",
    images: [
      "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500",
      "https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=500"
    ]
  },
  {
    name: "Sony WH-1000XM5 Headphones",
    description: "Industry-leading noise canceling wireless headphones with 30-hour battery life and premium sound quality.",
    category: "Electronics",
    price: 399.99,
    stock: 8,
    condition: "BRAND_NEW",
    images: [
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500"
    ]
  },
  {
    name: "Nike Air Max 270",
    description: "Comfortable running shoes with Air Max cushioning technology. Size 10, barely worn, like new condition.",
    category: "Shoes & Accessories",
    price: 129.99,
    stock: 12,
    condition: "SLIGHTLY_USED",
    images: [
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500",
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500"
    ]
  },
  {
    name: "Dyson V15 Detect Vacuum",
    description: "Advanced cordless vacuum with laser dust detection and powerful suction. Includes all attachments.",
    category: "Home & Garden",
    price: 749.99,
    stock: 4,
    condition: "BRAND_NEW",
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500",
      "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500"
    ]
  },
  {
    name: "Levi's 501 Original Jeans",
    description: "Classic straight-fit jeans, size 32x32. Comfortable and stylish for everyday wear.",
    category: "Fashion & Clothing",
    price: 89.99,
    stock: 15,
    condition: "SLIGHTLY_USED",
    images: [
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500",
      "https://images.unsplash.com/photo-1475178626620-a4d074967452?w=500"
    ]
  },
  {
    name: "Canon EOS R5 Camera",
    description: "Professional mirrorless camera with 45MP full-frame sensor, 8K video, and advanced autofocus system.",
    category: "Electronics",
    price: 3899.99,
    stock: 2,
    condition: "BRAND_NEW",
    images: [
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500",
      "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=500"
    ]
  },
  {
    name: "Rolex Submariner Watch",
    description: "Luxury dive watch with ceramic bezel and automatic movement. Comes with warranty and authenticity certificate.",
    category: "Jewelry & Watches",
    price: 8999.99,
    stock: 1,
    condition: "SLIGHTLY_USED",
    images: [
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500",
      "https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?w=500"
    ]
  },
  {
    name: "PlayStation 5 Console",
    description: "Next-generation gaming console with ultra-high speed SSD, 4K gaming, and DualSense controller.",
    category: "Electronics",
    price: 499.99,
    stock: 6,
    condition: "BRAND_NEW",
    images: [
      "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500",
      "https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=500"
    ]
  },
  {
    name: "Tesla Model 3 Wheel Set",
    description: "Complete set of 4 wheels and tires from Tesla Model 3. 18-inch aerodynamic wheels in excellent condition.",
    category: "Automotive",
    price: 1200.00,
    stock: 1,
    condition: "USED",
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500",
      "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500"
    ]
  },
  {
    name: "Vintage Gibson Les Paul Guitar",
    description: "1968 Gibson Les Paul Standard with original case and documentation. Professionally maintained and in excellent condition.",
    category: "Musical Instruments",
    price: 4500.00,
    stock: 1,
    condition: "USED",
    images: [
      "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=500",
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500"
    ]
  },
  {
    name: "GoPro HERO 11 Black",
    description: "Latest action camera with 5.3K video, HyperSmooth stabilization, and waterproof design. Includes mounts and accessories.",
    category: "Electronics",
    price: 399.99,
    stock: 7,
    condition: "BRAND_NEW",
    images: [
      "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=500",
      "https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=500"
    ]
  }
];

async function seedMockupProducts() {
  try {
    console.log('🌱 Starting to seed mockup products...');

    // Create a mock admin user if it doesn't exist
    let adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      console.log('👤 Creating mock admin user...');
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@thebridge.com',
          username: 'admin',
          passwordHash: '$2a$10$dummy.hash.for.demo.purposes.only',
          role: 'ADMIN',
          isVerified: true,
          isActive: true
        }
      });
    }

    // Create wallet for admin if it doesn't exist
    const adminWallet = await prisma.wallet.upsert({
      where: { userId: adminUser.id },
      update: {},
      create: {
        userId: adminUser.id,
        balance: 10000.00,
        currency: 'POINTS'
      }
    });

    console.log('📦 Creating mockup products...');

    let createdCount = 0;
    for (const productData of mockupProducts) {
      try {
        // Check if product already exists
        const existingProduct = await prisma.product.findFirst({
          where: {
            name: productData.name,
            sellerId: adminUser.id
          }
        });

        if (!existingProduct) {
        await prisma.product.create({
          data: {
            ...productData,
            sellerId: adminUser.id,
            price: parseFloat(productData.price),
            isActive: true
          }
        });
          createdCount++;
          console.log(`✅ Created: ${productData.name}`);
        } else {
          console.log(`⏭️  Skipped: ${productData.name} (already exists)`);
        }
      } catch (error) {
        console.error(`❌ Failed to create ${productData.name}:`, error.message);
      }
    }

    console.log(`\n🎉 Successfully seeded ${createdCount} mockup products!`);
    console.log('📝 Note: These are demo products that admin should remove when the platform goes live.');

  } catch (error) {
    console.error('❌ Error seeding mockup products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedMockupProducts();
}

module.exports = { seedMockupProducts };
