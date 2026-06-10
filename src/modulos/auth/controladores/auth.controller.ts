import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from '../servicios/auth.service';
import { LoginDto } from '../dto/login.dto';
import { LoginSuperadminDto } from '../dto/login-superadmin.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() body: LoginDto) {
    return await this.authService.login(body);
  }

  @Post('superadmin/login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async loginSuperadmin(@Body() body: LoginSuperadminDto) {
    return await this.authService.loginSuperadmin(body);
  }
}
