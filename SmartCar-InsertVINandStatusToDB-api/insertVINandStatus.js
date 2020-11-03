'use strict';

const utilities = require( "./utilities/utilities");
const customError = require( "./utilities/customError");

const querToDb =require("./helpers/queryHelper");

module.exports.handler = async (event) => {
    utilities.printLog(`Handler execution started :: insertVINandStatus`);
    if(!utilities.isObjectEmpty(JSON.parse(event.body))) {
        return invokeToProcessDatabase(event);
    } else {
        utilities.printLog(`insertVINandStatus:: handler :: Error :: Empty Event `);
        const errorObj = new customError({tranCode: "400", tranStatusDescription: "Event is Empty."});
        return utilities.getResponseObject(errorObj);
    }
};

const invokeToProcessDatabase =  async (event) => {
    
    try {
        utilities.setLoglevelForLogger({logLevel:"info"});
        utilities.printLog(`invokeToProcessRequestBody:: execution started :: insertVINandStatus`);
        const requestBody = JSON.parse(event.body);
        const createTable= await new querToDb().create_table().catch(err=>{
            utilities.setLoglevelForLogger({logLevel:"error"});
            utilities.printLog(`insertVINandStatus:: Catch :: Error :: ${JSON.stringify(err)}`);
        })
        let response=null;
        if(Array.isArray(requestBody)){
            utilities.printLog(`Create action: ${JSON.stringify(createTable)}`);
            for(let i=0;i<requestBody.length;i++){
              response = await new querToDb().putData(requestBody[i]).catch(err=>{
                utilities.setLoglevelForLogger({logLevel:"error"});
                utilities.printLog(`insertVINandStatus:: Catch :: Error :: ${JSON.stringify(err)}`);
                if(i==requestBody.length){
                    response=null;
                }
              });
            }
        }else{
            response = await new querToDb().putData(requestBody).catch(err=>{
                utilities.setLoglevelForLogger({logLevel:"error"});
                utilities.printLog(`insertVINandStatus:: Catch :: Error :: ${JSON.stringify(err)}`);
                response=null;
            });
        }
        if(response==null){
            throw new Error("Data insertion failed");
        }else{
            utilities.printLog(`UIResponse :: ${JSON.stringify(response)}`);
            return utilities.getResponseObject(response);
        }
    } catch(error) {
        utilities.setLoglevelForLogger({logLevel:"error"});
        utilities.printLog(`insertVINandStatus:: Catch :: Error :: ${JSON.stringify(error)}`);
        const UIResponseError = new customError(error);
        return utilities.getResponseObject(UIResponseError);
    }
};
