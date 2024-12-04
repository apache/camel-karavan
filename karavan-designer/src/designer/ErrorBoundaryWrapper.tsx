import React, {ReactNode} from "react";

export interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundaryWrapper extends React.Component<{
    children: ReactNode;
    onError: (error: Error) => void;
}> {
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Handle error (logging, etc.)
        console.error("Error caught in ErrorBoundary:", error, errorInfo);
        this.props.onError(error);
    }

    render() {
        return this.props.children;
    }
}