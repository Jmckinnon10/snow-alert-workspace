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
    person.snowChance = snowChance;
    result.push(person);
  }
  // console.log(result);
  return result;
};

const createMessage = (recipients) => {
  console.log(recipients);
  const recipientsWithSnow = recipients.filter(
    (person) => person.snowChance !== 0
  );
  const recipientsWithNoSnow = recipients.filter(
    (person) => person.snowChance == 0
  );
  console.log(recipientsWithSnow);
  console.log(recipientsWithNoSnow);
  if (recipientsWithSnow.length > 0) {
    // for each recipient make and send a message
    client.messages
      .create({
        body: "There is a chance of snow today",
        to: "+16176945102", // Text this number
        from: "+18443292805", // From a valid Twilio number
      })
      .then((message) => console.log(message.sid));
  }
  if (recipientsWithNoSnow.length > 0) {
    // for each recipient make and send a message
    client.messages
      .create({
        body: "Sorry! No chance of snow today",
        to: "+16176945102", // Text this number
        from: "+18443292805", // From a valid Twilio number
      })
      .then((message) => console.log(message.sid));
  }
};

module.exports.handler = async () => {
  const recipientsData = await getAllRecipientsFromDB();
  const weatherData = await getWeather(recipientsData);
  // console.log("L79", weatherData);
  const message = await createMessage(weatherData);
  // await getWeather(recipientsData);
  // await createMessage(weatherData);
  // console.log(message);
  // console.log(weatherData);
};

module.exports.handler();
