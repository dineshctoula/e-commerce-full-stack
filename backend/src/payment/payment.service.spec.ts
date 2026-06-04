import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

describe('PaymentService', () => {
  let service: PaymentService;

  const mockPrismaService = {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockStripe = {
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
  };

  beforeEach(async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    // Inject mock Stripe instance
    (service as any).stripe = mockStripe;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPaymentIntent', () => {
    const userId = 'user-123';
    const orderId = 'order-123';
    const mockOrder = {
      id: orderId,
      userId,
      totalAmount: 120.5,
      status: 'PENDING',
    };

    it('should create a payment intent successfully', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_mock_123',
        client_secret: 'secret_mock_123',
      });

      const result = await service.createPaymentIntent(userId, orderId);

      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: orderId },
      });
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 12050, // 120.50 * 100
        currency: 'usd',
        metadata: {
          orderId,
          userId,
        },
      });
      expect(result).toEqual({
        clientSecret: 'secret_mock_123',
        paymentIntentId: 'pi_mock_123',
        amount: 120.5,
      });
    });

    it('should throw NotFoundException if the order does not exist', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(
        service.createPaymentIntent(userId, orderId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if order is not owned by the user', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        userId: 'other-user',
      });

      await expect(
        service.createPaymentIntent(userId, orderId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if order status is not PENDING', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: 'PROCESSING',
      });

      await expect(
        service.createPaymentIntent(userId, orderId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirmPayment', () => {
    const userId = 'user-123';
    const orderId = 'order-123';
    const paymentIntentId = 'pi_mock_123';
    const mockOrder = {
      id: orderId,
      userId,
      totalAmount: 120.5,
      status: 'PENDING',
    };

    it('should confirm payment and transition order to PROCESSING', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: paymentIntentId,
        status: 'succeeded',
        metadata: {
          orderId,
        },
      });
      mockPrismaService.order.update.mockResolvedValue({
        ...mockOrder,
        status: 'PROCESSING',
      });

      const result = await service.confirmPayment(userId, orderId, paymentIntentId);

      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: orderId },
      });
      expect(mockStripe.paymentIntents.retrieve).toHaveBeenCalledWith(paymentIntentId);
      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: { status: 'PROCESSING' },
        include: { items: { include: { product: true } } },
      });
      expect(result.status).toBe('PROCESSING');
    });

    it('should throw NotFoundException if order does not exist', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(
        service.confirmPayment(userId, orderId, paymentIntentId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if order is not owned by user', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        userId: 'other-user',
      });

      await expect(
        service.confirmPayment(userId, orderId, paymentIntentId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if stripe payment status is not succeeded', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: paymentIntentId,
        status: 'requires_payment_method',
        metadata: {
          orderId,
        },
      });

      await expect(
        service.confirmPayment(userId, orderId, paymentIntentId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if stripe payment intent metadata orderId mismatch', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: paymentIntentId,
        status: 'succeeded',
        metadata: {
          orderId: 'wrong-order-id',
        },
      });

      await expect(
        service.confirmPayment(userId, orderId, paymentIntentId),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
