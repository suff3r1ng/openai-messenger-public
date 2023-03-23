const google = require("googlethis");
const cloudscraper = require("cloudscraper");
const fs = require("fs");

const openSettings = () => {
  return JSON.parse(
    fs.readFileSync(configs.APP_SETTINGS_LIST_FILE, { encoding: "utf8" })
  );
};

const imageSearch = async (api, event) => {
  let query = event.body;
  if (!query) {
    let stopTyping = api.sendTypingIndicator(event.threadID, (err) => {
      if (err) return console.log(err);

      api.sendMessage(
        "⚠️ Please enter your query.",
        event.threadID,
        event.messageID
      );
      stopTyping();
    });

    return;
  } else {
    api.sendMessage("🔎 Searching image...", event.threadID, event.messageID);
  }

  let result = await google.image(query, { safe: false });
  if (result.length === 0) {
    api.sendMessage(
      `⚠️ Your image search did not return any result.`,
      event.threadID,
      event.messageID
    );
    return;
  }

  let streams = [];
  let counter = 0;

  for (let image of result) {
    // Only show 6 images
    if (counter >= 6) break;

    // Ignore urls that does not ends with .jpg or .png
    let url = image.url;
    if (!url.endsWith(".jpg") && !url.endsWith(".png")) continue;

    let path = `./temp/search-image-${counter}.jpg`;
    let hasError = false;
    await cloudscraper
      .get({ uri: url, encoding: null })
      .then((buffer) => fs.writeFileSync(path, buffer))
      .catch((error) => {
        console.log(error);
        hasError = true;
      });

    if (hasError) continue;

    streams.push(
      fs.createReadStream(path).on("end", async () => {
        if (fs.existsSync(path)) {
          fs.unlink(path, (err) => {
            if (err) return console.log(err);
          });
        }
      })
    );

    counter += 1;
  }

  api.sendMessage(
    "⏳ Sending search result...",
    event.threadID,
    event.messageID
  );

  let msg = {
    body: `--------------------\nImage Search Result\n\nFound: ${
      result.length
    } image${
      result.length > 1 ? "s" : ""
    }\nOnly showing: 6 images\n\n--------------------`,
    attachment: streams,
  };

  api.sendMessage(msg, event.threadID, event.messageID);
};

module.exports = async (api, event) => {
  await imageSearch(api, event);
};
