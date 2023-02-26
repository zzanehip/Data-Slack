import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import * as express from 'express'
import * as cors from 'cors'

const os_request = require("request-promise");
const { WebClient } = require('@slack/web-api');
const web = new WebClient("xoxb-4850547689494-4854583809701-ElFKad1cZ5pyvhFPIpePs6BL");
const corsServer = express();

//Set up cors to prevent any errors from front end.
corsServer.use(cors({
    origin: 'https://data-slack.web.app'
}));

//Initialzie Firebase app.
admin.initializeApp();

corsServer.get('/data_pusher', (request, response) => {
    //Get requested city from request params.
    var request_city = String(request.query.city);
    //Send GET request to OpenWeather API.
    return os_request({
        method: "GET",
        uri: `https://api.openweathermap.org/data/2.5/weather?q=${request_city}&appid=a287713003f81bf6e2f8a73fe70a5f6b&units=imperial`,
        json: true
    }).then((res: any) => {
        const conversationId = 'C04R0G64A3G';
        //Take response data from OpenWeather GET, format, and send to Slack.
        (async () => {
            const result = await web.chat.postMessage({
                text: `Hello There! Here is what the weather is looking like right now in ${res.name}:\n\n🌡️ The temperature is: ${res.main.temp}°\n\n⛱️ It feels like: ${res.main.feels_like}°\n\n🔆 Today's conditions are: ${res.weather[0].description}
                `,
                channel: conversationId,
            });
            //Store full response in Firestore document. By defintion, this will log success/failure status.
            var firestore_log = admin.firestore().collection("logs").doc(result.ts).set(result);
            return firestore_log;
        })();
        //Assuming we might want to access the OpenWeather data agin from our api call, we send it.
        response.status(200).send(res);
    });
});

export const webApi = functions.https.onRequest(corsServer); 
