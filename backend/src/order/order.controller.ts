import { Controller } from '@nestjs/common';
import { OrderService } from './order.service';

// OrderController handles routing for Orders endpoints.
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // Shell controller. Route handlers will be wired up in the next steps.
}
