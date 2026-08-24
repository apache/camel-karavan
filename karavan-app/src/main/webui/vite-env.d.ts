/// <reference types="vite/client" />
declare module '*.yaml' {
    const content: any;
    export default content;
}

declare module '*.yml' {
    const content: any;
    export default content;
}