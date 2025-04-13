"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThrottledConcurrentQueue = void 0;
const lodash_1 = require("lodash");
const circular_buffer_1 = __importDefault(require("mnemonist/circular-buffer"));
const p_defer_1 = __importDefault(require("p-defer"));
/**
 * A queue that executes promises with a max throughput, and optionally max
 * concurrency.
 */
class ThrottledConcurrentQueue {
    constructor(config) {
        var _a;
        /**
         * Queue of tasks to execute. Added to the front, popped off the back.
         */
        this.taskQueue = [];
        /**
         * Amount of tasks being executed right now.
         */
        this.concurrency = 0;
        this.invocationIntervalMs = config.invocationIntervalMs;
        this.maxConcurrency = (_a = config.maxConcurrency) !== null && _a !== void 0 ? _a : Number.POSITIVE_INFINITY;
        this.executionTimestamps = new circular_buffer_1.default(Array, config.maxInvocationsPerIntervalMs);
        if (config.maxInvocationsPerIntervalMs <= 0) {
            throw new Error('must allow at least one invocation per interval');
        }
        if (this.invocationIntervalMs <= 0) {
            throw new Error('invocation interval must be positive');
        }
        if (this.maxConcurrency <= 0) {
            throw new Error('max concurrency must be positive');
        }
    }
    /**
     * Adds a task to be executed at some point in the future. Returns a promise that resolves when
     * the task finishes successfully, and rejects when there is an error.
     *
     * @param start a function that returns a promise representing the task
     * @param metadata optional data to be associated with the task
     */
    add(start, metadata) {
        const { resolve, reject, promise } = (0, p_defer_1.default)();
        this.taskQueue.unshift({
            resolve: resolve,
            reject,
            start,
            metadata,
        });
        setTimeout(() => {
            this.executeNextTasks();
        }, 0);
        return promise;
    }
    /**
     * Remove one task from the queue. For this to work, you have to provide
     * the optional metadata during queue construction and addition of tasks.
     *
     * Throws an error if no matching task is found.
     * @param predicate Should return true for the task you would like removed.
     */
    remove(predicate) {
        const foundIndex = (0, lodash_1.findIndex)(this.taskQueue, (task) => predicate(task.metadata));
        if (foundIndex === -1)
            throw new Error(`specified task was not found`);
        return this.taskQueue.splice(foundIndex, 1)[0];
    }
    /**
     * Prioritize a currently queued task so that it is up next for execution.
     * For this to work, you have to provide the optional metadata during
     * queue construction and addition of tasks.
     *
     * Prioritized tasks are executed in FILO order.
     *
     * Throws an error if no matching task is found.
     * @param predicate Should return true for the task you would like prioritized.
     */
    prioritize(predicate) {
        const foundIndex = (0, lodash_1.findIndex)(this.taskQueue, (task) => predicate(task.metadata));
        if (foundIndex === -1)
            throw new Error(`specified task was not found`);
        const foundTask = this.taskQueue.splice(foundIndex, 1)[0];
        this.taskQueue.push(foundTask);
        return foundTask;
    }
    /**
     * Returns the amount of queued items, not including the ones that are being executed at this
     * moment.
     */
    size() {
        return this.taskQueue.length;
    }
    /**
     * Runs tasks until it's at either the throttle or concurrency limit. If there are more tasks to
     * be executed after that, schedules itself to execute again at the soonest possible moment.
     */
    async executeNextTasks() {
        this.deleteOutdatedExecutionTimestamps();
        const tasksToExecute = Math.min(this.throttleQuotaRemaining(), this.concurrencyQuotaRemaining(), this.taskQueue.length);
        for (let i = 0; i < tasksToExecute; i++) {
            this.next().then(this.executeNextTasks.bind(this));
        }
        const nextPossibleExecution = this.nextPossibleExecution();
        if (this.taskQueue.length > 0 && nextPossibleExecution) {
            if (this.executionTimeout) {
                clearTimeout(this.executionTimeout);
            }
            this.executionTimeout = setTimeout(this.executeNextTasks.bind(this), nextPossibleExecution);
        }
    }
    /**
     * Returns the soonest possible time from now we could execute another task without going over the
     * throttle limit.
     */
    nextPossibleExecution() {
        const oldestExecution = this.executionTimestamps.peekFirst();
        if (!oldestExecution || this.concurrencyQuotaRemaining() === 0) {
            return undefined;
        }
        return Date.now() - oldestExecution + this.invocationIntervalMs;
    }
    /**
     * At this moment, how many more tasks we could execute without exceeding the concurrency quota.
     */
    concurrencyQuotaRemaining() {
        return this.maxConcurrency - this.concurrency;
    }
    /**
     * At this moment, how many more tasks we could execute without exceeding the throttle quota.
     */
    throttleQuotaRemaining() {
        return this.executionTimestamps.capacity - this.executionTimestamps.size;
    }
    /**
     * Removes all task execution timestamps that are older than [[this.invocationIntervalMs]],
     * because those invocations have no bearing on whether or not we can execute another task.
     */
    deleteOutdatedExecutionTimestamps() {
        const now = Date.now();
        let oldestInvocation = this.executionTimestamps.peekFirst();
        while (oldestInvocation && oldestInvocation < now - this.invocationIntervalMs) {
            this.executionTimestamps.shift();
            oldestInvocation = this.executionTimestamps.peekFirst();
        }
    }
    /**
     * If there is a next task to execute, executes it. Records the time of execution in
     * [[executionTimestamps]]. Increments and decrements concurrency counter. Neither throttles nor
     * limits concurrency.
     */
    async next() {
        const task = this.taskQueue.pop();
        if (!task) {
            return;
        }
        this.executionTimestamps.push(Date.now());
        this.concurrency++;
        try {
            task.resolve(await task.start());
        }
        catch (e) {
            task.reject(e);
        }
        this.concurrency--;
    }
}
exports.ThrottledConcurrentQueue = ThrottledConcurrentQueue;
//# sourceMappingURL=ThrottledConcurrentQueue.js.map