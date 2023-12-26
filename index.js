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

const manager = {
  tutorSocketId: "",
  studentSocketId: "",
  challenge_id: "",
};

io.on("connection", (socket) => {
  console.log(`new connection! ${socket.id}`);

  // tracks tutror/studnet with the manager object.
  if (io.engine.clientsCount == 1) {
    socket.emit("handshake", { role: "tutor" });
    manager.tutorSocketId = socket.id;
    console.log(manager);
  } else {
    if (manager.tutorSocketId) {
      socket.emit("handshake", { role: "student" });
      manager.studentSocketId = socket.id;
      console.log("student connected", manager);
    } else {
      // student is connected but tutor got disconnected. reconnect tutor.
      socket.emit("handshake", { role: "tutor" });
      manager.tutorSocketId = socket.id;
      console.log(manager);
    }
  }

  socket.on("challenge", (challenge_id) => {
    manager.challenge_id = challenge_id;
  });

  socket.on("text change", (text) => {
    socket.broadcast.emit("text change", { updatedText: text });
  });

  socket.on("disconnect", () => {
    if (manager.studentSocketId == socket.id) {
      manager.studentSocketId = "";
    } else {
      manager.tutorSocketId = "";
    }
    console.log(`socket: ${socket.id} disconnected!`);
    console.log(manager);
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
