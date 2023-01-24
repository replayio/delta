import { createHook } from "async_hooks";
import { writeFileSync } from "fs";
import * as pako from "pako";
import { join } from "path";
import { safeStringify } from "./json";

function log(...args) {
  return;
  console.log(...args);
}

let requests = {};

export function setupHook() {
  const hook = createHook({
    init(
      asyncId: number,
      type: string,
      _triggerAsyncId: number,
      resource: any
    ) {
      if ("HTTPCLIENTREQUEST" == type) {
        log(`::: req ${asyncId}`, resource.req.method, resource.req.path);

        requests[asyncId] = {
          request: {
            method: resource.req.method,
            path: resource.req.path,
            headers: resource.req.headers,
          },
        };

        let body: Uint8Array[] = [];

        resource.req.on("response", (res) => {
          res.on("data", (chunk) => {
            body.push(chunk);
          });

          res.on("end", () => {
            const responseBody = Buffer.concat(body);

            log(`::: res ${asyncId}`, res.statusCode);

            try {
              const str = responseBody.toString();
              const json = JSON.parse(str);
              requests[asyncId].response = {
                body: json,
              };
            } catch (e) {
              const data = pako.inflate(responseBody, {
                to: "string",
              });

              requests[asyncId].response = {
                body: data,
              };
            }
          });
        });

        return;
      }
    },
  });
  hook.enable();
}

export const writeRequests = () => {
  const filepath = join(__dirname, "../../../../requests.json");

  writeFileSync(filepath, safeStringify(requests, 2));
};

export function getHTTPRequests() {
  let savedRequests = { ...requests };
  requests = {};
  return savedRequests;
}

// const hook = createHook({
//   init(asyncId, type, triggerAsyncId, resource) {
//     if (type === 'TCPWRAP') {
//       // The resource object represents the socket object for the incoming connection
//       const socket = resource;
//       socket.on('data', (data) => {
//         // Modify the request data here
//         console.log(`Received data: ${data}`);

//         // Send a mock response instead of making the original request
//         const mockResponse = 'HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nMock response';
//         socket.write(mockResponse);
//         socket.end();
//       });
//     }
//   }
// });
