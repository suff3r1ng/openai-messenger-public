const openweathermap = require("openweathermap-node");

const helper = new openweathermap({
  APPID: "api key here",
  units: "imperial",
  lang: "en",
});

module.exports = async (api, event) => {
  try {
    helper.getThreeHourForecastByCityName(
      `${event.body}`,
      (err, threeHourForecast) => {
        if (err) {
          if (err.status == "404") {
            api.sendMessage(
              "City not found please enter a valid city name.",
              event.threadID
            );
          } else if (err.status == "401") {
            api.sendMessage("Invalid API key.", event.threadID);
          } else if (err.status == "429") {
            api.sendMessage("Too many requests.", event.threadID);
          } else if (err.status == "500") {
            api.sendMessage("Server error.", event.threadID);
          } else if (err.status == "400") {
            api.sendMessage("Please enter city name.", event.threadID);
          }
        } else {
          // {
          //     dt: 1678870800,
          //     main: [Object],
          //     weather: [Array],
          //     clouds: [Object],
          //     wind: [Object],
          //     visibility: 10000,
          //     pop: 0.62,
          //     rain: [Object],
          //     sys: [Object],
          //     dt_txt: '2023-03-15 09:00:00'
          //   },
          let forecasts = "";
          for (let i = 0; i < 10; i++) {
            forecasts += `Data and time: ${threeHourForecast.list[i].dt_txt}\n`;
            forecasts += `Main: ${threeHourForecast.list[i].weather[0].main}\n`;
            forecasts += `Description: ${threeHourForecast.list[i].weather[0].description}\n`;
            forecasts += `Clouds: ${threeHourForecast.list[i].clouds.all}\n\n`;
          }
          api.sendMessage(
            "  \b 'Forecasts  " +
              threeHourForecast.city.name +
              ` for 10 hours.' \n \n` +
              forecasts,
            event.threadID
          );
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};
