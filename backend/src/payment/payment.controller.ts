import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { GetCurrentUserId } from '../auth/decorators/get-current-user-id.decorator';
import { CreateIntentDto } from './dto/create-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-intent')
  @HttpCode(HttpStatus.OK)
  createIntent(
    @GetCurrentUserId() userId: string,
    @Body() dto: CreateIntentDto,
  ) {
    return this.paymentService.createPaymentIntent(userId, dto.orderId);
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  confirm(
    @GetCurrentUserId() userId: string,
    @Body() dto: ConfirmPaymentDto,
  ) {
    return this.paymentService.confirmPayment(userId, dto.orderId, dto.paymentIntentId);
  }
}
