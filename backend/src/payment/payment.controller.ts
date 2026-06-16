import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { GetCurrentUserId } from '../auth/decorators/get-current-user-id.decorator';
import { CreateIntentDto } from './dto/create-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { ConfirmEsewaDto } from './dto/confirm-esewa.dto';
import { PaymentService } from './payment.service';

/**
 * Controller handling payment workflows.
 * Integrates with Stripe payment intent endpoints to facilitate secure credit card checkouts.
 */
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Generates a new Stripe PaymentIntent for a pending customer order.
   * Returns clientSecret used by Stripe React Elements on frontend.
   *
   * @param userId - ID of the calling user.
   * @param dto - CreateIntentDto containing the target orderId.
   * @returns Object containing clientSecret and paymentIntentId.
   */
  @Post('create-intent')
  @HttpCode(HttpStatus.OK)
  createIntent(
    @GetCurrentUserId() userId: string,
    @Body() dto: CreateIntentDto,
  ) {
    return this.paymentService.createPaymentIntent(userId, dto.orderId);
  }

  /**
   * Verifies a completed Stripe PaymentIntent ID status against Stripe servers.
   * Promotes the target order's status to PROCESSING if successful.
   *
   * @param userId - ID of the calling user.
   * @param dto - ConfirmPaymentDto containing orderId and paymentIntentId.
   * @returns The updated Order entity.
   */
  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  confirm(
    @GetCurrentUserId() userId: string,
    @Body() dto: ConfirmPaymentDto,
  ) {
    return this.paymentService.confirmPayment(userId, dto.orderId, dto.paymentIntentId);
  }

  /**
   * Generates eSewa redirect parameters for a pending order.
   */
  @Post('esewa/create-intent')
  @HttpCode(HttpStatus.OK)
  createEsewaIntent(
    @GetCurrentUserId() userId: string,
    @Body() dto: CreateIntentDto,
  ) {
    return this.paymentService.createEsewaIntent(userId, dto.orderId);
  }

  /**
   * Confirms eSewa payment redirection payload.
   */
  @Post('esewa/confirm')
  @HttpCode(HttpStatus.OK)
  confirmEsewa(
    @GetCurrentUserId() userId: string,
    @Body() dto: ConfirmEsewaDto,
  ) {
    return this.paymentService.confirmEsewaPayment(userId, dto.data);
  }
}
