import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server);

let firstUserConnected = false;

app.get("/", (req, res) => {
  res.send("<h1>Hello world</h1>");
});

io.on("connection", (socket) => {
  socket.data.role = firstUserConnected ? "Student" : "Tutor";
  firstUserConnected = true;
  socket.data.ip = socket.handshake.address;
  console.log(socket.data);
  console.log("number of connections: " + io.engine.clientsCount);
  socket.on("disconnect", () => {
    console.log(`${socket.role} disconneted`);
    console.log(`${io.engine.clientsCount} clients remain`);
  });
});

server.listen(4000, () => {
  console.log("server running at http://localhost:4000");
});
