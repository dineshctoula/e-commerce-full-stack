import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

// OrderService handles order-related operations.
// We inject PrismaService to communicate with the SQLite database.
@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates a new customer order.
   * Runs inside a Prisma transaction to ensure atomicity.
   */
  async createOrder(userId: string, dto: CreateOrderDto) {
    const productIds = [...new Set(dto.items.map((item) => item.productId))];

    return this.prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
        },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      for (const item of dto.items) {
        if (!productMap.has(item.productId)) {
          throw new NotFoundException(`Product with ID "${item.productId}" not found`);
        }
      }

      let totalAmount = 0;

      for (const item of dto.items) {
        const product = productMap.get(item.productId)!;

        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product "${product.title}". Requested: ${item.quantity}, Available: ${product.stock}`,
          );
        }

        totalAmount += product.price * item.quantity;

        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: product.stock - item.quantity,
          },
        });
      }

      const order = await tx.order.create({
        data: {
          userId,
          totalAmount,
          status: 'PENDING',
        },
      });

      const orderItemData = dto.items.map((item) => {
        const product = productMap.get(item.productId)!;
        return {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: product.price,
        };
      });

      await tx.orderItem.createMany({
        data: orderItemData,
      });

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

  /**
   * Retrieves a list of orders.
   * - Admins get access to all orders.
   * - Regular users only get access to their own orders.
   */
  async getOrders(userId: string, role: string) {
    if (role === 'ADMIN') {
      // Admins see all orders in the system, sorted by newest first
      return this.prisma.order.findMany({
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    // Regular users see only their own orders
    return this.prisma.order.findMany({
      where: {
        userId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Retrieves details of a single order by ID.
   * - Throws NotFoundException if the order doesn't exist.
   * - Throws ForbiddenException if a non-admin user attempts to view someone else's order.
   */
  async getOrderById(orderId: string, userId: string, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found`);
    }

    // Check permissions: users can only view their own orders; admins can view any order
    if (role !== 'ADMIN' && order.userId !== userId) {
      throw new ForbiddenException('You do not have permission to access this order');
    }

    return order;
  }

  /**
   * Updates an order's status.
   * - Restricts updates to a set of predefined, valid statuses.
   * - Accessible only by ADMIN users (enforced by guard).
   */
  async updateOrderStatus(orderId: string, status: string) {
    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    
    const formattedStatus = status.toUpperCase();
    if (!validStatuses.includes(formattedStatus)) {
      throw new BadRequestException(
        `Invalid status: "${status}". Allowed values: ${validStatuses.join(', ')}`,
      );
    }

    // Ensure order exists before updating
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found`);
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: formattedStatus,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }
}
