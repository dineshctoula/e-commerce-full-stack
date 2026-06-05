import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { GetCurrentUserId } from '../auth/decorators/get-current-user-id.decorator';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderService } from './order.service';

// OrderController handles routing for Orders endpoints.
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // POST /orders
  // Creates a new customer order. Protected globally by AtGuard.
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @GetCurrentUserId() userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.orderService.createOrder(userId, dto);
  }

  // GET /orders
  // Retrieves orders: Admins see all orders; regular users see only their own.
  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(
    @GetCurrentUserId() userId: string,
    @GetCurrentUser('role') role: string,
  ) {
    return this.orderService.getOrders(userId, role);
  }

  // GET /orders/admin/stats
  // Retrieves administrative statistics. Restricted to ADMIN role only.
  @Get('admin/stats')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  getStats() {
    return this.orderService.getAdminStats();
  }

  // GET /orders/:id
  // Retrieves details of a single order. Validates ownership (unless Admin).
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(
    @Param('id') orderId: string,
    @GetCurrentUserId() userId: string,
    @GetCurrentUser('role') role: string,
  ) {
    return this.orderService.getOrderById(orderId, userId, role);
  }

  // PATCH /orders/:id/status
  // Updates order status. Restricted to ADMIN role only.
  @Patch(':id/status')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  updateStatus(
    @Param('id') orderId: string,
    @Body('status') status: string,
  ) {
    return this.orderService.updateOrderStatus(orderId, status);
  }
}
