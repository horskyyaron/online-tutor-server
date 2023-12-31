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
  },
});

const session = {
  tutorSocketId: "",
  studentSocketId: "",
  challenge_id: "",
};

app.get("/", (req, res) => {
  res.send("hello world");
});

app.get("/status", (req, res) => {
  console.log(session);
  res.send({ session: session });
});

io.on("connection", (socket) => {
  console.log(`new connection! ${socket.id}`);
  cleanup();

  // tracks tutror/studnet with the manager object.
  if (io.engine.clientsCount == 1) {
    socket.emit("handshake", { role: "tutor" });
    session.tutorSocketId = socket.id;
    console.log(session);
  } else {
    if (session.tutorSocketId) {
      socket.emit("handshake", { role: "student" });
      session.studentSocketId = socket.id;
      console.log("student connected", session);
    } else {
      // student is connected but tutor got disconnected. reconnect tutor.
      socket.emit("handshake", { role: "tutor" });
      session.tutorSocketId = socket.id;
      console.log(session);
    }
  }

  socket.on("challenge", (challenge_id) => {
    session.challenge_id = challenge_id;
    console.log(session);
  });

  socket.on("text change", (text) => {
    socket.broadcast.emit("text change", { updatedText: text });
  });

  socket.on("disconnect", () => {
    if (session.studentSocketId == socket.id) {
      session.studentSocketId = "";
    } else {
      session.tutorSocketId = "";
    }
    console.log(`socket: ${socket.id} disconnected!`);
    cleanup();
    console.log(session);
  });
});

function cleanup() {
  if (
    session.challenge_id != "" &&
    session.tutorSocketId == "" &&
    session.studentSocketId == ""
  ) {
    session.challenge_id = "";
  }
}

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
