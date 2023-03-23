// import dependencies
const { Configuration, OpenAIApi } = require("openai");
const fs = require("fs");
const path = require("path");

const filepath = path.join(__dirname, "..", "api_key.json");
if (fs.existsSync(filepath)) {
  const apikey = JSON.parse(fs.readFileSync(filepath));
} else {
  console.log(`Unable to locate ${filepath}`);
}
// read API key from config file
const apikey = JSON.parse(fs.readFileSync(filepath, "utf8"));

// configure OpenAI API
const configuration = new Configuration({
  apiKey: apikey.openai,
  username: apikey.username,
});
const openai = new OpenAIApi(configuration);

async function loadNextThreadHistory(api, event, chatHistory, timestamp) {
  const messagesPerPage = 50;
  const maxMessages = 5;

  let messagesLeftToCollect = maxMessages - chatHistory.length;

  while (messagesLeftToCollect > 0) {
    const pageSize = Math.min(messagesPerPage, messagesLeftToCollect);

    const history = await api.getThreadHistory(
      event.threadID,
      pageSize,
      timestamp
    );

    if (history.length === 0) {
      break;
    }

    const filteredHistory = history.filter(
      (message) => message.type === "message"
    );
    chatHistory.push(...filteredHistory);

    timestamp = filteredHistory[filteredHistory.length - 1].timestamp;

    messagesLeftToCollect -= filteredHistory.length;
  }

  return chatHistory; // return the chatHistory array after it has been modified
}
// export function
module.exports = async (api, event) => {
  try {
    if (!event.body) {
      let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
        if (err) return console.log(err);

        api.sendMessage(
          "⚠️ Please enter your prompt.",
          event.threadID,
          event.messageID
        );
        stopTyping();
      });

      return;
    }
    // Initialize an empty chatHistory array
    const chatHistory = [];

    // Call loadNextThreadHistory function to retrieve chat history messages and get the modified chatHistory array
    const modifiedChatHistory = await loadNextThreadHistory(
      api,
      event,
      chatHistory
    );
    // const message = (modifiedChatHistory) => {
    //   const now = new Date();
    //   const timestamp = `${
    //     now.getMonth() + 1
    //   }-${now.getDate()}-${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
    //   const logMessage = `[${timestamp}] ${modifiedChatHistory.map}\n`;
    // };

    const threadInfo = await api.getThreadInfo(event.threadID);
    const assistant = threadInfo.userInfo.find(
      (p) =>
        p.id === threadInfo.participantIDs[threadInfo.participantIDs.length - 1]
    );
    const sender = threadInfo.userInfo.find((p) => p.id === event.senderID);
    const senderIDs = threadInfo.participantIDs.slice(0, -1);
    const senderName = sender.firstName;
    const assName = assistant.firstName;
    const historyMessages = modifiedChatHistory.map((message) => {
      let role =
        message.senderID === `${assistant.id}`
          ? "assistant"
          : message.senderID === `${senderIDs}`
          ? "user"
          : "user";
      const stringToReplace = message.body.replace(
        /^\/ai$|^''COMMANDS'[\s\S]*$|^\/help$|^\/mp3$/,
        ""
      );
      return {
        role: role,
        content: stringToReplace,
      };
    });

    // Log the historyMessages array
    api.sendTypingIndicator(event.threadID);
    // get response from OpenAI API
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo-0301",
      max_tokens: 400,
      messages: [...historyMessages, { role: "user", content: event.body }],
    });

    // get thread info from Facebook Messenger API
    api.getThreadInfo(event.threadID, (err, info) => {
      if (err) {
        console.error(err);
        return;
      }
      api.sendTypingIndicator(event.threadID);
      // get sender info
      const sender = info.userInfo.find((p) => p.id === event.senderID);
      const senderName = sender.firstName;
      const senderBday = sender.isBirthday;

      // send message based on sender info and OpenAI response
      if (senderBday) {
        api.sendMessage(
          {
            body: `Happy Birthday @${senderName}!`,
            mentions: [{ tag: `@${senderName}`, id: event.senderID }],
          },
          event.threadID
        );
      } else {
        api.sendTypingIndicator(event.threadID);
        api.sendMessage(
          {
            body: `Hi @${senderName}! ${response.data.choices[0].message.content} \n \n About this bot, type:\n👉/help for more info`,
            mentions: [{ tag: `@${senderName}`, id: event.senderID }],
          },
          event.threadID,
          event.messageID
        );
      }
    });
  } catch (error) {
    api.getThreadInfo(event.threadID, (err, info) => {
      if (err) {
        console.error(err);
        return;
      }

      // get sender info
      const sender = info.userInfo.find((p) => p.id === event.senderID);
      const senderName = sender.firstName;
      if (error.message.includes("Request failed with status code 400")) {
        api.sendMessage(
          {
            body: `Hi @${senderName}! Error too many request or your request is too long. Please try again.`,
            mentions: [{ tag: `@${senderName}`, id: event.senderID }],
          },
          event.threadID,
          event.messageID
        );
      }
    });
  }
};
