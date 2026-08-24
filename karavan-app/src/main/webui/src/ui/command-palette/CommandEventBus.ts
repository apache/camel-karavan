import {Subject} from 'rxjs';
import {useEffect} from "react";

const cmdKEvents = new Subject<void>();

export const CommandEventBus = {
    sendCmdK: () => cmdKEvents.next(),
    onCmdK: () => cmdKEvents.asObservable(),
};

export function useGlobalShortcuts() {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                CommandEventBus.sendCmdK();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);
}