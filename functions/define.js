const google = require("googlethis");
const streams = require("stream");
const axios = require("axios");
const fs = require("fs");

const define = async (word) => {
  let options = {
    page: 0,
    safe: false,
    additional_params: {
      hl: "en",
    },
  };

  return await google.search(`define ${word}`, options);
};

const bufferToReadable = (buffer) => {
  let readable = new streams.Readable({ read() {} });
  readable.push(buffer);
  readable.push(null);

  return readable;
};

const download = async (url) => {
  let path = `./temp/attachment-enunciation.mp3`;

  let response = await axios.get(url, { responseType: "arraybuffer" });
  let data = null;

  if (response.status === 200) data = response.data;
  else return console.log(response);

  let readStream = bufferToReadable(Buffer.from(data, "utf-8"));
  let writeStream = fs.createWriteStream(path);
  readStream.pipe(writeStream);

  writeStream.on("finish", () => {
    writeStream.end();
    readStream.destroy();
  });

  return path;
};

module.exports = async (api, event) => {
  let word = event.body;

  if (!word) {
    let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
      if (err) return console.log(err);

      api.sendMessage(
        `⚠️ Invalid usage of command: Please enter a word to define`,
        event.threadID,
        event.messageID
      );
      stopTyping();
    });

    return;
  }

  if (word === undefined) {
    let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
      if (err) return console.log(err);

      api.sendMessage(
        `⚠️ Invalid usage of command: ${settings.prefix}define\n\nUsage: ${extra.usage}`,
        event.threadID,
        event.messageID
      );
      stopTyping();
    });

    return;
  }

  let response = await define(word);
  let dictionary = response.dictionary;

  if (dictionary === undefined || Object.entries(dictionary).length === 0) {
    let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
      if (err) return console.log(err);

      api.sendMessage(
        `⚠️ Cannot find the definition of the word: '${word}'`,
        event.threadID,
        event.messageID
      );
      stopTyping();
    });

    return;
  }

  let definitions =
    dictionary.definitions.length === 0 ? "*No definition provided*" : "";
  let examples =
    dictionary.examples.length === 0 ? "*No examples provided*" : "";

  for (let i = 0; i < dictionary.definitions.length; i++)
    definitions += `${i + 1}. ${dictionary.definitions[i]}\n`;

  for (let i = 0; i < dictionary.examples.length; i++)
    examples += `${i + 1}. ${dictionary.examples[i]}\n`;

  let msg = `📔 Google Dictionary\n\n`;
  msg += `• Word: ${dictionary.word}\n\n`;
  msg += `• Phonetic: ${dictionary.phonetic}\n\n`;
  msg += `• Definitions: \n\n${definitions}\n`;
  msg += `• Examples: \n\n${examples}\n`;
  let body = { body: msg };

  if (dictionary.audio !== undefined) {
    let path = await download(dictionary.audio);

    body.attachment = fs.createReadStream(path).on("end", async () => {
      if (fs.existsSync(path)) {
        fs.unlink(path, (err) => {
          if (err) return console.log(err);
        });
      }
    });
  }

  let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
    if (err) return console.log(err);

    api.sendMessage(body, event.threadID, event.messageID);
    stopTyping();
  });
};
