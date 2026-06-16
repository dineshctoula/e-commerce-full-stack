import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';
import * as crypto from 'crypto';

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
          paymentMethod: 'STRIPE',
          paymentId: paymentIntentId,
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

  /**
   * Helper function to generate HMAC-SHA256 signature for eSewa sandbox/live payment.
   */
  generateEsewaSignature(totalAmount: string, transactionUuid: string, productCode: string): string {
    const secretKey = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
    const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
    return crypto
      .createHmac('sha256', secretKey)
      .update(message)
      .digest('base64');
  }

  /**
   * Creates a payment intent parameter map for eSewa redirection.
   */
  async createEsewaIntent(userId: string, orderId: string) {
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

    const totalAmountStr = order.totalAmount.toFixed(2);
    const productCode = process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST';
    const signature = this.generateEsewaSignature(totalAmountStr, orderId, productCode);

    const successUrl = process.env.FRONTEND_URL 
      ? `${process.env.FRONTEND_URL}/payment/esewa/success` 
      : 'http://localhost:5173/payment/esewa/success';
      
    const failureUrl = process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/shop`
      : 'http://localhost:5173/shop';

    return {
      amount: totalAmountStr,
      tax_amount: '0.00',
      total_amount: totalAmountStr,
      transaction_uuid: orderId,
      product_code: productCode,
      product_service_charge: '0.00',
      product_delivery_charge: '0.00',
      success_url: successUrl,
      failure_url: failureUrl,
      signed_field_names: 'total_amount,transaction_uuid,product_code',
      signature: signature,
    };
  }

  /**
   * Confirms eSewa payment status.
   */
  async confirmEsewaPayment(userId: string, data: string) {
    let decodedJson: any;
    try {
      const decodedStr = Buffer.from(data, 'base64').toString('utf-8');
      decodedJson = JSON.parse(decodedStr);
    } catch (err) {
      throw new BadRequestException('Invalid eSewa data payload');
    }

    const { transaction_code, status, total_amount, transaction_uuid, product_code } = decodedJson;

    if (!transaction_uuid) {
      throw new BadRequestException('Missing transaction_uuid in eSewa payload');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: transaction_uuid },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${transaction_uuid}" not found`);
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('You do not have permission to pay for this order');
    }

    // Amount match check
    if (Math.abs(parseFloat(total_amount) - order.totalAmount) > 0.01) {
      throw new BadRequestException('Transaction total amount mismatch');
    }

    // Status check
    if (status !== 'COMPLETE') {
      throw new BadRequestException(`eSewa payment is not COMPLETE. Current status: ${status}`);
    }

    // Server-side check
    if (process.env.MOCK_PAYMENT !== 'true') {
      const verifyUrl = `https://rc.esewa.com.np/api/epay/transaction/status/?product_code=${product_code}&total_amount=${total_amount}&transaction_uuid=${transaction_uuid}`;
      try {
        const response = await fetch(verifyUrl);
        if (response.ok) {
          const result: any = await response.json();
          if (result.status !== 'COMPLETE') {
            throw new BadRequestException(`eSewa status inquiry returned status: ${result.status}`);
          }
        } else {
          console.warn('eSewa server inquiry failed, falling back to local payload validation');
        }
      } catch (err: any) {
        console.warn('eSewa verification connection failed, using local payload validation:', err.message);
      }
    }

    // Update order status to PROCESSING and set paymentMethod / paymentId
    if (order.status === 'PENDING') {
      return this.prisma.order.update({
        where: { id: transaction_uuid },
        data: {
          status: 'PROCESSING',
          paymentMethod: 'ESEWA',
          paymentId: transaction_code || 'esewa_ref',
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

    return order;
  }
}
