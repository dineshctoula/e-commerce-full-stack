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
import { GetCurrentUserId } from '../auth/decorators/get-current-user-id.decorator';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewService } from './review.service';

/**
 * Controller exposing REST API endpoints for product reviews.
 * Inherits the ':productId' route parameter from the controller prefix.
 */
@Controller('products/:productId/reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  /**
   * Submits a new review for a product.
   * Requires JWT authentication. Enforces verified purchase limits.
   *
   * @param userId - ID of the authenticated user.
   * @param productId - Target product UUID.
   * @param dto - Rating and review text.
   * @returns Newly created Review record.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @GetCurrentUserId() userId: string,
    @Param('productId') productId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewService.createReview(userId, productId, dto);
  }

  /**
   * Retrieves all reviews for a specific product.
   * Accessible by public guest users.
   *
   * @param productId - Target product UUID.
   * @returns Array of product reviews.
   */
  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  findAll(@Param('productId') productId: string) {
    return this.reviewService.getReviewsForProduct(productId);
  }

  /**
   * Removes a review by ID.
   * Restricted to the author of the review or an Admin.
   *
   * @param userId - ID of the authenticated user.
   * @param role - Role of the authenticated user.
   * @param reviewId - Target review UUID.
   * @returns Deleted review record details.
   */
  @Delete(':reviewId')
  @HttpCode(HttpStatus.OK)
  remove(
    @GetCurrentUserId() userId: string,
    @GetCurrentUser('role') role: string,
    @Param('reviewId') reviewId: string,
  ) {
    return this.reviewService.deleteReview(userId, role, reviewId);
  }
}
