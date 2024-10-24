import { IsString, IsInt, IsOptional, IsEnum } from 'class-validator';

export class CreateTaskDto {
  @IsInt()
  reward: number;

  @IsString()
  taskDescription: string;

  @IsOptional()
  @IsString()
  imageLink?: string;

  @IsOptional()
  @IsString()
  taskLink?: string;

  @IsEnum(['regular', 'daily', 'temporary'])
  type: 'regular' | 'daily' | 'temporary';

  @IsOptional()
  @IsString() // Принимаем дату как строку
  startDate?: string;

  @IsOptional()
  @IsString() // Принимаем дату как строку
  endDate?: string;
}
