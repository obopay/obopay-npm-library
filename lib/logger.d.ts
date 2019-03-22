import * as stream from 'stream';
export declare type LogLevel = 'NONE' | 'ERROR' | 'DEBUG' | 'CONSOLE';
export declare enum LogVal {
    NONE = 0,
    ERROR = 1,
    DEBUG = 2,
    CONSOLE = 3
}
export declare class Logger {
    private wStream;
    private logVal;
    constructor(logLevel: LogLevel, wStream: stream.Writable);
    close(): void;
    logError(moduleName: string, ...args: Array<any>): void;
    logDebug(moduleName: string, ...args: Array<any>): void;
    isErrorAllowed(): boolean;
    isDebugAllowed(): boolean;
    isConsoleAllowed(): boolean;
    private log;
    private getDateStr;
}
