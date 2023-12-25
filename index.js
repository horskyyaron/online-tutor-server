import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV == "production"
        ? process.env.ORIGIN
        : "http://localhost:*",
    // methods: ["GET", "POST"],
  },
});

function getNumOfConnClients() {
  return io.sockets.sockets.size;
}

app.get("/", (req, res) => {
  res.send("hello world");
});

function listAllClients() {
  io.sockets.sockets.forEach((socket) => {
    const clientId = socket.id;
    const clientIP = socket.handshake.address;
    console.log(`Client ID: ${clientId}, IP: ${clientIP}`);
  });
}

io.on("connection", (socket) => {
  console.log(`new connection! ${socket.id}`);

  if (getNumOfConnClients() == 1) {
    socket.emit("handshake", { role: "tutor" });
  } else {
    socket.emit("handshake", { role: "student" });
  }

  socket.on("text change", (text) => {
    socket.broadcast.emit("text change", { updatedText: text });
  });

  socket.on("disconnect", () => {
    console.log("client disconnected");
  });
});

const env = process.env.NODE_ENV;

server.listen(4000, () => {
  if (env == "production") {
    console.log(
      "server running at production mode, origin: https://horskyyaron.com",
    );
  } else {
    console.log(
      "server running at development mode, origin: http://localhost:*",
    );
  }
});
