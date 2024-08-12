import { IsNotEmpty, IsString, IsUrl, IsNumber } from 'class-validator';

export class CreateTaskDto {
  @IsNotEmpty()
  @IsNumber()
  reward: number;

  @IsNotEmpty()
  @IsString()
  taskDescription: string;

  @IsNotEmpty()
  @IsUrl()
  imageLink: string;

  @IsNotEmpty()
  @IsUrl()
  taskLink: string;
}
