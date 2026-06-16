import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmImepayDto {
  @IsString()
  @IsNotEmpty({ message: 'Order ID is required' })
  orderId: string;

  @IsString()
  @IsNotEmpty({ message: 'Ref ID or Token is required' })
  refId: string;
}
