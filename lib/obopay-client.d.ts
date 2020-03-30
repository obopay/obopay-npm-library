/// <reference types="node" />
import { LogLevel } from './logger';
import * as stream from 'stream';
export declare type LoggerConfig = {
    logLevel: LogLevel;
    writeStream?: stream.Writable;
};
export declare type ObopayConfig = {
    clientId: string;
    clientPrivateKey: string;
    serverPublicKey: string;
    serverHost: string;
    serverPort?: number;
};
export declare type ResultStruct = {
    error: null | string;
    data: any;
};
export declare namespace ObopayClient {
    function init(config: ObopayConfig, loggerConfig?: LoggerConfig): void;
    function initLogger(loggerConfig?: LoggerConfig): void;
    function obopayApi(moduleName: string, apiName: string, params: any, unsecured?: boolean): Promise<ResultStruct>;
    function closeResources(): void;
}
