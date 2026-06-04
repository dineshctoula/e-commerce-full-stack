import { IsNotEmpty, IsString } from 'class-validator';

export class CreateIntentDto {
  @IsString()
  @IsNotEmpty({ message: 'Order ID is required' })
  orderId: string;
}
