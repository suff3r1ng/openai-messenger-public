const { Configuration, OpenAIApi } = require("openai");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const filepath = path.join(__dirname, "..", "api_key.json");
const apikey = JSON.parse(fs.readFileSync(filepath, "utf8"));
const configuration = new Configuration({
  apiKey: apikey.openai,
  username: apikey.username,
});
const openai = new OpenAIApi(configuration);

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
    const response = await openai.createImage({
      prompt: event.body,
      n: 1,
      size: "1024x1024",
    });
    api.sendMessage("Processing image...", event.threadID, (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });

    const imageDataUrl = response.data.data[0].url;
    const { data: imageData } = await axios.get(imageDataUrl, {
      responseType: "stream",
    });

    const uuid = require("uuid").v4();
    const path = `image/${uuid}.png`;

    const writeStream = fs.createWriteStream(path);
    imageData.pipe(writeStream);
    // Save the file to disk
    await new Promise((resolve, reject) => {
      writeStream.on("finish", () => {
        if (fs.existsSync(path)) {
          resolve();
        } else {
          reject();
        }
      });
    });

    // const fileStream = fs.createWriteStream(path);
    // imageData.pipe(fileStream);

    await new Promise((resolve) => {
      const checkExist = setInterval(() => {
        if (fs.existsSync(path)) {
          clearInterval(checkExist);
          resolve();
        }
      }, 1000); // check every 1 second
    });

    api.getThreadInfo(event.threadID, async (err, info) => {
      if (err) {
        console.error(err);
        return;
      }

      const sender = info.userInfo.find((p) => p.id === event.senderID);
      const senderName = sender.firstName;

      const image = fs.createReadStream(path);

      const img = {
        body: `Here's the image ${senderName}`,
        attachment: image,
      };

      await new Promise((resolve) => {
        setTimeout(() => {
          api.sendMessage(img, event.threadID, (err) => {
            if (err) {
              console.error(err);
              api.sendMessage("Error Processing Image.", event.threadID);

              fs.unlink(path, (err) => {
                if (err) {
                  console.error(err);
                  return;
                }
              });
            }
            resolve();
          });
        }, 6000); // add a 6 seconds delay
      });

      fs.unlink(path, (err) => {
        if (err) {
          console.error(err);
          return;
        }
      });
    });
  } catch (error) {
    console.error(error);
    if (error == "Error: Request failed with status code 400") {
      api.sendMessage(
        "Please send an appropriate request of an image you want to generate...",
        event.threadID
      );
    }
  }
};
