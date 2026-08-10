import { PrismaService } from './prisma.service';

describe('PrismaService lifecycle', () => {
  it('connects when the Nest module starts', async () => {
    const connect = jest.fn().mockResolvedValue(undefined);
    const service = Object.assign(Object.create(PrismaService.prototype), {
      $connect: connect,
    }) as PrismaService;

    await service.onModuleInit();

    expect(connect).toHaveBeenCalledTimes(1);
  });

  it('disconnects when the Nest module stops', async () => {
    const disconnect = jest.fn().mockResolvedValue(undefined);
    const service = Object.assign(Object.create(PrismaService.prototype), {
      $disconnect: disconnect,
    }) as PrismaService;

    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
