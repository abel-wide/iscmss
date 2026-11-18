// backend/src/auth/dto/register.dto.ts
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  // 👇 የይለፍ ቃል ጥንካሬ ህግ (Strong Password Policy)
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password is too weak. It must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.',
  })
  password: string;
}