const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const requestIp = require('request-ip');

app.use(cors());
app.use(requestIp.mw());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Initialize an empty list to store banned IP addresses
const bannedIPs = [];

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);
  const ipAddress = socket.handshake.headers['x-real-ip'] || socket.handshake.address; // get the client's IP address
  console.log(`New client connected with IP address: ${ipAddress}`);

  socket.on("join_room", (data) => {
    socket.join(data);
    console.log(`User with ID: ${socket.id} joined room: ${data}`);
  });

  socket.on("send_message", (data) => {
    // Check if the message contains a hate word
    const hateWords = ["hate", "racism", "discrimination"]; // Example list of hate words
    const containsHateWord = hateWords.some((word) => data.message.includes(word));

    if (containsHateWord) {
      // If the message contains a hate word, ban the user by their IP address
      if (!bannedIPs.includes(ipAddress)) {
        bannedIPs.push(ipAddress);
        console.log(`User with IP address ${ipAddress} has been banned`);
        socket.emit("hate_word_detected", "Hate word detected. You have been banned.");
      }
      return; // Don't send the message to other users
    }

    // If the message doesn't contain a hate word, send it to other users
    socket.to(data.room).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

server.listen(3001, () => {
  console.log("SERVER RUNNING");
});
