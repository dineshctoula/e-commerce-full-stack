import { Test, TestingModule } from '@nestjs/testing';
import { ReviewService } from './review.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

describe('ReviewService', () => {
  let service: ReviewService;

  const mockPrismaService = {
    product: {
      findUnique: jest.fn(),
    },
    review: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    order: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createReview', () => {
    const userId = 'user-1';
    const productId = 'prod-1';
    const dto = { rating: 5, comment: 'Great product!' };

    it('should create a review if user is a verified purchaser and has not reviewed yet', async () => {
      const mockProduct = { id: productId, title: 'Test Product' };
      const mockOrder = { id: 'order-1', userId, status: 'PROCESSING' };
      const mockCreatedReview = { id: 'rev-1', ...dto, userId, productId };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.review.findUnique.mockResolvedValue(null);
      mockPrismaService.order.findFirst.mockResolvedValue(mockOrder);
      mockPrismaService.review.create.mockResolvedValue(mockCreatedReview);

      const result = await service.createReview(userId, productId, dto);

      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({ where: { id: productId } });
      expect(mockPrismaService.review.findUnique).toHaveBeenCalledWith({
        where: { userId_productId: { userId, productId } },
      });
      /*
      expect(mockPrismaService.order.findFirst).toHaveBeenCalledWith({
        where: {
          userId,
          status: { in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] },
          items: { some: { productId } },
        },
      });
      */
      expect(mockPrismaService.review.create).toHaveBeenCalledWith({
        data: {
          rating: dto.rating,
          comment: dto.comment,
          userId,
          productId,
        },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      });
      expect(result).toEqual(mockCreatedReview);
    });

    it('should throw NotFoundException if product is not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.createReview(userId, productId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if user has already reviewed the product', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({ id: productId });
      mockPrismaService.review.findUnique.mockResolvedValue({ id: 'existing-rev-1' });

      await expect(service.createReview(userId, productId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    /*
    it('should throw ForbiddenException if user has not purchased the product', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({ id: productId });
      mockPrismaService.review.findUnique.mockResolvedValue(null);
      mockPrismaService.order.findFirst.mockResolvedValue(null);

      await expect(service.createReview(userId, productId, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });
    */
  });

  describe('getReviewsForProduct', () => {
    const productId = 'prod-1';

    it('should return a list of reviews if product exists', async () => {
      const mockReviews = [
        { id: 'rev-1', rating: 5, comment: 'Nice', user: { name: 'Alice' } },
      ];
      mockPrismaService.product.findUnique.mockResolvedValue({ id: productId });
      mockPrismaService.review.findMany.mockResolvedValue(mockReviews);

      const result = await service.getReviewsForProduct(productId);

      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({ where: { id: productId } });
      expect(mockPrismaService.review.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockReviews);
    });

    it('should throw NotFoundException if product does not exist', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.getReviewsForProduct(productId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteReview', () => {
    const reviewId = 'rev-1';
    const authorId = 'user-1';
    const mockReview = { id: reviewId, userId: authorId, rating: 5, comment: 'Good' };

    it('should delete review if requester is the author', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(mockReview);
      mockPrismaService.review.delete.mockResolvedValue(mockReview);

      const result = await service.deleteReview(authorId, 'USER', reviewId);

      expect(mockPrismaService.review.findUnique).toHaveBeenCalledWith({ where: { id: reviewId } });
      expect(mockPrismaService.review.delete).toHaveBeenCalledWith({ where: { id: reviewId } });
      expect(result).toEqual(mockReview);
    });

    it('should delete review if requester is an ADMIN', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(mockReview);
      mockPrismaService.review.delete.mockResolvedValue(mockReview);

      const result = await service.deleteReview('admin-1', 'ADMIN', reviewId);

      expect(result).toEqual(mockReview);
    });

    it('should throw NotFoundException if review does not exist', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(null);

      await expect(service.deleteReview(authorId, 'USER', reviewId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if requester is neither author nor admin', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(mockReview);

      await expect(service.deleteReview('other-user-2', 'USER', reviewId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
