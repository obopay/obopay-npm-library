"use strict";
/*------------------------------------------------------------------------------
   About      : UPromise
   
   Created on : Wed Mar 13 2019
   Author     : Vishal Sinha
   
   Copyright (c) 2019 Obopay Mobile Technologies Pvt Ltd. All rights reserved.
------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
class UPromise {
    constructor() {
        this.fnResolve = null;
        this.fnReject = null;
        this.promise = new Promise((resolve, reject) => {
            this.fnResolve = resolve;
            this.fnReject = reject;
        });
    }
    static execFn(fn, context, ...params) {
        const promiseFn = this.getFn(fn, context);
        return promiseFn(...params);
    }
    static delayedPromise(ms, fulfillWith) {
        return new Promise((resolve, reject) => {
            setTimeout(() => resolve(fulfillWith), ms);
        });
    }
    static getFn(fn, context) {
        return function (...arParam) {
            return new Promise(function (resolve, reject) {
                function cb(...arCbParam) {
                    const err = arCbParam.shift();
                    if (err)
                        return reject(err);
                    // Resolved with multiple values; this would actually give first value in promise
                    resolve.apply(null, arCbParam);
                }
                try {
                    arParam.push(cb);
                    fn.apply(context, arParam);
                }
                catch (e) {
                    reject(e);
                }
            });
        };
    }
    // Executes a function sync and return promise for chaining
    execute(cb) {
        cb(this);
        return this;
    }
    resolve(result) {
        if (this.fnResolve) {
            this.fnResolve(result);
            this.cleanup();
        }
    }
    reject(err) {
        if (this.fnReject) {
            this.fnReject(err);
            this.cleanup();
        }
    }
    cleanup() {
        this.fnResolve = null;
        this.fnReject = null;
    }
}
exports.UPromise = UPromise;
