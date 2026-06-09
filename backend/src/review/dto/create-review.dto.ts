import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  MaxLength,
} from 'class-validator';

/**
 * Data Transfer Object for creating a product review.
 * Enforces rating limits between 1 and 5 stars and handles comment constraints.
 */
export class CreateReviewDto {
  @IsInt({ message: 'Rating must be an integer' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating cannot exceed 5' })
  @IsNotEmpty({ message: 'Rating is required' })
  rating: number;

  @IsString({ message: 'Comment must be a string' })
  @IsNotEmpty({ message: 'Comment is required' })
  @MaxLength(500, { message: 'Comment cannot exceed 500 characters' })
  comment: string;
}
