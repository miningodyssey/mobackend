import { Controller, Post, Body, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../repositories/users/entity/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body('id') id: string) {
    const user = await this.authService.validateUser(id);
    if (user) {
      return this.authService.login(user);
    } else {
      return { message: 'Invalid credentials' };
    }
  }

  @Post('register/:id')
  async register(@Param('id') userId: string, @Body() userData: Partial<User>) {
    return this.authService.register(userId, userData);
  }
}
