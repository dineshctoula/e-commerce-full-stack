import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ProductService', () => {
  let service: ProductService;

  const mockPrismaService = {
    product: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const dto = {
        title: 'Keyboard',
        description: 'Mechanical',
        price: 99.99,
        category: 'Electronics',
        stock: 10,
      };
      const createdProduct = {
        id: 'prod-1',
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.product.create.mockResolvedValue(createdProduct);

      const result = await service.create(dto);

      expect(mockPrismaService.product.create).toHaveBeenCalledWith({
        data: {
          title: dto.title,
          description: dto.description,
          price: dto.price,
          image: undefined,
          category: dto.category,
          stock: dto.stock,
        },
      });
      expect(result).toEqual(createdProduct);
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const products = [
        {
          id: 'prod-1',
          title: 'Keyboard',
          price: 99.99,
          category: 'Electronics',
        },
      ];
      mockPrismaService.product.findMany.mockResolvedValue(products);
      mockPrismaService.product.count.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(mockPrismaService.product.findMany).toHaveBeenCalled();
      expect(mockPrismaService.product.count).toHaveBeenCalled();
      expect(result).toEqual({
        products,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe('findOne', () => {
    it('should return a product if found', async () => {
      const product = { id: 'prod-1', title: 'Keyboard' };
      mockPrismaService.product.findUnique.mockResolvedValue(product);

      const result = await service.findOne('prod-1');

      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
      });
      expect(result).toEqual(product);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update and return product if it exists', async () => {
      const product = {
        id: 'prod-1',
        title: 'Keyboard',
        description: 'Mechanical',
        price: 99.99,
        category: 'Electronics',
        stock: 10,
      };
      const dto = { title: 'New Keyboard' };
      const updatedProduct = { ...product, ...dto };

      mockPrismaService.product.findUnique.mockResolvedValue(product);
      mockPrismaService.product.update.mockResolvedValue(updatedProduct);

      const result = await service.update('prod-1', dto);

      expect(mockPrismaService.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: {
          title: dto.title,
          description: undefined,
          price: undefined,
          image: undefined,
          category: undefined,
          stock: undefined,
        },
      });
      expect(result).toEqual(updatedProduct);
    });
  });

  describe('remove', () => {
    it('should delete and return product if it exists', async () => {
      const product = { id: 'prod-1', title: 'Keyboard' };
      mockPrismaService.product.findUnique.mockResolvedValue(product);
      mockPrismaService.product.delete.mockResolvedValue(product);

      const result = await service.remove('prod-1');

      expect(mockPrismaService.product.delete).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
      });
      expect(result).toEqual(product);
    });
  });
});
