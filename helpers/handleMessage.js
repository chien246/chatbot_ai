const config = require('./config');
const timeout = 3000;
const request = require("request");
const RestClient = require('node-rest-client').Client;
const _ = require('lodash');
const validateMessage = require('./regexMessage').vaidateMessage;
const clearEnglish = require('./regexMessage').clearEnglish;
const parseString = require('xml2js').parseString;
const vntk = require('vntk');
const mlcode = require('../mlCode.js');

var classifier = new vntk.BayesClassifier();

const util = require('util');
const inspect = require('eyes').inspector({maxLength:false});
let apikey = '448ef45b0281fbb61aab8d782b0c869c';
let cities = 'danang';
let countries = 'vn';
let url = `https://api.openweathermap.org/data/2.5/forecast?q=${cities},${countries}&mode=xml&appid=${apikey}`;

let date = new Date();
var hour = Number(date.getHours());
var dateForecast = Number(date.getDate()) + 1;
var state; //trạng thái
var temperatureMin; //nhiệt độ
var temperatureMax;
var humidity; //độ ẩm
var now;
var forecast_j;
request(url, (err, response, data) => {
    parseString(data, { trim: true }, (err, result) => {
        let root = result.weatherdata;
        let forecast = Array.from(root.forecast[0].time).map(p => ({
            time: {
                from: p.$.from,
                to: p.$.to,
                state: p.symbol[0].$.name,
                temp: {
                    min: p.temperature[0].$.min,
                    max: p.temperature[0].$.max
                },
                humidity: {
                    value: p.humidity[0].$.value,
                    unit: p.humidity[0].$.unit
                },
                clouds: {
                    value: p.clouds[0].$.value,
                    all: p.clouds[0].$.all,
                    unit: p.humidity[0].$.unit
                }
            }
        }));

        let template = {
            location: {
                city: root.location[0].name[0],
                country: root.location[0].country[0],
                coord: {
                    latitude: root.location[0].location[0].$.latitude,
                    longitude: root.location[0].location[0].$.longitude
                }
            },
            forecast: [forecast]
        };

        for (let forecast_i of root.forecast[0].time) {
            let hf = Number(forecast_i.$.from.substr(11, 2));
            let ht = Number(forecast_i.$.to.substr(11, 2));
            if (ht == 0) ht = 24;

            if (hour >= hf && hour <= ht) {
                state = forecast_i.clouds[0].$.value;
                temperatureMin = Number(forecast_i.temperature[0].$.min) - 273.15;
                temperatureMax = Number(forecast_i.temperature[0].$.max) - 273.15;
                temperatureMin = temperatureMin.toFixed(0);
                temperatureMax = temperatureMax.toFixed(0);
                humidity = forecast_i.humidity[0].$.value;
                now =
                    "Thời tiết bây giờ \n" +
                    "Sate: " +
                    state +
                    "\n" +
                    "Temperature" +
                    temperatureMin +
                    "  " +
                    temperatureMax +
                    "\n" +
                    "Humidity: " +
                    humidity +
                    "%";
                break;
            }
        }

        for (let forecast_i of root.forecast[0].time) {
            let date = Number(forecast_i.$.from.substr(8, 2));

            if (dateForecast == date) {
                state = forecast_i.clouds[0].$.value;
                temperatureMin = Number(forecast_i.temperature[0].$.min) - 273.15;
                temperatureMax = Number(forecast_i.temperature[0].$.max) - 273.15;
                temperatureMin = temperatureMin.toFixed(0);
                temperatureMax = temperatureMax.toFixed(0);
                humidity = forecast_i.humidity[0].$.value;
                forecast_j =
                    "thời tiết dự báo ngày mai \n" +
                    "Sate: " +
                    state +
                    "\n" +
                    "Temperature" +
                    temperatureMin +
                    "  " +
                    temperatureMax +
                    "\n" +
                    "Humidity: " +
                    humidity +
                    "%";
                break;
            }
        }
    });
    // console.log(now + forecast_j);
});


module.exports.handleMessage = async (sender_psid, received_message) => {
    console.log(sender_psid)
    let response;
    if (received_message.text) {
        let rs = await mlcode.main(received_message.text);
        let tR = "";
        if(rs == "greetings") {
            let ans = ['chào bạn','tôi có thể giúp gì cho bạn','rất vui được hỗ trợ bạn'];
            let index = Math.floor(Math.random()*ans.length);
            //response = ans[index];
            response="hihi";
        };
        if(rs == "weather") {
            response = now+forecast_j;
        };
        
        let text = {"text": `${response}`};
        // output: when
        callSendAPI(sender_psid,text);
    } 
};

const callSendAPI = (sender_psid, response, cb = null) => {
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    };
    request(
        {
            "uri": "https://graph.facebook.com/v2.6/me/messages",
            "qs": { "access_token": config.PAGE_ACCESS_TOKEN },
            "method": "POST",
            "json": request_body
        },
        (err, res, body) => {
            if (!err) {
                if (cb) {
                    cb();
                }

                console.log("message sent!");
            } else {
                console.error("Unable to send message:" + err);
            }
        }
    );
};
