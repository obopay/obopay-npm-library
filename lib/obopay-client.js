"use strict";
/*------------------------------------------------------------------------------
   About      : Obopay Client
   
   Created on : Wed Mar 13 2019
   Author     : Vishal Sinha
   
   Copyright (c) 2019 Obopay Mobile Technologies Pvt Ltd. All rights reserved.
------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./logger");
const u_promise_1 = require("./u-promise");
const u_stream_1 = require("./u-stream");
const https_enc_provider_1 = require("./https-enc-provider");
const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const POST = 'POST', CLASS_NAME = 'ObopayClient', CURRENT_PROTOCOL = 'v2', LOG_DIRECTORY = 'obopay-logs';
const HttpConstants = {
    httpProto: 'http:',
    httpsProto: 'https:',
    contentType: 'content-type',
    contentLength: 'content-length',
    clientId: 'x-obopay-cid',
    versionNumber: 'x-obopay-version',
    requestTs: 'x-obopay-ts',
    symmKey: 'x-obopay-key',
    requestType: 'x-obopay-type',
    bodyEncoding: 'x-obopay-encoding',
    transferEncoding: 'transfer-encoding',
    stream: 'application/octet-stream',
    identity: 'identity',
    chunked: 'chunked'
};
const ErrorCodes = {
    PROTOCOL_FAILURE: 'PROTOCOL_FAILURE',
    OBOPAY_SERVER_UNREACHABLE: 'OBOPAY_SERVER_UNREACHABLE'
};
var ObopayClient;
(function (ObopayClient) {
    let clientId, clientPrivateKey, serverPublicKey, serverHost, serverPort, logger, logLevel, selfLogStream, currentLogDate;
    function init(config, loggerConfig) {
        if (clientId) {
            if (logger)
                logger.logError('Calling ObopayClient init twice.');
            throw new Error('Calling ObopayClient init twice.');
        }
        clientId = config.clientId;
        clientPrivateKey = config.clientPrivateKey;
        serverPublicKey = config.serverPublicKey;
        serverHost = config.serverHost;
        serverPort = config.serverPort || 443;
        initLogger(loggerConfig);
        delete config.clientPrivateKey;
        logger.logDebug(CLASS_NAME, 'init', config);
    }
    ObopayClient.init = init;
    function initLogger(loggerConfig) {
        if (!fs.existsSync(LOG_DIRECTORY))
            fs.mkdirSync(LOG_DIRECTORY);
        const logDate = currentDate(), logFile = path.join(process.cwd(), LOG_DIRECTORY, `${logDate}.log`), logStream = loggerConfig && loggerConfig.writeStream ? loggerConfig.writeStream
            : fs.createWriteStream(logFile, { flags: 'a' });
        logLevel = loggerConfig && loggerConfig.logLevel ? loggerConfig.logLevel : 'DEBUG',
            selfLogStream = !(loggerConfig && loggerConfig.writeStream);
        logger = new logger_1.Logger(logLevel, logStream);
        if (selfLogStream)
            currentLogDate = logDate;
        logger.logDebug(CLASS_NAME, 'initLogger', logLevel);
    }
    ObopayClient.initLogger = initLogger;
    function obopayApi(apiName, params, unsecured) {
        if (!clientId || !clientPrivateKey || !serverPublicKey || !serverHost || !serverPort) {
            if (logger) {
                logger.logError(CLASS_NAME, 'ObopayClient not initialized with proper params.', { clientId, serverPublicKey, serverHost, serverPort, log: !!logger });
            }
            throw new Error('ObopayClient not initialized with proper params.');
        }
        if (selfLogStream && currentLogDate && currentLogDate != currentDate()) {
            logger.logDebug(CLASS_NAME, 'closing logger');
            logger.close();
            initLogger({ logLevel });
        }
        logger.logDebug(CLASS_NAME, 'obopayApi', apiName, params);
        const headers = {};
        headers[HttpConstants.clientId] = clientId;
        headers[HttpConstants.versionNumber] = CURRENT_PROTOCOL;
        headers[HttpConstants.contentType] = HttpConstants.stream;
        const encProvider = new https_enc_provider_1.HttpsEncProvider(logger, clientPrivateKey);
        headers[HttpConstants.symmKey] = encProvider.encodeRequestKey(serverPublicKey);
        headers[HttpConstants.requestTs] = encProvider.encodeRequestTs(Date.now() * 1000); // Current ts in micro seconds
        const encBodyObj = encProvider.encodeBody(params);
        headers[HttpConstants.bodyEncoding] = encBodyObj.bodyEncoding;
        encBodyObj.contentLength ? headers[HttpConstants.contentLength] = encBodyObj.contentLength
            : headers[HttpConstants.transferEncoding] = HttpConstants.chunked;
        const options = {
            method: POST,
            protocol: unsecured ? HttpConstants.httpProto : HttpConstants.httpsProto,
            host: serverHost,
            port: serverPort,
            path: `/${CURRENT_PROTOCOL}/${clientId}/${apiName}`,
            headers: headers
        };
        logger.logDebug(CLASS_NAME, 'request', options);
        const resp = request(options, encProvider, encBodyObj.streams, encBodyObj.dataStr, unsecured);
        return resp;
    }
    ObopayClient.obopayApi = obopayApi;
    function closeResources() {
        if (logger) {
            logger.logDebug(CLASS_NAME, 'closeResources');
            logger.close();
        }
        clientId = undefined;
    }
    ObopayClient.closeResources = closeResources;
    async function request(options, encProvider, writeStreams, dataStr, unsecured) {
        logger.logDebug(CLASS_NAME, `${unsecured ? 'http' : 'https'} request to server.`, options);
        const req = unsecured ? http.request(options) : https.request(options), writePromise = new u_promise_1.UPromise(), readPromise = new u_promise_1.UPromise();
        writeStreams.push(req);
        req.on('response', (resp) => {
            logger.logDebug(CLASS_NAME, `${unsecured ? 'http' : 'https'} response from server, status: ${resp.statusCode}.`, resp.headers);
            if (!resp.headers[HttpConstants.symmKey]) {
                const err = new Error(`${HttpConstants.symmKey} missing in response headers.`);
                logger.logError(CLASS_NAME, err);
                writePromise.reject(err);
                readPromise.reject(err);
                // throw err
            }
            if (!resp.headers[HttpConstants.bodyEncoding])
                resp.headers[HttpConstants.bodyEncoding] = HttpConstants.identity;
            encProvider.decodeResponseKey(serverPublicKey, resp.headers[HttpConstants.symmKey]);
            const readStreams = encProvider.decodeBody([resp], resp.headers[HttpConstants.bodyEncoding]);
            const readUstream = new u_stream_1.UStream.ReadStreams(readStreams, readPromise);
            readUstream.read();
        });
        req.on('error', (err) => {
            logger.logError(CLASS_NAME, err);
            writePromise.reject(err);
            readPromise.reject(err);
        });
        const writeUstream = new u_stream_1.UStream.WriteStreams(writeStreams, writePromise);
        writeUstream.write(dataStr);
        try {
            const [, output] = await Promise.all([writePromise.promise,
                readPromise.promise]);
            const result = JSON.parse(output.toString());
            logger.logDebug(CLASS_NAME, 'result', result);
            if (result.error && result.error === 'success') {
                const data = typeof result.data === 'number'
                    ? `Refer to obopay security error codes for error code ${result.data}.`
                    : result.data;
                const errResult = { error: ErrorCodes.PROTOCOL_FAILURE, data };
                logger.logError(CLASS_NAME, 'error-result', errResult);
                throw errResult;
            }
            return result;
        }
        catch (err) {
            if (err.error === ErrorCodes.PROTOCOL_FAILURE)
                return err;
            logger.logError(CLASS_NAME, err);
            if (err.code === 'ECONNREFUSED') {
                return {
                    error: ErrorCodes.OBOPAY_SERVER_UNREACHABLE,
                    data: 'Obopay server is unreachable. Please try after some time.'
                };
            }
            return { error: err.code, data: err };
        }
    }
    function currentDate() {
        const date = new Date();
        function doubleDigit(val) {
            return ('0' + val.toString()).slice(-2);
        }
        return `${doubleDigit(date.getDate())}_${doubleDigit(date.getMonth())}_${doubleDigit(date.getFullYear())}`;
    }
})(ObopayClient = exports.ObopayClient || (exports.ObopayClient = {}));
