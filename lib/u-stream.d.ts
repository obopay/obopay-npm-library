import { UPromise } from './u-promise';
import * as stream from 'stream';
export declare namespace UStream {
    const Encoding: {
        bin: string;
        text: string;
        json: string;
    };
    abstract class BaseStreams {
        readonly streams: (stream.Writable | stream.Readable)[];
        readonly uPromise: UPromise<any>;
        cleaned: boolean;
        readonly fnError: any;
        logging: boolean;
        constructor(streams: (stream.Writable | stream.Readable)[], uPromise?: UPromise<any>);
        cleanup(): void;
        private onError;
        protected isWritable(stream: any): boolean;
        abstract subscribe(stream: stream.Writable | stream.Readable): void;
        abstract unsubscribe(stream: stream.Writable | stream.Readable): void;
    }
    class WriteStreams extends BaseStreams {
        private fnFinish;
        constructor(streams: (stream.Writable | stream.Readable)[], promise?: UPromise<any>);
        write(data: Buffer | string): Promise<void>;
        subscribe(stream: stream.Writable | stream.Readable): void;
        unsubscribe(stream: stream.Writable | stream.Readable): void;
        private onFinish;
    }
    class ReadStreams extends BaseStreams {
        private encoding;
        private fnEnd;
        private fnData;
        private body;
        constructor(streams: (stream.Writable | stream.Readable)[], promise?: UPromise<any>);
        read(encoding?: string): Promise<Buffer | string>;
        subscribe(stream: stream.Writable | stream.Readable): void;
        unsubscribe(stream: stream.Writable | stream.Readable): void;
        onData(chunk: Buffer | string): void;
        onEnd(): void;
    }
}
