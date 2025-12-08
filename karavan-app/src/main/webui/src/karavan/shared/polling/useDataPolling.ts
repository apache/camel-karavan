// useDataPolling.ts

import {useCallback, useEffect, useMemo} from 'react';
import {startPolling, stopPolling} from './PollingManager'; // Assuming PollingManager has been implemented

/**
 * Custom hook to manage periodic data fetching with a DYNAMIC interval.
 * @param pollingKey A unique string identifier (e.g., 'metrics').
 * @param fetchAction The function that performs the data fetch.
 * @param interval The current polling interval in milliseconds (can change).
 */
export const useDataPolling = (
    pollingKey: string,
    fetchAction: () => void,
    interval: number
): void => {

    // The polling ID remains constant, based only on the key.
    const pollingId = useMemo(() => pollingKey, [pollingKey]);
    const stableFetchAction = useCallback(fetchAction, [fetchAction]);

    useEffect(() => {
        // Start polling (or restart if interval has changed)
        startPolling(pollingId, stableFetchAction, interval);

        // Cleanup: Runs when the component unmounts OR if dependencies change.
        return () => {
            // When dependencies (like interval) change, the OLD timer is stopped
            // and the NEW one is started immediately in the next step.
            stopPolling(pollingId);
        };

    }, [pollingId, stableFetchAction, interval]); // Interval is now a dependency
};