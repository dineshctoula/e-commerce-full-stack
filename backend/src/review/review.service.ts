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
   * Checks if a user is eligible to review a product.
   * Verifies product exists, checks if the user has already submitted a review,
   * and verifies if the user has purchased the product.
   *
   * @param userId - ID of the checking user.
   * @param productId - ID of the product.
   * @returns Object indicating eligibility and reason if not eligible.
   */
  async checkEligibility(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found`);
    }

    const existingReview = await this.prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });
    if (existingReview) {
      return { eligible: false, reason: 'ALREADY_REVIEWED' };
    }

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
      return { eligible: false, reason: 'NOT_PURCHASED' };
    }

    return { eligible: true };
  }

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
    const eligibility = await this.checkEligibility(userId, productId);
    if (!eligibility.eligible) {
      if (eligibility.reason === 'ALREADY_REVIEWED') {
        throw new BadRequestException('You have already submitted a review for this product');
      }
      if (eligibility.reason === 'NOT_PURCHASED') {
        throw new ForbiddenException('Only verified purchasers of this product can submit a review');
      }
    }

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
