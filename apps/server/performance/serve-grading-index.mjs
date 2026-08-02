import { createServer } from 'node:http';

const port = Number(process.env.PERFORMANCE_GRADING_INDEX_PORT ?? 3101);
const index = JSON.stringify({
  schemaVersion: 1,
  tests: Object.fromEntries(
    Array.from({ length: 20 }, (_, index) => {
      const testKey = `ets26-t${String(index + 1).padStart(2, '0')}`;
      return [
        testKey,
        {
          parts: Object.fromEntries(
            Array.from({ length: 7 }, (_, partIndex) => {
              const partNumber = partIndex + 1;
              return [
                String(partNumber),
                {
                  groups: {
                    g001: {
                      [`${testKey}-p${partNumber}-q001`]: 'A',
                    },
                  },
                },
              ];
            }),
          ),
        },
      ];
    }),
  ),
});

const server = createServer((request, response) => {
  if (request.url !== '/grading-index.json') {
    response.writeHead(404).end();
    return;
  }

  response.writeHead(200, { 'Content-Type': 'application/json' }).end(index);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Performance grading index listening on ${port}.`);
});
