const axios = require("axios");
const customCreds = require("./customCreds.json");
const client = require("twilio")(
  customCreds.twilioSID,
  customCreds.twilioToken
);

client.messages
  .create({
    body: "Hello from twilio-node",
    to: "+16176945102", // Text this number
    from: "+18443292805", // From a valid Twilio number
  })
  .then((message) => console.log(message.sid));
// const getWeather = async (recipients) => {
//   const result = [];
//   let weatherResponse;
//   for (const person of recipients) {
//     weatherResponse = await axios.get(
//       `http://api.weatherapi.com/v1/forecast.json?key=e9d32b93bb95433d9cd232000231802&q=${person.zipcode}&days=1`
//     );
//     const snowChance =
//       weatherResponse.data.forecast.forecastday[0].day.daily_chance_of_snow;
//     person.snowChance = snowChance;
//     result.push(person);
//   }
//   console.log(result);
// };
// const recipients = [{ name: "tommy", number: "4803585269", zipcode: "80211" }];
// getWeather(recipients);

// make message function

// send message function
