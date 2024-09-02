import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../repositories/users/users.service';
import { User } from '../repositories/users/entity/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(id: string): Promise<User | null> {
    const user = await this.usersService.getUser(id);
    if (user) {
      return user;
    }
    return null;
  }

  async login(user: User) {
    const payload = { sub: user.id, username: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(id: string, userData: Partial<User>) {
    const user = await this.usersService.createUserIfNotExists(id, userData);
    return this.login(user);
  }
}
