"use strict";
/*------------------------------------------------------------------------------
   About      : UStream
   
   Created on : Wed Mar 13 2019
   Author     : Vishal Sinha
   
   Copyright (c) 2019 Obopay Mobile Technologies Pvt Ltd. All rights reserved.
------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const u_promise_1 = require("./u-promise");
var UStream;
(function (UStream) {
    UStream.Encoding = {
        bin: 'bin',
        text: 'text',
        json: 'json'
    };
    class BaseStreams {
        constructor(streams, uPromise = new u_promise_1.UPromise()) {
            this.streams = streams;
            this.uPromise = uPromise;
            this.cleaned = false;
            this.fnError = this.onError.bind(this);
            this.logging = false;
            const len = streams.length, lastStream = streams[len - 1], firstStream = streams[0], readable = firstStream;
            // Needed for Readable and PipedWriteStream
            if (readable.pause)
                readable.pause();
            this.subscribe(lastStream);
            lastStream.on('error', this.fnError);
            let prevStream = lastStream;
            for (let i = len - 2; i >= 0; i--) {
                const stream = streams[i];
                stream.on('error', this.fnError).pipe(prevStream);
                prevStream = stream;
            }
        }
        cleanup() {
            let lastStream, stream;
            if (this.cleaned)
                return;
            while (stream = this.streams.shift()) {
                // had skipped removeListener to avoid process level error event
                stream.removeListener('error', this.fnError);
                if (lastStream && lastStream.unpipe)
                    lastStream.unpipe(stream);
                lastStream = stream;
            }
            if (lastStream) { // last one, stream would be null at this point
                this.unsubscribe(lastStream);
            }
            this.cleaned = true;
        }
        onError(err) {
            if (this.cleaned)
                return;
            this.cleanup();
            this.uPromise.reject(err);
        }
        isWritable(stream) {
            return !!stream.write;
        }
    }
    UStream.BaseStreams = BaseStreams;
    class WriteStreams extends BaseStreams {
        constructor(streams, promise) {
            super(streams, promise);
        }
        async write(data) {
            const writeStream = this.streams[0];
            data ? writeStream.end(data) : writeStream.end();
            await this.uPromise.promise;
        }
        subscribe(stream) {
            if (!this.fnFinish)
                this.fnFinish = this.onFinish.bind(this);
            stream.on('finish', this.fnFinish);
        }
        unsubscribe(stream) {
            if (this.fnFinish)
                stream.removeListener('finish', this.fnFinish);
        }
        onFinish() {
            this.cleanup();
            this.uPromise.resolve(null);
        }
    }
    UStream.WriteStreams = WriteStreams;
    class ReadStreams extends BaseStreams {
        constructor(streams, promise) {
            super(streams, promise);
            this.encoding = UStream.Encoding.bin;
        }
        async read(encoding) {
            const stream = this.streams[0];
            if (encoding)
                this.encoding = encoding;
            stream.resume();
            const result = await this.uPromise.promise;
            return result;
        }
        subscribe(stream) {
            if (!this.fnEnd) {
                this.fnEnd = this.onEnd.bind(this);
                this.fnData = this.onData.bind(this);
            }
            stream.on('data', this.fnData).on('end', this.fnEnd);
        }
        unsubscribe(stream) {
            if (!this.fnEnd)
                return;
            stream.removeListener('data', this.fnData);
            stream.removeListener('end', this.fnEnd);
        }
        onData(chunk) {
            if (this.cleaned)
                return;
            if (!this.body) {
                this.body = chunk;
                return;
            }
            if (chunk instanceof Buffer) {
                this.body = Buffer.concat([this.body, chunk]);
            }
            else {
                this.body += chunk;
            }
        }
        onEnd() {
            if (this.cleaned)
                return;
            this.cleanup();
            if (this.body === undefined) {
                this.body = Buffer.from('');
            }
            if (this.body instanceof Buffer) {
                if (this.encoding === UStream.Encoding.json || this.encoding === UStream.Encoding.text) {
                    this.body = this.body.toString();
                }
            }
            const result = this.encoding === UStream.Encoding.json ? JSON.parse(this.body || '{}') : this.body;
            this.uPromise.resolve(result);
        }
    }
    UStream.ReadStreams = ReadStreams;
})(UStream = exports.UStream || (exports.UStream = {}));
