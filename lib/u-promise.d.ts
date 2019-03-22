export declare class UPromise<T> {
    static execFn(fn: Function, context: Object | null, ...params: any[]): Promise<any>;
    static delayedPromise<X>(ms: number, fulfillWith?: X): Promise<X>;
    private static getFn;
    private fnResolve;
    private fnReject;
    readonly promise: Promise<T>;
    constructor();
    execute(cb: (promise: UPromise<T>) => void): UPromise<T>;
    resolve(result: T): void;
    reject(err: Error): void;
    private cleanup;
}
