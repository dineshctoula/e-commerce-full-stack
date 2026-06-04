import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
  }

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

    const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      throw new BadRequestException(`Payment has not succeeded. Current status: ${paymentIntent.status}`);
    }

    if (paymentIntent.metadata.orderId !== orderId) {
      throw new BadRequestException('Payment Intent metadata does not match the order ID');
    }

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
