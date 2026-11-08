import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import type { SignOptions } from 'jsonwebtoken'; // ይህን አስገባ

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { 
          // እዚህ ጋር የተከሰተውን የችግር አይነት ለማስተካከል 'as SignOptions["expiresIn"]' በመጠቀም ቀይረው
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') || '7d') as SignOptions['expiresIn'] 
        },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}