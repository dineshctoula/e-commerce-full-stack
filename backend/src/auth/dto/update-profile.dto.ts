import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsNotEmpty({ message: 'Name cannot be empty' })
  @IsOptional()
  name?: string;

  @IsEmail({}, { message: 'Invalid email address' })
  @IsOptional()
  email?: string;
}
