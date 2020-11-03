'use strict';

const utilities = require( "./utilities/utilities");
const customError = require( "./utilities/customError");

const axios = require('axios');

module.exports.handler = async (event) => {
    utilities.printLog(`Handler execution started :: insertVINnScope`);
    if(!utilities.isObjectEmpty(JSON.parse(event.body))) {
        console.log(JSON.parse(event.body));
        let request = JSON.parse(event.body);
        try{   
            if(request.VIN.length==17){
                console.log(`https://api.smartcar.com/v1.0/compatibility?vin=${request.VIN}&scope=read_vehicle_info&country=US`)
                let response = await axios({
                    method: 'GET',
                    url: `https://api.smartcar.com/v1.0/compatibility?vin=${request.VIN}&scope=read_vehicle_info&country=US`,
                    auth: {
                        username: '7059b968-efe4-4aa2-98ba-843335cad949',
                        password: '6bb49902-73ba-4ea4-8baf-e41cc97e2732'
                    }
                });
                response.tranCode="200";
                return utilities.getResponseObject(response.data);
            }else{
                let result={};
                result.tranCode="200";
                result.data={
                    'compatible':false
                }
                return utilities.getResponseObject(result.data);
            }
        } catch (error) {
            let result={};
            result.tranCode="200";
            result.data={
                'compatible':false
            }
            return utilities.getResponseObject(result.data);
        }
    }else{
        let result={};
        result.tranCode="200";
        result.data={
            'compatible':false
        }
        return utilities.getResponseObject(result.data);
    }
};

