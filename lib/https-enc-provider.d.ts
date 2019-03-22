import { Logger } from './logger';
import * as stream from 'stream';
export declare class HttpsEncProvider {
    private logger;
    private privateKey;
    private reqAesKey;
    private respAesKey;
    constructor(logger: Logger, privateKey: string);
    encodeRequestKey(publicKey: string): string;
    encodeRequestTs(ts: number): string;
    encodeBody(data: any): {
        streams: Array<stream.Writable>;
        dataStr: string;
        bodyEncoding: string;
        contentLength?: number;
    };
    decodeBody(streams: Array<stream.Readable>, encoding: string): Array<stream.Readable>;
    decodeResponseKey(publicKey: string, encKey: string): Buffer;
    private encryptRequestTs;
    private encryptBody;
    private decryptBody;
    private getNewAesKey;
    private getCipher;
    private getDecipher;
    private decryptUsingReqAesKey;
    private getFinalContentLength;
    private encryptUsingPublicKey;
    private decryptUsingPublicKey;
    private encryptUsingPrivateKey;
}
