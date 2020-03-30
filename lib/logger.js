"use strict";
/*------------------------------------------------------------------------------
   About      : Obopay Client Logger
   
   Created on : Fri Mar 15 2019
   Author     : Vishal Sinha
   
   Copyright (c) 2019 Obopay Mobile Technologies Pvt Ltd. All rights reserved.
------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
var LogVal;
(function (LogVal) {
    LogVal[LogVal["NONE"] = 0] = "NONE";
    LogVal[LogVal["ERROR"] = 1] = "ERROR";
    LogVal[LogVal["DEBUG"] = 2] = "DEBUG";
    LogVal[LogVal["CONSOLE"] = 3] = "CONSOLE";
})(LogVal = exports.LogVal || (exports.LogVal = {}));
class Logger {
    constructor(logLevel, wStream) {
        this.wStream = wStream;
        this.logVal = 0;
        this.logVal = LogVal[logLevel];
    }
    close() {
        this.wStream.end();
    }
    logError(moduleName, ...args) {
        if (!this.isErrorAllowed())
            return;
        this.log('!!!', moduleName, args);
    }
    logDebug(moduleName, ...args) {
        if (!this.isDebugAllowed())
            return;
        this.log('-->', moduleName, args);
    }
    isErrorAllowed() {
        return this.logVal >= LogVal.ERROR;
    }
    isDebugAllowed() {
        return this.logVal >= LogVal.DEBUG;
    }
    isConsoleAllowed() {
        return this.logVal >= LogVal.CONSOLE;
    }
    log(logPrefix, moduleName, args) {
        const date = new Date(), dateStr = this.getDateStr(date);
        let logStr = `${logPrefix} ${dateStr} ${moduleName}:`;
        for (const arg of args) {
            let add = arg;
            if (typeof arg === 'object')
                add = JSON.stringify(arg);
            logStr = logStr + ' ' + add;
        }
        if (this.isConsoleAllowed())
            console.log(logStr);
        logStr = logStr + '\n';
        this.wStream.write(Buffer.from(logStr));
    }
    getDateStr(date) {
        if (!date)
            date = new Date();
        function doubleDigit(val) {
            return ('0' + val.toString()).slice(-2);
        }
        return `${doubleDigit(date.getDate())}/${doubleDigit(date.getMonth() + 1)}`
            + ` ${doubleDigit(date.getHours())}:${doubleDigit(date.getMinutes())}:${doubleDigit(date.getSeconds())}`
            + `.${('00' + date.getMilliseconds().toString()).slice(-3)}`;
    }
}
exports.Logger = Logger;
