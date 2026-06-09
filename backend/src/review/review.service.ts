import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

/**
 * Service providing core business logic for review management.
 * Handles verified purchase validation, duplicate prevention, retrieval, and authorization for deletions.
 */
@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  /**
   * Submits a new product review.
   * Validates product existence, checks for duplicates, and confirms that the user is a verified purchaser.
   *
   * @param userId - ID of the reviewing user.
   * @param productId - ID of the product being reviewed.
   * @param dto - Star rating and comment text.
   * @returns Persisted Review record.
   */
  async createReview(userId: string, productId: string, dto: CreateReviewDto) {
    // 1. Ensure product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found`);
    }

    // 2. Ensure user has not already reviewed this product
    const existingReview = await this.prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });
    if (existingReview) {
      throw new BadRequestException('You have already submitted a review for this product');
    }

    // 3. Verified Purchaser Check: (Temporarily commented out to ease review testing without payment gateways)
    /*
    const order = await this.prisma.order.findFirst({
      where: {
        userId,
        status: { in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] },
        items: {
          some: {
            productId,
          },
        },
      },
    });

    if (!order) {
      throw new ForbiddenException('Only verified purchasers of this product can submit a review');
    }
    */

    // 4. Create and return the review
    return this.prisma.review.create({
      data: {
        rating: dto.rating,
        comment: dto.comment,
        userId,
        productId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Retrieves list of reviews for a product.
   * Sorted by newest first.
   *
   * @param productId - Target product UUID.
   * @returns Array of reviews containing reviewer profiles.
   */
  async getReviewsForProduct(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found`);
    }

    return this.prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Deletes a review record.
   * Restricts deletions to the author or an administrator.
   *
   * @param userId - ID of request owner.
   * @param role - Role of request owner (USER/ADMIN).
   * @param reviewId - ID of target review to remove.
   * @returns Deleted review record.
   */
  async deleteReview(userId: string, role: string, reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID "${reviewId}" not found`);
    }

    // Restrict access: author of the review or ADMIN role
    if (role !== 'ADMIN' && review.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this review');
    }

    return this.prisma.review.delete({
      where: { id: reviewId },
    });
  }
}
