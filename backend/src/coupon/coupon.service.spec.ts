import { Test, TestingModule } from '@nestjs/testing';
import { CouponService } from './coupon.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DiscountType } from './dto/create-coupon.dto';

describe('CouponService', () => {
  let service: CouponService;

  const mockPrismaService = {
    coupon: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CouponService>(CouponService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCoupon', () => {
    const dto = {
      code: 'save10',
      discountType: DiscountType.PERCENTAGE,
      value: 10,
      minOrderAmount: 20,
      maxUses: 100,
      expiresAt: '2026-12-31T23:59:59.000Z',
    };

    it('should create coupon successfully with uppercase code', async () => {
      const mockCreatedCoupon = {
        id: 'coupon-1',
        ...dto,
        code: 'SAVE10',
        expiresAt: new Date(dto.expiresAt),
        active: true,
        usedCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.coupon.findUnique.mockResolvedValue(null);
      mockPrismaService.coupon.create.mockResolvedValue(mockCreatedCoupon);

      const result = await service.createCoupon(dto);

      expect(mockPrismaService.coupon.findUnique).toHaveBeenCalledWith({
        where: { code: 'SAVE10' },
      });
      expect(mockPrismaService.coupon.create).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedCoupon);
    });

    it('should throw BadRequestException if coupon code already exists', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue({ id: 'existing-1' });

      await expect(service.createCoupon(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if discountType is PERCENTAGE and value > 100', async () => {
      const invalidDto = { ...dto, value: 105 };
      mockPrismaService.coupon.findUnique.mockResolvedValue(null);

      await expect(service.createCoupon(invalidDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateCouponCode', () => {
    const coupon = {
      id: 'coupon-1',
      code: 'SAVE10',
      discountType: 'PERCENTAGE',
      value: 10,
      minOrderAmount: 50,
      maxUses: 10,
      usedCount: 2,
      active: true,
      expiresAt: new Date('2026-12-31T23:59:59.000Z'),
    };

    it('should validate successfully for active unexpired coupon above min amount', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(coupon);

      const result = await service.validateCouponCode('save10', 100);

      expect(mockPrismaService.coupon.findUnique).toHaveBeenCalledWith({
        where: { code: 'SAVE10' },
      });
      expect(result).toEqual(coupon);
    });

    it('should throw NotFoundException if coupon code does not exist', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(null);

      await expect(service.validateCouponCode('INVALID', 100)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if coupon is inactive', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue({ ...coupon, active: false });

      await expect(service.validateCouponCode('SAVE10', 100)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if coupon is expired', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        ...coupon,
        expiresAt: new Date('2020-01-01T00:00:00.000Z'),
      });

      await expect(service.validateCouponCode('SAVE10', 100)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if usage limit is reached', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        ...coupon,
        maxUses: 5,
        usedCount: 5,
      });

      await expect(service.validateCouponCode('SAVE10', 100)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if cart total is below min order amount', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(coupon);

      await expect(service.validateCouponCode('SAVE10', 40)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
