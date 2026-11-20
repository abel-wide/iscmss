import { BadRequestException } from '@nestjs/common';

export const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]{8,}$/;

export const STRONG_PASSWORD_MESSAGE =
  'Password must be at least 8 characters long, contain at least one uppercase letter (A-Z), one lowercase letter (a-z), one number (0-9), and one special character (e.g. !@#$%^&*).';

export function assertStrongPassword(password: string): void {
  if (!password || !STRONG_PASSWORD_REGEX.test(password)) {
    throw new BadRequestException(STRONG_PASSWORD_MESSAGE);
  }
}
