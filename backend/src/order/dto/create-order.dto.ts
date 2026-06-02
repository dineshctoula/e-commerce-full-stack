import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// OrderItemDto validates each individual item within the incoming order payload.
export class OrderItemDto {
  @IsString()
  @IsNotEmpty({ message: 'Product ID is required' })
  productId: string;

  // Quantity must be an integer and must be at least 1.
  @IsInt({ message: 'Quantity must be an integer' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @IsNotEmpty({ message: 'Quantity is required' })
  quantity: number;
}

// CreateOrderDto validates the outer order payload structure.
export class CreateOrderDto {
  // Validate that items is an array.
  @IsArray({ message: 'Items must be an array' })
  // Validate nested validation rules for each item inside the array.
  @ValidateNested({ each: true })
  // Define target class type for validation transform.
  @Type(() => OrderItemDto)
  @IsNotEmpty({ message: 'Order items cannot be empty' })
  items: OrderItemDto[];
}
