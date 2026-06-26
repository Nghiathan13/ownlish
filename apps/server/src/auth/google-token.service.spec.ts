import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { env } from '../config/env';
import { GoogleTokenService } from './google-token.service';

const mockVerifyIdToken = jest.fn();

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

describe('GoogleTokenService', () => {
  let service: GoogleTokenService;
  const originalGoogleClientId = env.googleClientId;

  beforeEach(async () => {
    jest.clearAllMocks();
    env.googleClientId = 'google-client-id';

    const module: TestingModule = await Test.createTestingModule({
      providers: [GoogleTokenService],
    }).compile();

    service = module.get<GoogleTokenService>(GoogleTokenService);
  });

  afterEach(() => {
    env.googleClientId = originalGoogleClientId;
  });

  it('returns verified Google claims', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-sub',
        email: 'User@Example.com',
        email_verified: true,
        name: ' Google User ',
      }),
    });

    await expect(service.verifyIdToken('id-token')).resolves.toEqual({
      sub: 'google-sub',
      email: 'User@Example.com',
      name: 'Google User',
    });
  });

  it('rejects unverified Google email', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-sub',
        email: 'user@example.com',
        email_verified: false,
      }),
    });

    await expect(service.verifyIdToken('id-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects invalid Google token', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('invalid'));

    await expect(service.verifyIdToken('id-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
