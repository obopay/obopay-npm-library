"use strict";
/*------------------------------------------------------------------------------
   About      : Encryption-decryption provider for https request
   
   Created on : Wed Mar 13 2019
   Author     : Vishal Sinha
   
   Copyright (c) 2019 Obopay Mobile Technologies Pvt Ltd. All rights reserved.
------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const zlib = require("zlib");
const SYM_ALGO = 'aes-256-cbc', IV = Buffer.from([0x01, 0x00, 0x03, 0x00, 0x01, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x09, 0x00, 0x07, 0x00, 0x00, 0x00]), MIN_SIZE_TO_COMPRESS = 1000, AES_KEY_SIZE = 32, BASE64 = 'base64', SIXTEEN = 16, CLASS_NAME = 'HttpsEncProvider';
const HttpConstants = {
    gzip: 'gzip',
    deflate: 'deflate',
    identity: 'identity'
};
class HttpsEncProvider {
    constructor(logger, privateKey) {
        this.logger = logger;
        this.privateKey = privateKey;
    }
    encodeRequestKey(publicKey) {
        this.logger.logDebug(CLASS_NAME, 'encodeRequestKey');
        if (!this.reqAesKey)
            this.reqAesKey = this.getNewAesKey();
        const encKeyBuf = this.encryptUsingPublicKey(publicKey, this.reqAesKey), encKey = encKeyBuf.toString(BASE64);
        return encKey;
    }
    encodeRequestTs(ts) {
        this.logger.logDebug(CLASS_NAME, 'encodeRequestTs', ts);
        const encReqTs = this.encryptRequestTs(ts);
        return encReqTs;
    }
    encodeBody(data) {
        this.logger.logDebug(CLASS_NAME, 'encodeBody', data);
        return this.encryptBody(data);
    }
    decodeBody(streams, encoding) {
        this.logger.logDebug(CLASS_NAME, 'decodeBody', encoding);
        return this.decryptBody(streams, encoding);
    }
    decodeResponseKey(publicKey, encKey) {
        this.logger.logDebug(CLASS_NAME, 'decodeResponseKey', encKey);
        const encKeyBuf = Buffer.from(encKey, BASE64), decKey = this.decryptUsingPublicKey(publicKey, encKeyBuf);
        this.respAesKey = this.decryptUsingReqAesKey(decKey);
        return this.respAesKey;
    }
    /*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
       PRIVATE METHODS
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
    encryptRequestTs(tsMicro) {
        const encReqTs = this.encryptUsingPrivateKey(Buffer.from(tsMicro.toString()));
        return encReqTs.toString(BASE64);
    }
    encryptBody(json) {
        const jsonStr = JSON.stringify(json), streams = [];
        let bodyEncoding = HttpConstants.identity, contentLength;
        if (jsonStr.length > MIN_SIZE_TO_COMPRESS) {
            bodyEncoding = HttpConstants.deflate;
            streams.push(zlib.createDeflate());
        }
        else {
            contentLength = this.getFinalContentLength(jsonStr.length);
        }
        if (!this.reqAesKey)
            this.reqAesKey = this.getNewAesKey();
        streams.push(this.getCipher(this.reqAesKey));
        return { streams, dataStr: jsonStr, bodyEncoding, contentLength };
    }
    decryptBody(streams, encoding) {
        streams.push(this.getDecipher(this.respAesKey));
        switch (encoding) {
            case HttpConstants.deflate:
                streams.push(zlib.createInflate());
                break;
            case HttpConstants.gzip:
                streams.push(zlib.createGunzip());
                break;
            case HttpConstants.identity:
                break;
            default:
                this.logger.logError(CLASS_NAME, 'Unknown compression factor.', encoding);
                throw new Error('Unknown compression factor.');
        }
        return streams;
    }
    getNewAesKey() {
        const key = crypto.randomBytes(AES_KEY_SIZE);
        this.logger.logDebug(CLASS_NAME, 'Generating new aes key.', key.toString(BASE64));
        return key;
    }
    getCipher(key) {
        this.logger.logDebug(CLASS_NAME, 'Generating new cipher.', key.toString(BASE64));
        const cipher = crypto.createCipheriv(SYM_ALGO, key, IV);
        return cipher;
    }
    getDecipher(key) {
        this.logger.logDebug(CLASS_NAME, 'Generating new decipher.', key.toString(BASE64));
        const decipher = crypto.createDecipheriv(SYM_ALGO, key, IV);
        return decipher;
    }
    decryptUsingReqAesKey(encData) {
        this.logger.logDebug(CLASS_NAME, 'decryptUsingReqAesKey', encData.toString(BASE64));
        const decipher = this.getDecipher(this.reqAesKey), buff1 = decipher.update(encData), buff2 = decipher.final();
        return buff2.length ? Buffer.concat([buff1, buff2]) : buff1;
    }
    getFinalContentLength(contentLength) {
        const rem = contentLength % SIXTEEN, finalLength = contentLength - rem + SIXTEEN;
        this.logger.logDebug(CLASS_NAME, 'getFinalContentLength', contentLength, finalLength);
        return finalLength;
    }
    encryptUsingPublicKey(publicKey, data) {
        this.logger.logDebug(CLASS_NAME, 'encryptUsingPublicKey', data.toString(BASE64));
        const encData = crypto.publicEncrypt(publicKey, data);
        return encData;
    }
    decryptUsingPublicKey(publicKey, encData) {
        this.logger.logDebug(CLASS_NAME, 'decryptUsingPublicKey', encData.toString(BASE64));
        const data = crypto.publicDecrypt(publicKey, encData);
        return data;
    }
    encryptUsingPrivateKey(data) {
        this.logger.logDebug(CLASS_NAME, 'encryptUsingPrivateKey', data.toString(BASE64));
        const encData = crypto.privateEncrypt(this.privateKey, data);
        return encData;
    }
}
exports.HttpsEncProvider = HttpsEncProvider;
