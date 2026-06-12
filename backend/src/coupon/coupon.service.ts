import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';

@Injectable()
export class CouponService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates a new promotional coupon.
   * Forces the coupon code to be uppercase.
   */
  async createCoupon(dto: CreateCouponDto) {
    const formattedCode = dto.code.toUpperCase().trim();

    const existingCoupon = await this.prisma.coupon.findUnique({
      where: { code: formattedCode },
    });

    if (existingCoupon) {
      throw new BadRequestException(`Coupon with code "${formattedCode}" already exists`);
    }

    // Validate percentage values
    if (dto.discountType === 'PERCENTAGE' && dto.value > 100) {
      throw new BadRequestException('Percentage discount value cannot exceed 100');
    }

    return this.prisma.coupon.create({
      data: {
        code: formattedCode,
        discountType: dto.discountType,
        value: dto.value,
        minOrderAmount: dto.minOrderAmount ?? 0,
        maxUses: dto.maxUses,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        active: dto.active ?? true,
      },
    });
  }

  /**
   * Retrieves all coupons in the system.
   */
  async findAllCoupons() {
    return this.prisma.coupon.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Deletes a coupon by ID.
   */
  async deleteCoupon(id: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID "${id}" not found`);
    }

    return this.prisma.coupon.delete({
      where: { id },
    });
  }

  /**
   * Validates a coupon code against usage limits, expiry, and minimum order requirements.
   * Does NOT alter database counts.
   */
  async validateCouponCode(code: string, cartTotal: number) {
    const formattedCode = code.toUpperCase().trim();

    const coupon = await this.prisma.coupon.findUnique({
      where: { code: formattedCode },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon code "${formattedCode}" not found`);
    }

    if (!coupon.active) {
      throw new BadRequestException('Coupon is inactive');
    }

    if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
      throw new BadRequestException('Coupon has expired');
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    if (cartTotal < coupon.minOrderAmount) {
      throw new BadRequestException(
        `Minimum order amount of $${coupon.minOrderAmount.toFixed(2)} is required to use this coupon`,
      );
    }

    return coupon;
  }
}
