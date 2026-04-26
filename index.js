const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");

const app = express();

app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.send("Panel Backend Running 🚀");
});

// Run command route
app.post("/run", (req, res) => {
  const { command } = req.body;

  if (!command) {
    return res.send("No command provided");
  }

  exec(command, (error, stdout, stderr) => {
    if (error) {
      return res.send(error.message);
    }
    res.send(stdout || stderr);
  });
});

// Server start (ALWAYS at bottom)
app.listen(3000, () => {
  console.log("Server running on port 3000");
});