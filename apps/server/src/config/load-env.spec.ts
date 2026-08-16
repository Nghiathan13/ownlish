const mockConfig = jest.fn();

jest.mock('dotenv', () => ({ config: mockConfig }));

describe('loadEnvironment', () => {
  beforeEach(() => {
    jest.resetModules();
    mockConfig.mockClear();
  });

  it('loads local configuration before the legacy dotenv file', () => {
    jest.isolateModules(() => {
      const { loadEnvironment } =
        jest.requireActual<typeof import('./load-env')>('./load-env');

      mockConfig.mockClear();
      loadEnvironment();
    });

    expect(mockConfig).toHaveBeenCalledWith({
      path: ['.env.local', '.env'],
      quiet: true,
    });
  });
});
