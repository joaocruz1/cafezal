const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(express.json());

const http = createServer(app);
const io = new Server(http, {
  cors: {
    origin: "*",
  },
});

app.post("/emit", (req, res) => {
  const { event, data } = req.body || {};
  if (event && data !== undefined) {
    io.emit(event, data);
  }
  res.status(204).end();
});

io.on("connection", (socket) => {
  console.log("[Socket.io] Cliente conectado:", socket.id);
  socket.on("disconnect", () => {
    console.log("[Socket.io] Cliente desconectado:", socket.id);
  });
});

const PORT = process.env.SOCKET_PORT || 3001;
http.listen(PORT, () => {
  console.log(`Socket.io rodando na porta ${PORT}`);
});
