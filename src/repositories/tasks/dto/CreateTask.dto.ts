import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateTaskDto {
  @IsNotEmpty()
  @IsNumber()
  reward: number;

  @IsNotEmpty()
  @IsString()
  taskDescription: string;

  @IsNotEmpty()
  @IsString()
  imageLink: string;

  @IsNotEmpty()
  @IsString()
  taskLink: string;
}
