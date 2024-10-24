import { IsNotEmpty, IsEnum, IsOptional, IsNumber, IsString } from 'class-validator';

export class CreateTaskDto {
  @IsNotEmpty()
  @IsNumber()
  reward: number;

  @IsNotEmpty()
  @IsString()
  taskTitle: string;

  @IsNotEmpty()
  @IsString()
  taskDescription: string;

  @IsOptional()
  @IsString()
  imageLink?: string;

  @IsOptional()
  @IsString()
  taskLink?: string;

  @IsNotEmpty()
  @IsEnum(['regular', 'daily', 'temporary'])
  type: 'regular' | 'daily' | 'temporary';

  @IsOptional()
  @IsNumber()
  startDate?: number; // Unix timestamp

  @IsOptional()
  @IsNumber()
  endDate?: number; // Unix timestamp

  @IsNotEmpty()
  @IsEnum(['click', 'points', 'invite'])
  actionType: 'click' | 'points' | 'invite'; // Вид действия

  @IsNotEmpty()
  @IsNumber()
  targetValue: number; // Целевое значение (количество кликов, очков или приглашенных друзей)
}
