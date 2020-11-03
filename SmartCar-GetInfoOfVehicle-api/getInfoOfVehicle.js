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
        if(requestBody.hasOwnProperty('VIN')){
            response = await new querToDb().prepareQueryToDynamoDB(requestBody).catch(err=>{
                utilities.setLoglevelForLogger({logLevel:"error"});
                utilities.printLog(`insertVINnScope:: Catch :: Error :: ${JSON.stringify(err)}`);
                response=null;
            });
            if(response.hasOwnProperty("Items") && response.Items.length>0){
                utilities.printLog(`#########-access-token-############# ${response.Items[0]['accessToken']}`);
                const dataFromSmartCar =await client.exchangeRefreshToken(response.Items[0]['refreshToken']);
                response.Items[0]['accessToken']=dataFromSmartCar.accessToken;
                response.Items[0]['refreshToken']=dataFromSmartCar.refreshToken;
                response.Items[0]['expiration']=dataFromSmartCar.expiration;
                response.Items[0]['refreshExpiration']=dataFromSmartCar.refreshExpiration;
                let updateDb = new querToDb().putData(response.Items[0]).catch(err=>{
                    utilities.setLoglevelForLogger({logLevel:"error"});
                    utilities.printLog(`insertVINnScope:: Catch :: Error :: ${JSON.stringify(err)}`);
                });
                utilities.printLog(`#########-fresh token-############# ${JSON.stringify(response.Items[0])}`);
                const vehiclesFromSmartCar =await smartcar.getVehicleIds(response.Items[0]['accessToken']);
                utilities.printLog(`#########-vehicles-############# ${JSON.stringify(vehiclesFromSmartCar)}`);
                let vehicleData=[];
                for(let i=0;i<vehiclesFromSmartCar.vehicles.length;i++){
                    let item={};
                    let vehicleInfoFromSmartCar =new smartcar.Vehicle(vehiclesFromSmartCar.vehicles[i],response.Items[0]['accessToken']);
                    console.log(vehicleInfoFromSmartCar);
                    utilities.printLog(`#########-vehicles-info-############# ${JSON.stringify(vehicleInfoFromSmartCar)}`);
                    item['vehicleInfo']=await vehicleInfoFromSmartCar.info();
                    try{
                        item['vehicleOdometer']=await vehicleInfoFromSmartCar.odometer();
                    }catch(err){
                        item['vehicleOdometer']=undefined;
                    }
                    vehicleData.push(item);
                }
                return utilities.getResponseObject(vehicleData);
            }else{
                utilities.printLog(`#########-result-############# ${JSON.stringify(response)}`);
                return utilities.getResponseObject(response);
            }
        }
        
    } catch(error) {
        console.log(error);
        utilities.setLoglevelForLogger({logLevel:"error"});
        utilities.printLog(`insertVINnScope:: Catch :: Error :: ${JSON.stringify(error)}`);
        const UIResponseError = new customError(error);
        return utilities.getResponseObject(UIResponseError);
    }
};
