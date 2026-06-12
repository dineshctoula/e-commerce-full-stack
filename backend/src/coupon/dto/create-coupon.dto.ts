import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FLAT = 'FLAT',
}

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty({ message: 'Coupon code is required' })
  code: string;

  @IsEnum(DiscountType, { message: 'Discount type must be PERCENTAGE or FLAT' })
  discountType: DiscountType;

  @IsNumber()
  @IsPositive({ message: 'Discount value must be a positive number' })
  value: number;

  @IsNumber()
  @Min(0, { message: 'Minimum order amount must be at least 0' })
  @IsOptional()
  minOrderAmount?: number;

  @IsInt({ message: 'Maximum uses must be an integer' })
  @IsPositive({ message: 'Maximum uses must be positive' })
  @IsOptional()
  maxUses?: number;

  @IsDateString({}, { message: 'Expiration date must be a valid ISO date string' })
  @IsOptional()
  expiresAt?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
