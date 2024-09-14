const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

// Create an Express app
const app = express();
app.use(express.json()); // To parse JSON request bodies
const server = http.createServer(app);

// Initialize Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "*", // Allow any domain to connect (you can restrict it later)
    methods: ["GET", "POST"],
  },
});

// A simple route for testing the server
app.get("/", (req, res) => {
  res.send("Live Polling System Backend");
});

// Placeholder for storing poll data
let activePoll = null;
let pollResponses = [];
let totalStudents = 0; // To track the total students connected

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Handle student joining
  socket.on("join_student", (studentName) => {
    console.log(`${studentName} joined`);
    totalStudents++;
    socket.studentName = studentName;
  });

  // Teacher creates a new poll
  socket.on("create_poll", (pollData) => {
    if (!activePoll) {
      activePoll = pollData;
      pollResponses = [];
      console.log("New Poll Created:", pollData);

      // Broadcast the poll to all students
      io.emit("new_poll", activePoll);
    } else {
      socket.emit("error", "A poll is already active.");
    }
  });

  // Student submits an answer
  socket.on("submit_answer", (answerData) => {
    if (activePoll) {
      pollResponses.push(answerData);
      console.log(`Received answer from ${socket.studentName}:`, answerData);

      // Broadcast current poll results
      io.emit("poll_results", calculatePollResults());

      // If all students have answered, close the poll
      if (pollResponses.length === totalStudents) {
        closePoll();
      }
    } else {
      socket.emit("error", "No active poll to answer.");
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.studentName || socket.id);
    totalStudents = Math.max(totalStudents - 1, 0); // Decrease totalStudents on disconnect
  });
});

// Helper function to calculate poll results
function calculatePollResults() {
  if (!activePoll || pollResponses.length === 0)
    return { poll: activePoll, results: {} };

  // Calculate the count of each answer
  const result = pollResponses.reduce((acc, answer) => {
    acc[answer] = (acc[answer] || 0) + 1;
    return acc;
  }, {});

  // Calculate percentages based on total responses
  const resultsWithPercentages = {};
  const totalResponses = pollResponses.length;

  for (const [option, count] of Object.entries(result)) {
    resultsWithPercentages[option] = {
      count,
      percentage: ((count / totalResponses) * 100).toFixed(2) + "%", // Calculate percentage
    };
  }
  console.log(activePoll, resultsWithPercentages);
  return { poll: activePoll, results: resultsWithPercentages };
}

// Close the poll when all students have answered
function closePoll() {
  console.log("Poll closed:", activePoll);
  activePoll = null;
  io.emit("poll_closed", "Poll is closed. You can view results.");
}

// Start the server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
