import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
// Adjust path for running from backend directory
const dbPath = dbUrl.replace('file:', '');
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

const products = [
  {
    title: 'Minimalist Leather Backpack',
    description:
      'Handcrafted from premium full-grain leather. Features a dedicated 15-inch laptop compartment, water-resistant lining, and breathable mesh back padding.',
    price: 129.99,
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800',
    category: 'Accessories',
    stock: 25,
  },
  {
    title: 'Ergonomic Mechanical Keyboard',
    description:
      'Wireless mechanical keyboard with hot-swappable switches, PBT keycaps, per-key RGB backlighting, and a multi-device connection hub.',
    price: 89.5,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=800',
    category: 'Electronics',
    stock: 15,
  },
  {
    title: 'Organic Cotton Crewneck Sweatshirt',
    description:
      'Made from 100% certified organic cotton. Incredibly soft, pre-shrunk, and ethically manufactured. Available in multiple earthy tones.',
    price: 45.0,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800',
    category: 'Clothing',
    stock: 50,
  },
  {
    title: 'Double-Walled Stainless Steel Bottle',
    description:
      'Vacuum insulated water bottle that keeps drinks cold for 24 hours or hot for 12 hours. Features a leak-proof straw lid and durable powder coat finish.',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=800',
    category: 'Home & Kitchen',
    stock: 100,
  },
  {
    title: 'Noise-Cancelling Over-Ear Headphones',
    description:
      'Industry-leading active noise cancellation. Enjoy up to 30 hours of battery life, superior sound clarity, and crystal-clear hands-free calling.',
    price: 199.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800',
    category: 'Electronics',
    stock: 12,
  },
  {
    title: 'Ceramic Pour-Over Coffee Maker',
    description:
      'Elegant ceramic dripper designed for artisanal brewing. Maintains optimal water temperature throughout the brewing cycle. Includes 40 paper filters.',
    price: 32.0,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800',
    category: 'Home & Kitchen',
    stock: 30,
  },
  {
    title: 'Aesthetic Desk Organizer Tray',
    description:
      'Minimalist concrete storage tray for pens, paperclips, keys, and accessories. Designed to bring a sleek, modern touch to your workspace.',
    price: 18.5,
    image: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?q=80&w=800',
    category: 'Accessories',
    stock: 40,
  },
  {
    title: 'Smart Fitness Tracker Band',
    description:
      'Lightweight smart band featuring 24/7 heart rate monitoring, sleep tracking, oxygen level measurement, and up to 14 days of battery charge.',
    price: 59.99,
    image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?q=80&w=800',
    category: 'Electronics',
    stock: 60,
  },
];

async function main() {
  console.log('Start seeding...');

  // Clear existing reviews, orders, order items, coupons, and products to ensure clean re-seeding
  await prisma.review.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.coupon.deleteMany({});
  await prisma.product.deleteMany({});

  for (const p of products) {
    const product = await prisma.product.create({
      data: p,
    });
    console.log(`Created product with id: ${product.id}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
