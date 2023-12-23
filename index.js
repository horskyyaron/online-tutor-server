import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:*",
  },
});

function getNumOfConnClients() {
  return io.sockets.sockets.size;
}

function listAllClients() {
  io.sockets.sockets.forEach((socket) => {
    const clientId = socket.id;
    const clientIP = socket.handshake.address;
    console.log(`Client ID: ${clientId}, IP: ${clientIP}`);
  });
}

io.on("connection", (socket) => {
  console.log(`new connection! ${socket.id}`);

  const role = getNumOfConnClients() === 1 ? "student" : "tutor";
  if (role === "student") {
    socket.emit("handshake", { role: "student" });
  } else {
    socket.emit("handshake", { role: "tutor" });
  }

  socket.on("text change", (text) => {
    socket.broadcast.emit("text change", { updatedText: text });
    console.log(text);
  });

  socket.on("disconnect", () => {
    console.log("client disconnected");
  });
});

server.listen(4000, () => {
  console.log("server running at http://localhost:4000");
});
