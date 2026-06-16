import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmEsewaDto {
  @IsString()
  @IsNotEmpty({ message: 'Data is required' })
  data: string;
}
