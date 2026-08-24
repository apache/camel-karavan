// PollingManager.ts (Central utility file)

// Map to store running timers: Key is the unique polling ID, Value is the setInterval ID
const activeTimers = new Map<string, number>();
// Map to count consumers: Key is the unique polling ID, Value is the number of active components
const consumerCounts = new Map<string, number>();

/**
 * Starts polling for a unique ID if it's not already running.
 */
export const startPolling = (
    pollingId: string,
    fetchAction: () => void,
    interval: number
): void => {
    // 1. Increment consumer count
    const count = (consumerCounts.get(pollingId) || 0) + 1;
    consumerCounts.set(pollingId, count);

    // 2. Start the timer ONLY if this is the first consumer
    if (count === 1) {
        // Execute the first fetch immediately
        fetchAction();

        // Set up the interval
        const timerId = window.setInterval(() => {
            fetchAction();
        }, interval);

        activeTimers.set(pollingId, timerId);
        console.log(`[PollingManager] STARTED polling for ${pollingId}. Count: 1`);
    } else {
        console.log(`[PollingManager] Polling already active for ${pollingId}. Count: ${count}`);
    }
};

/**
 * Decrements the consumer count and stops the timer if the count reaches zero.
 */
export const stopPolling = (pollingId: string): void => {
    // 1. Decrement consumer count
    const count = (consumerCounts.get(pollingId) || 1) - 1;
    consumerCounts.set(pollingId, count);

    // 2. Stop the timer ONLY if the count hits zero
    if (count <= 0) {
        const timerId = activeTimers.get(pollingId);
        if (timerId !== undefined) {
            window.clearInterval(timerId);
            activeTimers.delete(pollingId);
            consumerCounts.delete(pollingId); // Clean up the count map
            console.log(`[PollingManager] STOPPED polling for ${pollingId}. Count: 0`);
        }
    } else {
        console.log(`[PollingManager] Consumer left ${pollingId}. Remaining count: ${count}`);
    }
};