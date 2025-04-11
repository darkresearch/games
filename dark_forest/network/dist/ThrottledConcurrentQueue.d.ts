/**
 * Represents a task that has been queued for later execution.
 */
interface QueuedTask<T, U> {
    /**
     * This is called when the task succeeds.
     */
    resolve: (t: T) => void;
    /**
     * This is called when the task fails.
     */
    reject: (e: Error | undefined) => void;
    /**
     * Starts the task.
     */
    start: () => Promise<T>;
    /**
     * Optional data to be associated with the task.
     * Currently only used when finding a task during removal.
     */
    metadata: U | undefined;
}
/**
 * Let's keep things flexible by keeping this type small.
 */
export interface Queue {
    add<T>(start: () => Promise<T>): Promise<T>;
    size: () => number;
}
export interface ConcurrentQueueConfiguration {
    maxInvocationsPerIntervalMs: number;
    invocationIntervalMs: number;
    maxConcurrency?: number;
}
/**
 * A queue that executes promises with a max throughput, and optionally max
 * concurrency.
 */
export declare class ThrottledConcurrentQueue<U = unknown> implements Queue {
    /**
     * The interval during which we only allow a certain maximum amount of tasks
     * to be executed.
     */
    private readonly invocationIntervalMs;
    /**
     * Maximum amount of tasks that can be executing at the same time.
     */
    private readonly maxConcurrency;
    /**
     * Queue of tasks to execute. Added to the front, popped off the back.
     */
    private taskQueue;
    /**
     * Each time a task is executed, record the start of its execution time.
     * Execution timestamps are removed when they become outdated. Used for
     * keeping the amount of executions under the throttle limit.
     */
    private executionTimestamps;
    /**
     * Amount of tasks being executed right now.
     */
    private concurrency;
    /**
     * When we schedule an attempt at executing another task in the future,
     * we don't want to schedule it more than once. Therefore, we keep track
     * of this scheduled attempt.
     */
    private executionTimeout;
    constructor(config: ConcurrentQueueConfiguration);
    /**
     * Adds a task to be executed at some point in the future. Returns a promise that resolves when
     * the task finishes successfully, and rejects when there is an error.
     *
     * @param start a function that returns a promise representing the task
     * @param metadata optional data to be associated with the task
     */
    add<T>(start: () => Promise<T>, metadata?: U): Promise<T>;
    /**
     * Remove one task from the queue. For this to work, you have to provide
     * the optional metadata during queue construction and addition of tasks.
     *
     * Throws an error if no matching task is found.
     * @param predicate Should return true for the task you would like removed.
     */
    remove(predicate: (metadata: U | undefined) => boolean): QueuedTask<unknown, U>;
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
    prioritize(predicate: (metadata: U | undefined) => boolean): QueuedTask<unknown, U>;
    /**
     * Returns the amount of queued items, not including the ones that are being executed at this
     * moment.
     */
    size(): number;
    /**
     * Runs tasks until it's at either the throttle or concurrency limit. If there are more tasks to
     * be executed after that, schedules itself to execute again at the soonest possible moment.
     */
    private executeNextTasks;
    /**
     * Returns the soonest possible time from now we could execute another task without going over the
     * throttle limit.
     */
    private nextPossibleExecution;
    /**
     * At this moment, how many more tasks we could execute without exceeding the concurrency quota.
     */
    private concurrencyQuotaRemaining;
    /**
     * At this moment, how many more tasks we could execute without exceeding the throttle quota.
     */
    private throttleQuotaRemaining;
    /**
     * Removes all task execution timestamps that are older than [[this.invocationIntervalMs]],
     * because those invocations have no bearing on whether or not we can execute another task.
     */
    private deleteOutdatedExecutionTimestamps;
    /**
     * If there is a next task to execute, executes it. Records the time of execution in
     * [[executionTimestamps]]. Increments and decrements concurrency counter. Neither throttles nor
     * limits concurrency.
     */
    private next;
}
export {};
