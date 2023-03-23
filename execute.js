const { spawn } = require("child_process");

function startApp() {
  const app = spawn("node", ["index.js"]);

  app.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });

  app.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  app.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
    if (code !== 0) {
      console.log("Error occurred. Restarting...");
      startApp();
    }
  });
}

startApp();
