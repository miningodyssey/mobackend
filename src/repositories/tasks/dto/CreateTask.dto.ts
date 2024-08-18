import { IsNotEmpty, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTaskDto {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
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
