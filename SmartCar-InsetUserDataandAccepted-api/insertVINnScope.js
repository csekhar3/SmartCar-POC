'use strict';

const utilities = require( "./utilities/utilities");
const customError = require( "./utilities/customError");

const querToDb =require("./helpers/queryHelper");
const smartcar = require('smartcar');
let client;



module.exports.handler = async (event) => {
    utilities.printLog(`Handler execution started :: insertVINnScope`);
    if(!utilities.isObjectEmpty(JSON.parse(event.body))) {
        client = new smartcar.AuthClient({
            // clientId: '50758431-69da-4e4c-9667-dca821fd6a58',
            // clientSecret: '5822a97f-1157-4e0b-93af-ff6a1bedaf21',
            clientId: '7059b968-efe4-4aa2-98ba-843335cad949', 
            clientSecret: '6bb49902-73ba-4ea4-8baf-e41cc97e2732',
            redirectUri: 'https://d3lb0jph852psp.cloudfront.net/thank-you',
            scope: ['read_odometer','read_vehicle_info'],
            testMode: true
        });
        return invokeToProcessDatabase(event);
    } else {
        utilities.printLog(`insertVINnScope:: handler :: Error :: Empty Event `);
        const errorObj = new customError({tranCode: "400", tranStatusDescription: "Event is Empty."});
        return utilities.getResponseObject(errorObj);
    }
};

const invokeToProcessDatabase =  async (event) => {
    
    try {
        let response=null;
        utilities.setLoglevelForLogger({logLevel:"info"});
        utilities.printLog(`invokeToProcessRequestBody:: execution started :: insertVINnScope`);
        const requestBody = JSON.parse(event.body);
        if(requestBody.hasOwnProperty('USER')){
            utilities.printLog(`###################### ${JSON.stringify(requestBody)}`);
            const dataFromSmartCar =await client.exchangeCode(requestBody.USER);
            requestBody['accessToken']=dataFromSmartCar.accessToken;
            requestBody['refreshToken']=dataFromSmartCar.refreshToken;
            requestBody['expiration']=dataFromSmartCar.expiration;
            requestBody['refreshExpiration']=dataFromSmartCar.refreshExpiration;
            utilities.printLog(`########################## ${JSON.stringify(requestBody)}`);
            const createTable= await new querToDb().create_table().catch(err=>{
                utilities.setLoglevelForLogger({logLevel:"error"});
                utilities.printLog(`insertVINnScope:: Catch :: Error :: ${JSON.stringify(err)}`);
            })
            utilities.printLog(`insertVINnScope:: Create Table :: ${JSON.stringify(createTable)}`);
            response = await new querToDb().putData(requestBody).catch(err=>{
                utilities.setLoglevelForLogger({logLevel:"error"});
                utilities.printLog(`insertVINnScope:: Catch :: Error :: ${JSON.stringify(err)}`);
                response=null;
            });
            return utilities.getResponseObject(response);
        }
        
    } catch(error) {
        console.log(error);
        utilities.setLoglevelForLogger({logLevel:"error"});
        utilities.printLog(`insertVINnScope:: Catch :: Error :: ${JSON.stringify(error)}`);
        const UIResponseError = new customError(error);
        return utilities.getResponseObject(UIResponseError);
    }
};
