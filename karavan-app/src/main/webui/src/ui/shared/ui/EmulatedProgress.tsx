import React, {useEffect, useRef, useState} from 'react';
import {Progress, ProgressMeasureLocation, ProgressSize} from '@patternfly/react-core';

export interface EmulatedProgressProps {
    /** Average time (in seconds) the progress is expected to take */
    averageTime: number;
}

export const EmulatedProgress: React.FC<EmulatedProgressProps> = ({ averageTime }) => {
    const [progress, setProgress] = useState<number>(0);
    const requestRef = useRef<number>(null);
    const startTimeRef = useRef<number>(0);

    useEffect(() => {
        // Record the start time when the component mounts
        startTimeRef.current = Date.now();

        const animate = () => {
            // Calculate elapsed time in seconds
            const elapsedSec = (Date.now() - startTimeRef.current) / 1000;

            // We use an exponential decay function to emulate asymptotic progress.
            // By dividing averageTime by 2, the progress will reach ~86.5% right at the averageTime mark.
            // It will continue to creep closer to 100% forever, but slower and slower.
            const timeConstant = averageTime / 2;
            const calculatedProgress = 100 * (1 - Math.exp(-elapsedSec / timeConstant));

            // Cap at 99.9% to ensure floating-point rounding never accidentally hits 100%
            setProgress(Math.min(calculatedProgress, 99.9));

            // Loop the animation
            requestRef.current = requestAnimationFrame(animate);
        };

        // Start the animation loop
        requestRef.current = requestAnimationFrame(animate);

        // Cleanup loop on unmount
        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [averageTime]);

    return (
        <Progress
            value={progress}
            size={ProgressSize.sm}
            measureLocation={ProgressMeasureLocation.none}
            style={{ flex: 1 }}
        />
    );
};