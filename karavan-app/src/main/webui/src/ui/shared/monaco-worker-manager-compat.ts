import type {IDisposable, Uri} from 'monaco-editor';

/**
 * Drop-in replacement for `monaco-worker-manager`, aliased in vite.config.ts.
 *
 * monaco-editor 0.56 reworked `monaco.editor.createWebWorker`: it used to accept
 * `{moduleId, label, createData}` and spawn the worker itself, and now it takes an already
 * constructed `{worker}`. monaco-worker-manager 2.0.1 (the last release, pulled in by monaco-yaml)
 * still calls the old shape, so the yaml language service would silently fail to start.
 *
 * This reimplements the same manager against the new API, including the two-message handshake that
 * monaco performs internally: the first message wakes the worker bootstrap, the second carries
 * `createData` into the language service.
 *
 * Remove this once monaco-worker-manager (or monaco-yaml) supports monaco-editor 0.56.
 */

export type PromisifiedWorker<T> = {
    [K in keyof T]: T[K] extends (...args: infer A) => infer R ? (...args: A) => Promise<Awaited<R>> : never;
};

export type WorkerGetter<T> = (...args: Uri[]) => Promise<PromisifiedWorker<T>>;

export interface WorkerManagerOptions<C> {
    createData?: C;
    /** How often to check whether the worker went idle, in milliseconds. */
    interval?: number;
    /** Passed to MonacoEnvironment.getWorker to pick the right worker bundle. */
    label: string;
    /** Kept for API compatibility; monaco 0.56 no longer resolves workers by module id. */
    moduleId: string;
    /** The worker is stopped after this much idle time. Set to Infinity to never stop it. */
    stopWhenIdleFor?: number;
}

export interface WorkerManager<T, C = unknown> extends IDisposable {
    getWorker: WorkerGetter<T>;
    updateCreateData: (createData: C) => void;
}

type MonacoModule = Pick<typeof import('monaco-editor'), 'editor'>;

function spawnWorker(label: string, createData: unknown): Promise<Worker> {
    const getWorker = self.MonacoEnvironment?.getWorker;
    if (!getWorker) {
        throw new Error('MonacoEnvironment.getWorker is not configured — see @shared/monaco-setup');
    }
    return Promise.resolve(getWorker('workerMain.js', label)).then(worker => {
        worker.postMessage('ignore');
        worker.postMessage(createData);
        return worker;
    });
}

export function createWorkerManager<T, C = unknown>(
    monaco: MonacoModule,
    options: WorkerManagerOptions<C>,
): WorkerManager<T, C> {

    let {createData, interval = 30_000, label, stopWhenIdleFor = 120_000} = options;
    let worker: import('monaco-editor').editor.MonacoWebWorker<PromisifiedWorker<T>> | undefined;
    let lastUsedTime = 0;
    let disposed = false;

    const stopWorker = () => {
        worker?.dispose();
        worker = undefined;
    };

    const intervalId = setInterval(() => {
        if (worker && Date.now() - lastUsedTime > stopWhenIdleFor) {
            stopWorker();
        }
    }, interval);

    return {
        dispose() {
            disposed = true;
            clearInterval(intervalId);
            stopWorker();
        },
        getWorker(...resources: Uri[]) {
            if (disposed) {
                throw new Error('Worker manager has been disposed');
            }
            lastUsedTime = Date.now();
            if (!worker) {
                worker = monaco.editor.createWebWorker<PromisifiedWorker<T>>({
                    worker: spawnWorker(label, createData),
                });
            }
            return worker.withSyncedResources(resources);
        },
        updateCreateData(newCreateData: C) {
            createData = newCreateData;
            stopWorker();
        },
    };
}