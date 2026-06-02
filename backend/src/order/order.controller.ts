import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { GetCurrentUserId } from '../auth/decorators/get-current-user-id.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderService } from './order.service';

// OrderController handles routing for Orders endpoints.
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // POST /orders
  // Creates a new customer order. Since AtGuard is global, this route is protected.
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @GetCurrentUserId() userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.orderService.createOrder(userId, dto);
  }
}
