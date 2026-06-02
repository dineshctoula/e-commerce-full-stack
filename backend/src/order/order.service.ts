import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

// OrderService handles order-related operations.
// We inject PrismaService to communicate with the SQLite database.
@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates a new customer order.
   * Runs inside a Prisma transaction to ensure atomicity:
   * 1. Verifies that all requested products exist.
   * 2. Checks if each product has sufficient stock.
   * 3. Calculates the total price using database product records (prevents price injection).
   * 4. Decrements product stocks.
   * 5. Creates the Order and OrderItem entries.
   * If any step fails, the entire transaction is rolled back.
   */
  async createOrder(userId: string, dto: CreateOrderDto) {
    // Extract unique product IDs from the order items
    const productIds = [...new Set(dto.items.map((item) => item.productId))];

    // Execute the database changes in an atomic transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch products from the database to check pricing and stock
      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
        },
      });

      // Map products by their ID for O(1) lookups
      const productMap = new Map(products.map((p) => [p.id, p]));

      // 2. Validate that all requested products actually exist
      for (const item of dto.items) {
        if (!productMap.has(item.productId)) {
          throw new NotFoundException(`Product with ID "${item.productId}" not found`);
        }
      }

      let totalAmount = 0;

      // 3. Verify stock levels and calculate totals
      for (const item of dto.items) {
        const product = productMap.get(item.productId)!;

        // Check if there is enough stock
        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product "${product.title}". Requested: ${item.quantity}, Available: ${product.stock}`,
          );
        }

        // Add to total using backend-sourced price (security best practice)
        totalAmount += product.price * item.quantity;

        // 4. Update/decrement product stock
        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: product.stock - item.quantity,
          },
        });
      }

      // 5. Create Order entry
      const order = await tx.order.create({
        data: {
          userId,
          totalAmount,
          status: 'PENDING',
        },
      });

      // 6. Create OrderItem entries
      const orderItemData = dto.items.map((item) => {
        const product = productMap.get(item.productId)!;
        return {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: product.price, // Storing the price snapshot at time of purchase
        };
      });

      await tx.orderItem.createMany({
        data: orderItemData,
      });

      // Return the created order details along with items and nested product info
      return tx.order.findUnique({
        where: { id: order.id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });
  }
}
