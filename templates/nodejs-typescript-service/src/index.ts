import http from "http";

const port = process.env.PORT || 3000;

const requestHandler = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ status: "ok" }));
  }

  if (req.method === "GET" && req.url === "/ready") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ status: "ready" }));
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  return res.end(JSON.stringify({ error: "Not Found" }));
};

const server = http.createServer(requestHandler);
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
