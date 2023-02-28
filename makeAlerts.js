const { GoogleSpreadsheet } = require("google-spreadsheet");
const axios = require("axios");
const creds = require("./creds.json");
const customCreds = require("./customCreds.json");
const client = require("twilio")(
  customCreds.twilioSID,
  customCreds.twilioToken
);
// wake up
// reference the database and fetch all numbers in the database
// fetch weather api using zip code from database
// send SMS text from Twilio if snow % > 0

const getAllRecipientsFromDB = async () => {
  /* 
  START
  reference the database and fetch all numbers in the database
  */
  const doc = new GoogleSpreadsheet(customCreds.googleSheetID);

  await doc.useServiceAccountAuth({
    client_email: creds.client_email,
    private_key: creds.private_key,
  });

  await doc.loadInfo();
  const firstSheet = doc.sheetsByIndex[0];
  const rows = await firstSheet.getRows();
  // console.log(rows);
  const recipients = [];
  for (const row of rows) {
    recipients.push({
      name: row.name,
      number: row.number,
      zipcode: row.zipcode,
    });
  }
  return recipients;
  /* 
  STOP
  reference the database and fetch all numbers in the database
  */
};

const getWeather = async (recipients) => {
  const result = [];
  let weatherResponse;
  for (const person of recipients) {
    weatherResponse = await axios.get(
      `http://api.weatherapi.com/v1/forecast.json?key=e9d32b93bb95433d9cd232000231802&q=${person.zipcode}&days=1`
    );
    const snowChance =
      weatherResponse.data.forecast.forecastday[0].day.daily_chance_of_snow;
    const cityName = weatherResponse.data.location.name;
    const tempHigh = weatherResponse.data.forecast.forecastday[0].day.maxtemp_f;
    const weatherCondition =
      weatherResponse.data.forecast.forecastday[0].day.condition.text;
    const snowAmount =
      weatherResponse.data.forecast.forecastday[0].day.maxtemp_f;

    const updatedPerson = {
      ...person,
      snowChance,
      snowAmount,
      cityName,
      tempHigh,
      weatherCondition,
    };

    result.push(updatedPerson);
    console.log(result);
  }
  return result;
};

// const weatherReport = (recipients) => {
//   console.log(recipients);
//   recipients.forEach((person) => {
//     const message = `There is a ${person.snowChance}% chance of snow today in ${person.cityName}. The high temperature is ${person.tempHigh} degrees Fahrenheit and the weather condition is ${person.weatherCondition}.`;

//     client.messages
//       .create({
//         body: message,
//         to: "+16176945102", // Text this number
//         from: "+18443292805", // From a valid Twilio number
//       })
//       .then((message) => console.log(message.sid));
//   });
// };

// const snowReport = (recipients) => {
//   console.log(recipients);
//   const recipientsWithSnow = recipients.filter(
//     (person) => person.snowChance !== 0
//   );
//   console.log(recipientsWithSnow);
//   if (recipientsWithSnow.length > 0) {
//     recipientsWithSnow.forEach((person) => {
//       const snowMessage = `Get your gear ready! There is a ${person.snowChance}% chance of snow today in ${person.cityName}.`;

//       client.messages
//         .create({
//           body: snowMessage,
//           to: "+16176945102", // Text this number
//           from: "+18443292805", // From a valid Twilio number
//         })
//         .then((message) => console.log(message.sid));
//     });
//   }
// };

const sendWeatherReport = (recipients) => {
  console.log(recipients);
  const now = new Date();
  const options = { timeZone: "America/Denver", hour12: false };
  const currentHour = new Date().getHours();
  const currentMinute = new Date().getMinutes();
  recipients.forEach((person) => {
    if (person.snowChance !== 0) {
      const snowMessage = `Get your gear ready! There is a ${person.snowChance}% chance of snow today that could accumulate to ${person.snowAmount} cm in ${person.cityName}.`;
      client.messages
        .create({
          body: snowMessage,
          to: "+16176945102",
          from: "+18443292805",
        })
        .then((message) => console.log(message.sid));
    }
    if (person.snowChance === 0 && currentMSTtimeInHours == 12) {
      const weatherMessage = `There is a ${person.snowChance}% chance of snow today in ${person.cityName}. The high temperature is ${person.tempHigh} degrees Fahrenheit and the weather condition is ${person.weatherCondition}.`;
      client.messages
        .create({
          body: weatherMessage,
          to: "+16176945102",
          from: "+18443292805",
        })
        .then((message) => console.log(message.sid));
    }
  });
};

module.exports.handler = async () => {
  const recipientsData = await getAllRecipientsFromDB();
  const weatherData = await getWeather(recipientsData);
  // console.log("L79", weatherData);
  // await weatherReport(weatherData);
  // await snowReport(weatherData);
  await sendWeatherReport(weatherData);
  // await getWeather(recipientsData);
  // await createMessage(weatherData);
  // console.log(message);
  // console.log(weatherData);
};

module.exports.handler();
