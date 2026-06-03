import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

describe('OrderService', () => {
  let service: OrderService;

  // Mock Prisma Service helper.
  // The $transaction mock receives a callback and runs it synchronously, passing itself as the transaction client.
  const mockPrismaService = {
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
    product: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    orderItem: {
      createMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrder', () => {
    const userId = 'user-123';
    const dto = {
      items: [
        { productId: 'prod-1', quantity: 2 },
      ],
      shippingAddress: '123 Main St',
      shippingCity: 'Metropolis',
      shippingPostalCode: '10001',
      shippingCountry: 'USA',
      shippingPhone: '555-0199',
      shippingEmail: 'john@example.com',
      shippingLocalAddress: 'Apartment 4B',
    };
    const mockProduct = {
      id: 'prod-1',
      title: 'Mechanical Keyboard',
      price: 150.0,
      stock: 10,
    };

    it('should create an order successfully when stock is available', async () => {
      // Setup mock returns
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);
      mockPrismaService.product.update.mockResolvedValue({ ...mockProduct, stock: 8 });
      mockPrismaService.order.create.mockResolvedValue({ id: 'order-123', userId, totalAmount: 300.0, status: 'PENDING' });
      mockPrismaService.orderItem.createMany.mockResolvedValue({ count: 1 });
      
      const expectedOrderDetails = {
        id: 'order-123',
        userId,
        totalAmount: 300.0,
        status: 'PENDING',
        items: [
          {
            id: 'item-1',
            orderId: 'order-123',
            productId: 'prod-1',
            quantity: 2,
            price: 150.0,
            product: mockProduct,
          },
        ],
      };
      mockPrismaService.order.findUnique.mockResolvedValue(expectedOrderDetails);

      const result = await service.createOrder(userId, dto);

      // Verify transaction flow checks out
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['prod-1'] } },
      });
      expect(mockPrismaService.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { stock: 8 },
      });
      expect(mockPrismaService.order.create).toHaveBeenCalledWith({
        data: {
          userId,
          totalAmount: 300.0,
          status: 'PENDING',
          shippingAddress: '123 Main St',
          shippingCity: 'Metropolis',
          shippingPostalCode: '10001',
          shippingCountry: 'USA',
          shippingPhone: '555-0199',
          shippingEmail: 'john@example.com',
          shippingLocalAddress: 'Apartment 4B',
        },
      });
      expect(mockPrismaService.orderItem.createMany).toHaveBeenCalledWith({
        data: [
          { orderId: 'order-123', productId: 'prod-1', quantity: 2, price: 150.0 },
        ],
      });
      expect(result).toEqual(expectedOrderDetails);
    });

    it('should throw NotFoundException if a product is not found', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]); // Empty product list returned

      await expect(service.createOrder(userId, dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if stock is insufficient', async () => {
      // Product stock is 1, but we requested 2
      const lowStockProduct = { ...mockProduct, stock: 1 };
      mockPrismaService.product.findMany.mockResolvedValue([lowStockProduct]);

      await expect(service.createOrder(userId, dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getOrders', () => {
    const orders = [
      { id: 'order-1', userId: 'user-1', totalAmount: 100 },
      { id: 'order-2', userId: 'user-2', totalAmount: 200 },
    ];

    it('should return all orders for admins', async () => {
      mockPrismaService.order.findMany.mockResolvedValue(orders);

      const result = await service.getOrders('admin-id', 'ADMIN');

      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith({
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(orders);
    });

    it('should return user orders only for regular users', async () => {
      const userOrders = [orders[0]];
      mockPrismaService.order.findMany.mockResolvedValue(userOrders);

      const result = await service.getOrders('user-1', 'USER');

      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(userOrders);
    });
  });

  describe('getOrderById', () => {
    const mockOrder = { id: 'order-1', userId: 'user-1', totalAmount: 100 };

    it('should return the order details if owner is requesting', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.getOrderById('order-1', 'user-1', 'USER');

      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        include: { items: { include: { product: true } } },
      });
      expect(result).toEqual(mockOrder);
    });

    it('should return the order details if admin is requesting', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.getOrderById('order-1', 'other-user', 'ADMIN');

      expect(result).toEqual(mockOrder);
    });

    it('should throw ForbiddenException if user is not the owner and not admin', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      await expect(
        service.getOrderById('order-1', 'other-user', 'USER'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if order does not exist', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(
        service.getOrderById('invalid-order', 'user-1', 'USER'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateOrderStatus', () => {
    const mockOrder = { id: 'order-1', status: 'PENDING' };

    it('should successfully update status with a valid status string', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.update.mockResolvedValue({ ...mockOrder, status: 'SHIPPED' });

      const result = await service.updateOrderStatus('order-1', 'shipped');

      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'SHIPPED' },
        include: { items: { include: { product: true } } },
      });
      expect(result.status).toBe('SHIPPED');
    });

    it('should throw BadRequestException for invalid status states', async () => {
      await expect(
        service.updateOrderStatus('order-1', 'invalid-status-state'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if order does not exist', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(
        service.updateOrderStatus('invalid-order', 'SHIPPED'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
