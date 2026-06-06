import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthRequest, JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const jwtServiceMock = {
    verifyAsync: jest.fn(),
  };

  const createContext = (request: Partial<AuthRequest>): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as ExecutionContext;

  let guard: JwtAuthGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new JwtAuthGuard(jwtServiceMock as unknown as JwtService);
  });

  it('throws unauthorized when authorization header is missing', async () => {
    const context = createContext({ headers: {} });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('throws unauthorized when token is invalid', async () => {
    jwtServiceMock.verifyAsync.mockRejectedValue(new Error('invalid token'));

    const context = createContext({
      headers: {
        authorization: 'Bearer invalid-token',
      },
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('sets request user when token is valid', async () => {
    jwtServiceMock.verifyAsync.mockResolvedValue({
      sub: 'user-id',
      email: 'test@example.com',
    });

    const request = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    } as Partial<AuthRequest>;
    const context = createContext(request);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(jwtServiceMock.verifyAsync).toHaveBeenCalledWith('valid-token');
    expect(request.user).toEqual({
      id: 'user-id',
      email: 'test@example.com',
    });
  });
});
