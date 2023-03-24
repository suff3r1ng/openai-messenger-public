const fs = require("fs");
const login = require("fb-chat-api");

const loginCred = {
  appState: JSON.parse(fs.readFileSync("session.json", "utf-8")),
};

let running = false;
let stopListener = null;

function startListener(api, event) {
  try {
    if (running) {
      api.sendMessage(`Already running!`, event.threadID, event.messageID);
      return;
    }

    running = true;

    const startMess = api.sendMessage(
      "   'COMMANDS'  ```\n\n\n 👉/forecast 'iNPUT CITY NAME'- show weather forecast 🌦️. \n\n 👉/weather 'INPUT CITY NAME'- show current weather🌦️. \n\n 👉/img 'ANY COMMANDS eg. image of a pug'- Generate an image. \n\n 👉/ai 'YOUR QUESTION'- Ask the AI🤖 CHATGPT. \n\n 👉/stop - Stop🤖🚫. \n\n 👉/continue - continue the ai🤖.\n\n👉/mp3- request mp3🎶.\n\n👉/imgSearch- search image from Google.\n\n👉/define- defines a word and states how to pronounce. \n \n\nChangelogs: \n\n👉/ai -> message history reduced to 5 to reduce error message. \n \n👉message-reply-> supported  \n\n Added: \n👉/define, /imgSearch \n\n\n Notes: If error occured using /ai- chat a couple of emojis this is due to max_api token request. Thank You! ``",
      event.threadID,
      event.messageID
    );

    stopListener = api.listenMqtt((err, event) => {
      if (!running) {
        return;
      }

      if (err) {
        console.log("listenMqtt error", err);
        start();
        return;
      }

      api.markAsRead(event.threadID, (err) => {
        if (err) {
          console.error(err);
          return;
        }
      });

      if (event.type == "message_reply" || event.type == "message") {
        try {
          if (event.body.includes("/define")) {
            event.body = event.body.replace("/define", "");
            require("./functions/define.js")(api, event);
          }
          if (event.body.includes("/imgSearch")) {
            event.body = event.body.replace("/imgSearch", "");
            require("./functions/imageSearch.js")(api, event);
          }
          //reaction triggers
          if (event.body.includes("ayie")) {
            api.setMessageReaction(":love:", event.messageID, (err) => {
              if (err) {
                console.error(err);
                return;
              }
            });
          }
          if (
            event.body.includes("haha") ||
            event.body.includes("yawa") ||
            event.body.includes("tanga") ||
            event.body.includes("gago")
          ) {
            api.setMessageReaction(":laughing:", event.messageID, (err) => {
              if (err) {
                console.error(err);
                return;
              }
            });
          }
          //summoning ai
          if (event.body.includes("/ai")) {
            event.body = event.body.replace("/ai", "");

            require("./functions/handler.js")(api, event, (err, data) => {
              console.log(err);
              console.log(data);
              if (err) {
                api.sendMessage(
                  `Error: ${err}`,
                  event.threadID,
                  event.messageID
                );
                return;
              }
            });
          }
          //generate image
          if (event.body.includes("/img")) {
            event.body = event.body.replace("/img", "");
            require("./functions/imghandler")(api, event);
          }
          //mp3
          if (event.body.includes("/mp3") || event.body.includes("/mp4")) {
            event.body = event.body.replace("/mp3", "");
            require("./functions/mp3.js")(api, event);
          }
          if (event.body.includes("/forecast")) {
            event.body = event.body.replace("/forecast", "");
            require("./functions/forecast.js")(api, event);
          }
          if (event.body.includes("/weather")) {
            event.body = event.body.replace("/weather", "");
            require("./functions/weather.js")(api, event);
          }
          if (event.body === "/help") {
            startMess;
          }
          if (event.body.includes("/img")) {
            event.body = event.body.replace("img", "");
            require("./functions/imghandler")(api, event);
          }
        } catch (error) {
          console.log(error);
        }
      }
    });
  } catch (error) {
    console.error(error);
    api.sendMessage("Error: " + error.message, event.threadID, event.messageID);
  }
}

function stopListenerFunc(api, event) {
  if (!running) {
    api.sendMessage(
      `Not running!`,
      event ? event.threadID : null,
      event ? event.messageID : null
    );
    return;
  }
  running = false;
  api.sendMessage(`Okay 😢`, event.threadID);
  let count = 3;
  const countdown = setInterval(() => {
    api.sendMessage(`Stopping in ${count} seconds...`, event.threadID);
    count--;
    if (count === 0) {
      clearInterval(countdown);
      stopListener();
    }
  }, 1000);
}
function start() {
  login(loginCred, (err, api) => {
    if (err) {
      console.error("login cred error", err);
      return;
    }

    api.listen((err, event) => {
      try {
        if (err) {
          console.error("listen error:", err);
          start();
          return;
        }
      } catch (err) {
        console.err(err);
      }

      const actions = {
        "/accept": (api, event) => {
          accept(api, event);
        },
        "/start": startListener,
        "/pause": () => {
          running = false;
          api.sendMessage(`Paused!`, event.threadID, event.messageID);
        },
        "/continue": () => {
          running = true;
          api.sendMessage(`Continuing!`, event.threadID, event.messageID);
        },
        "/stop": stopListenerFunc,
      };
      const action = actions[event.body];
      if (action) {
        action(api, event);
      }
    });
  });
}
function accept(api, event) {
  try {
    api.getThreadList(5, null, ["ARCHIVED"], (err, list) => {
      if (err) {
        console.log(err);
        return;
      }
      list.forEach((thread) => {
        if (thread.isGroup) {
          api.handleMessageRequest(event.threadID, true, (err) => {
            if (err) {
              console.log(err);
              return;
            }
            api.sendMessage(
              "Bot is now online",
              event.threadID,
              event.messageID
            );
            console.log(
              `Accepted message request for thread ${
                (event.threadID, event.messageID)
              }`
            );
          });
        }
      });
    });
  } catch (error) {
    console.log(error);
  }
} //start();1Q  `
start();
module.exports = { stopListener };
