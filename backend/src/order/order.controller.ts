import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { GetCurrentUserId } from '../auth/decorators/get-current-user-id.decorator';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderService } from './order.service';

/**
 * Controller handling customer purchase orders and sales analytics.
 * Secures order placements and history queries, and restricts status updates/stats to ADMIN users.
 */
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * Submits and creates a new order in a pending state.
   * Decrements database product stock within a secure transaction block.
   *
   * @param userId - ID of the authenticated user extracted from the JWT token.
   * @param dto - CreateOrderDto containing items array and shipping details.
   * @returns The newly created Order entity.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @GetCurrentUserId() userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.orderService.createOrder(userId, dto);
  }

  /**
   * Fetches order histories.
   * Returns all system orders for admin accounts, or restricts lookup to the user's own orders.
   *
   * @param userId - ID of the calling user.
   * @param role - Role of the caller (USER or ADMIN).
   * @returns Array of order records with matching items.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(
    @GetCurrentUserId() userId: string,
    @GetCurrentUser('role') role: string,
  ) {
    return this.orderService.getOrders(userId, role);
  }

  /**
   * Retrieves overall system sales, average order sizes, categoric splits, and out-of-stock count metrics.
   * Restricted to admin accounts.
   *
   * @returns System analytics indicators object.
   */
  @Get('admin/stats')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  getStats() {
    return this.orderService.getAdminStats();
  }

  /**
   * Retrieves detail specifications of a single order.
   * Rejects requests if a customer attempts to query another customer's order.
   *
   * @param orderId - UUID of the target order.
   * @param userId - Calling user ID.
   * @param role - Calling user role.
   * @returns The matching Order entity with items list.
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(
    @Param('id') orderId: string,
    @GetCurrentUserId() userId: string,
    @GetCurrentUser('role') role: string,
  ) {
    return this.orderService.getOrderById(orderId, userId, role);
  }

  /**
   * Updates status fields of a specific order (e.g. SHIPPED, DELIVERED).
   * Restricted to admin accounts.
   *
   * @param orderId - UUID of the order to update.
   * @param status - The target status string.
   * @returns The updated Order entity.
   */
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

  /**
   * Cancels a customer order.
   * Restores product stock quantities dynamically in a database transaction.
   * Rejects request if the caller is not the owner of the order and not an ADMIN.
   *
   * @param orderId - UUID of the target order.
   * @param userId - Calling user ID.
   * @param role - Calling user role.
   * @returns The updated Order entity.
   */
  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @Param('id') orderId: string,
    @GetCurrentUserId() userId: string,
    @GetCurrentUser('role') role: string,
  ) {
    return this.orderService.cancelOrder(orderId, userId, role);
  }
}
