import io from "socket.io-client";

const socket = io("http://localhost:3000");

// For Student:
socket.emit("join_student", "StudentName");

// For Teacher:
socket.emit("create_poll", {
  question: "Favorite color?",
  options: ["Red", "Blue", "Green"],
});

// Listening for events:
socket.on("new_poll", (poll) => {
  console.log("New Poll:", poll);
});

socket.on("poll_results", (results) => {
  console.log("Current Poll Results:", results);
});

socket.on("poll_closed", (message) => {
  console.log(message);
});
