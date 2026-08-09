import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { env } from '../config/env';
import { GoogleTokenService } from './google-token.service';

const mockVerifyIdToken = jest.fn();
const mockGetToken = jest.fn();

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    getToken: mockGetToken,
    verifyIdToken: mockVerifyIdToken,
  })),
}));

describe('GoogleTokenService', () => {
  let service: GoogleTokenService;
  const originalGoogleClientId = env.googleClientId;
  const originalGoogleClientSecret = env.googleClientSecret;
  const originalGoogleRedirectUri = env.googleRedirectUri;

  beforeEach(async () => {
    jest.clearAllMocks();
    env.googleClientId = 'google-client-id';
    env.googleClientSecret = 'google-client-secret';
    env.googleRedirectUri = 'http://localhost:3000';

    const module: TestingModule = await Test.createTestingModule({
      providers: [GoogleTokenService],
    }).compile();

    service = module.get<GoogleTokenService>(GoogleTokenService);
  });

  afterEach(() => {
    env.googleClientId = originalGoogleClientId;
    env.googleClientSecret = originalGoogleClientSecret;
    env.googleRedirectUri = originalGoogleRedirectUri;
  });

  it('exchanges an authorization code before verifying Google claims', async () => {
    mockGetToken.mockResolvedValue({
      tokens: {
        id_token: 'id-token',
      },
    });
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-sub',
        email: 'User@Example.com',
        email_verified: true,
        name: ' Google User ',
        picture: ' https://lh3.googleusercontent.com/avatar ',
      }),
    });

    await expect(
      service.verifyAuthorizationCode('authorization-code'),
    ).resolves.toEqual({
      sub: 'google-sub',
      email: 'User@Example.com',
      name: 'Google User',
      avatarUrl: 'https://lh3.googleusercontent.com/avatar',
    });
    expect(mockGetToken).toHaveBeenCalledWith({
      code: 'authorization-code',
      redirect_uri: 'http://localhost:3000',
    });
    expect(mockVerifyIdToken).toHaveBeenCalledWith({
      idToken: 'id-token',
      audience: 'google-client-id',
    });
  });

  it('rejects an authorization code when Google does not return an ID token', async () => {
    mockGetToken.mockResolvedValue({ tokens: {} });

    await expect(
      service.verifyAuthorizationCode('authorization-code'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns verified Google claims', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-sub',
        email: 'User@Example.com',
        email_verified: true,
        name: ' Google User ',
        picture: ' https://lh3.googleusercontent.com/avatar ',
      }),
    });

    await expect(service.verifyIdToken('id-token')).resolves.toEqual({
      sub: 'google-sub',
      email: 'User@Example.com',
      name: 'Google User',
      avatarUrl: 'https://lh3.googleusercontent.com/avatar',
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
