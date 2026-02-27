import {useEffect, useMemo, useRef} from "react";
import {startPolling, stopPolling} from "./PollingManager";

export const useDataPolling = (
    pollingKey: string,
    fetchAction: () => void,
    interval: number,
    dependencies: any[] = []
): void => {
    const pollingId = useMemo(() => pollingKey, [pollingKey]);

    // 1. Store the fetchAction in a mutable ref.
    // This allows the timer to always call the latest version of the action
    // without being listed as a dependency in the useEffect below.
    const fetchRef = useRef(fetchAction);

    // 2. Update the ref every time the component renders with a new fetchAction.
    useEffect(() => {
        fetchRef.current = fetchAction;
    }, [fetchAction]);

    // 3. Manage the PollingManager lifecycle.
    useEffect(() => {
        // We create a wrapper that points to the current ref value.
        // This wrapper is what the PollingManager's setInterval will execute.
        const timerRunner = () => {
            fetchRef.current();
        };

        // Start (or increment reference count)
        startPolling(pollingId, timerRunner, interval);

        // Stop (or decrement reference count)
        return () => {
            stopPolling(pollingId);
        };
    }, [pollingId, interval, ...dependencies]);
    // 🌟 NOTICE: fetchAction is NOT a dependency here.
    // This prevents the "constant start/stop" cycle.
};