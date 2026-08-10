import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GoogleLoginDto } from './google-login.dto';
import { LoginDto } from './login.dto';
import { RefreshTokenDto } from './refresh-token.dto';
import { RegisterDto } from './register.dto';
import { UpdateProfileDto } from './update-profile.dto';

const validationOptions = { whitelist: true, forbidNonWhitelisted: true };

async function isValid(type: new () => object, value: object) {
  return (
    (await validate(plainToInstance(type, value), validationOptions)).length ===
    0
  );
}

describe('auth DTOs', () => {
  it('accepts valid login and registration payloads', async () => {
    await expect(
      isValid(LoginDto, { email: 'user@example.com', password: 'password' }),
    ).resolves.toBe(true);
    await expect(
      isValid(RegisterDto, {
        email: 'user@example.com',
        password: 'password1',
        name: 'Ownlish User',
      }),
    ).resolves.toBe(true);
  });

  it('rejects invalid credentials and registration boundaries', async () => {
    await expect(
      isValid(LoginDto, { email: 'invalid', password: 1 }),
    ).resolves.toBe(false);
    await expect(
      isValid(RegisterDto, { email: 'user@example.com', password: 'short' }),
    ).resolves.toBe(false);
    await expect(
      isValid(RegisterDto, {
        email: 'user@example.com',
        password: 'a'.repeat(129),
      }),
    ).resolves.toBe(false);
  });

  it('validates Google code, refresh token, and profile payloads', async () => {
    await expect(
      isValid(GoogleLoginDto, { code: 'authorization-code' }),
    ).resolves.toBe(true);
    await expect(isValid(GoogleLoginDto, { code: '' })).resolves.toBe(false);
    await expect(isValid(RefreshTokenDto, {})).resolves.toBe(true);
    await expect(
      isValid(RefreshTokenDto, { refreshToken: 'a'.repeat(513) }),
    ).resolves.toBe(false);
    await expect(isValid(UpdateProfileDto, { name: 'New name' })).resolves.toBe(
      true,
    );
    await expect(isValid(UpdateProfileDto, { name: '' })).resolves.toBe(false);
  });
});
