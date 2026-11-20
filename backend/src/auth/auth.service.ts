// backend/src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { RegisterDto, ForgotPasswordDto, ResetPasswordDto } from './dto/login.dto';
import { assertStrongPassword } from '../common/utils/password-policy';

@Injectable()
export class AuthService {
  // In-memory store for OTP reset codes: email -> { code, expiresAt }
  private resetCodes = new Map<string, { code: string; expiresAt: Date }>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 1. ተጠቃሚው መዘጋቱን ማረጋገጥ (Check Lockout)
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockoutUntil.getTime() - new Date().getTime()) / 60000);
      throw new ForbiddenException(
        `Account is temporarily locked due to 5+ failed attempts. Please try again in ${minutesLeft} minute(s) or reset your password.`,
      );
    }

    // 2. አካውንቱ ድራሹ እንዳይጠፋ ወይም እንዳይታገድ መፈተሽ (Check Active)
    if (!user.isActive) {
      throw new ForbiddenException('This account has been deactivated. Please contact the administrator.');
    }

    // 3. የይለፍ ቃል ማረጋገጥ (Verify Password)
    const isPasswordValid = await bcrypt.compare(pass, user.passwordHash);

    if (!isPasswordValid) {
      const attempts = (user.loginAttempts || 0) + 1;

      // 4. ሙከራው 5 እና ከዚያ በላይ ከሆነ መዝጋት (Lock Account for 15 minutes)
      if (attempts >= 5) {
        const lockoutTime = new Date(Date.now() + 15 * 60 * 1000); // 15 ደቂቃ ይዘጋል

        await this.prisma.user.update({
          where: { id: user.id },
          data: { loginAttempts: attempts, lockoutUntil: lockoutTime },
        });
        throw new ForbiddenException(
          'Account locked due to 5 consecutive failed login attempts. Please try again after 15 minutes or use "Forgot Password" to reset.',
        );
      } else {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { loginAttempts: attempts },
        });
        const remaining = 5 - attempts;
        throw new UnauthorizedException(
          `Invalid password. Account will be locked after 5 failed attempts (${remaining} attempt${remaining === 1 ? '' : 's'} remaining).`,
        );
      }
    }

    // 5. ሎጊን ስኬታማ ከሆነ ሙከራዎችን ማጽዳት (Reset attempts on successful login)
    if (user.loginAttempts > 0 || user.lockoutUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: 0, lockoutUntil: null },
      });
    }

    const { passwordHash, loginAttempts, lockoutUntil, ...result } = user;
    return result;
  }

  async login(credentials: any) {
    let user = credentials;
    if (credentials.password) {
      user = await this.validateUser(credentials.email, credentials.password);
    }
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async register(dto: RegisterDto) {
    assertStrongPassword(dto.password);

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const allowedRoles: Role[] = [Role.PARENT, Role.STUDENT];
    const assignedRole = dto.role && allowedRoles.includes(dto.role) ? dto.role : Role.PARENT;

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase().trim(),
          passwordHash,
          fullName: dto.fullName,
          phone: dto.phone,
          role: assignedRole,
          isActive: true,
          loginAttempts: 0,
        },
      });

      if (assignedRole === Role.PARENT) {
        await tx.parent.create({
          data: { userId: user.id },
        });
      }

      const payload = { email: user.email, sub: user.id, role: user.role };
      return {
        message: 'Account registered successfully',
        token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      };
    });
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('No account found with this email address.');
    }

    // 6-digit secure verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    this.resetCodes.set(email, { code, expiresAt });

    return {
      message: 'Password reset verification code generated. Valid for 15 minutes.',
      email,
      code,
      expiresInMinutes: 15,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    assertStrongPassword(dto.newPassword);
    const email = dto.email.toLowerCase().trim();

    const stored = this.resetCodes.get(email);
    if (!stored) {
      throw new BadRequestException('No password reset request found for this email. Please request a new code.');
    }

    if (new Date() > stored.expiresAt) {
      this.resetCodes.delete(email);
      throw new BadRequestException('Reset code has expired. Please request a new code.');
    }

    if (stored.code !== dto.code.trim()) {
      throw new BadRequestException('Invalid verification code.');
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    // Update password AND immediately clear any lockout and failed login attempts!
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        loginAttempts: 0,
        lockoutUntil: null,
      },
    });

    this.resetCodes.delete(email);

    return {
      message: 'Password has been reset successfully. Account lockout cleared. You can now log in.',
    };
  }
}
