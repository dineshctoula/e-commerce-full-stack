import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { CouponService } from './coupon.service';

/**
 * Controller managing coupon campaigns and discount rules.
 * Restricts coupon CRUD actions to ADMIN users.
 */
@Controller('coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  /**
   * Creates a new discount coupon.
   * Restricted to admin accounts.
   */
  @Post()
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCouponDto) {
    return this.couponService.createCoupon(dto);
  }

  /**
   * Retrieves all coupons.
   * Restricted to admin accounts.
   */
  @Get()
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  findAll() {
    return this.couponService.findAllCoupons();
  }

  /**
   * Deletes a coupon by ID.
   * Restricted to admin accounts.
   */
  @Delete(':id')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.couponService.deleteCoupon(id);
  }
}
