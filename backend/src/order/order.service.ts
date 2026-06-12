import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

/**
 * Service managing customer checkout orders, database transactions, status changes, and admin statistics.
 * Utilizes SQLite database transactions via Prisma to guarantee inventory stock consistency.
 */
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

      let discountAmount = 0;
      let couponId = null;

      if (dto.couponCode) {
        const formattedCode = dto.couponCode.toUpperCase().trim();
        const coupon = await tx.coupon.findUnique({
          where: { code: formattedCode },
        });

        if (!coupon) {
          throw new NotFoundException(`Coupon code "${formattedCode}" not found`);
        }

        if (!coupon.active) {
          throw new BadRequestException('Coupon is inactive');
        }

        if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
          throw new BadRequestException('Coupon has expired');
        }

        if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
          throw new BadRequestException('Coupon usage limit reached');
        }

        if (totalAmount < coupon.minOrderAmount) {
          throw new BadRequestException(
            `Minimum order amount of $${coupon.minOrderAmount.toFixed(2)} is required to use this coupon`,
          );
        }

        couponId = coupon.id;
        if (coupon.discountType === 'PERCENTAGE') {
          discountAmount = totalAmount * (coupon.value / 100);
        } else {
          discountAmount = coupon.value;
        }

        discountAmount = Math.min(discountAmount, totalAmount);
        totalAmount -= discountAmount;

        await tx.coupon.update({
          where: { id: coupon.id },
          data: {
            usedCount: { increment: 1 },
          },
        });
      }

      const order = await tx.order.create({
        data: {
          userId,
          totalAmount,
          discountAmount,
          couponId,
          status: 'PENDING',
          shippingAddress: dto.shippingAddress,
          shippingCity: dto.shippingCity,
          shippingPostalCode: dto.shippingPostalCode,
          shippingCountry: dto.shippingCountry,
          shippingPhone: dto.shippingPhone,
          shippingEmail: dto.shippingEmail,
          shippingLocalAddress: dto.shippingLocalAddress,
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
          coupon: true,
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
          coupon: true,
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
        coupon: true,
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
        coupon: true,
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

    if (formattedStatus === 'CANCELLED') {
      return this.cancelOrder(orderId, order.userId, 'ADMIN');
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
        coupon: true,
      },
    });
  }

  /**
   * Cancels a customer order.
   * - Accessible by ADMIN or the owner of the order.
   * - Restores stock counts for all products in the order using a transaction.
   * - Restricts cancellation to PENDING or PROCESSING orders.
   */
  async cancelOrder(orderId: string, userId: string, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found`);
    }

    // Role or owner verification
    if (role !== 'ADMIN' && order.userId !== userId) {
      throw new ForbiddenException('You do not have permission to cancel this order');
    }

    if (order.status === 'CANCELLED') {
      throw new BadRequestException('Order is already cancelled');
    }

    if (order.status === 'DELIVERED' || order.status === 'SHIPPED') {
      throw new BadRequestException(`Cannot cancel order because it is already ${order.status.toLowerCase()}`);
    }

    // Database transaction to update order status and restore stock
    return this.prisma.$transaction(async (tx) => {
      // 1. Update order status to CANCELLED
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // 2. Increment product stocks
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }

      return updatedOrder;
    });
  }

  /**
   * Retrieves administrative analytics and statistics.
   * Accessible only by ADMIN users.
   */
  async getAdminStats() {
    const orders = await this.prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    const activeOrders = orders.filter((o) => o.status !== 'CANCELLED');
    const totalSales = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrders = orders.length;
    const averageOrderValue = activeOrders.length > 0 ? totalSales / activeOrders.length : 0;

    // Status breakdown
    const statusBreakdown = {
      PENDING: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    for (const order of orders) {
      const status = order.status.toUpperCase();
      if (status in statusBreakdown) {
        statusBreakdown[status as keyof typeof statusBreakdown]++;
      }
    }

    // Category Sales breakdown
    const categorySales: Record<string, number> = {};
    for (const order of activeOrders) {
      for (const item of order.items) {
        const cat = item.product?.category || 'Other';
        categorySales[cat] = (categorySales[cat] || 0) + item.price * item.quantity;
      }
    }

    const totalProducts = await this.prisma.product.count();
    const outOfStockProducts = await this.prisma.product.count({
      where: { stock: 0 },
    });

    const recentOrders = await this.prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return {
      totalSales,
      totalOrders,
      averageOrderValue,
      statusBreakdown,
      categorySales,
      totalProducts,
      outOfStockProducts,
      recentOrders,
    };
  }
}
