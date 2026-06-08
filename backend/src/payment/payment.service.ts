import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

/**
 * Service facilitating integration with the Stripe API and managing order payment confirmation database updates.
 */
@Injectable()
export class PaymentService {
  private stripe: any;

  constructor(private prisma: PrismaService) {
    // Instantiate Stripe SDK using secret key loaded from env variables
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
  }

  /**
   * Initializes a new PaymentIntent with Stripe for a specific customer order.
   *
   * @param userId - ID of the paying user.
   * @param orderId - UUID of the target order.
   * @returns Object wrapping clientSecret token, PaymentIntent ID, and total charge amount.
   */
  async createPaymentIntent(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found`);
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('You do not have permission to pay for this order');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException(`Order cannot be paid because status is "${order.status}"`);
    }

    // Convert total dollar amounts to cents as expected by Stripe (integer representation)
    const amountInCents = Math.round(order.totalAmount * 100);

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: {
        orderId: order.id,
        userId,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: order.totalAmount,
    };
  }

  /**
   * Contacts Stripe APIs to retrieve and verify a PaymentIntent completion status.
   * Promotes the associated Order status from PENDING to PROCESSING upon success.
   *
   * @param userId - ID of the paying user.
   * @param orderId - UUID of the target order.
   * @param paymentIntentId - Stripe unique identifier string.
   * @returns Updated order state record.
   */
  async confirmPayment(userId: string, orderId: string, paymentIntentId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found`);
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('You do not have permission to pay for this order');
    }

    // Direct network retrieval of PaymentIntent properties from Stripe servers
    const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      throw new BadRequestException(`Payment has not succeeded. Current status: ${paymentIntent.status}`);
    }

    if (paymentIntent.metadata.orderId !== orderId) {
      throw new BadRequestException('Payment Intent metadata does not match the order ID');
    }

    // Advance order to PROCESSING state once payment confirmation succeeds
    if (order.status === 'PENDING') {
      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'PROCESSING',
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
      return updatedOrder;
    }

    return order;
  }
}
