// backend/src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 1. ተጠቃሚው ቀድሞውኑ መዘጋቱን ማረጋገጥ (Check Lockout)
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockoutUntil.getTime() - new Date().getTime()) / 60000);
      throw new ForbiddenException(`Account is temporarily locked. Try again in ${minutesLeft} minutes.`);
    }

    // 2. የይለፍ ቃል ማረጋገጥ (Verify Password)
    const isPasswordValid = await bcrypt.compare(pass, user.passwordHash);

    if (!isPasswordValid) {
      const attempts = user.loginAttempts + 1;
      
      // 3. ሙከራው 5 ከሆነ መዝጋት (Lock Account)
      if (attempts >= 5) {
        const lockoutTime = new Date();
        lockoutTime.setMinutes(lockoutTime.getMinutes() + 15); // 15 ደቂቃ ይዘጋል
        
        await this.prisma.user.update({
          where: { id: user.id },
          data: { loginAttempts: attempts, lockoutUntil: lockoutTime },
        });
        throw new ForbiddenException('Account locked due to too many failed attempts. Try again in 15 minutes.');
      } else {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { loginAttempts: attempts },
        });
        throw new UnauthorizedException(`Invalid credentials. ${5 - attempts} attempts remaining.`);
      }
    }

    // 4. ሎጊን ስኬታማ ከሆነ ሙከራዎችን ማጽዳት (Reset attempts)
    if (user.loginAttempts > 0 || user.lockoutUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: 0, lockoutUntil: null },
      });
    }

    // የይለፍ ቃልን ሳንጨምር መረጃውን መመለስ
    const { passwordHash, loginAttempts, lockoutUntil, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      }
    };
  }
}