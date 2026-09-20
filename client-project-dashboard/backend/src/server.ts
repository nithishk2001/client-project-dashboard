import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app";
import { setupWebSocket } from "./websocket/wsServer";
import { startOverdueJob } from "./jobs/overdueJob";

const PORT = process.env.PORT || 5000;

// We create a plain http server and attach both Express and the
// WebSocket server to it, so they share the same port.
const server = http.createServer(app);

setupWebSocket(server);
startOverdueJob();

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
});
