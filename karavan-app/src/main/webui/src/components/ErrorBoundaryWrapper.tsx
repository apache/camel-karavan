import React, {ReactNode} from "react";
import {Alert} from "@patternfly/react-core";

export interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

interface ErrorBoundaryProps {
    children: ReactNode;
    onError: (error: Error) => void;
}

export class ErrorBoundaryWrapper extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Handle error (logging, etc.)
        console.error("Error caught in ErrorBoundary:", error, errorInfo);
        this.props.onError(error);
    }

    render() {
        if (this.state.hasError) {
            return <Alert title={`Error in Element with key: ${(this.props.children as any)?.key}`} variant='danger' style={{margin: 8}}>Something went wrong: {this.state.error?.message}</Alert>;
        }
        return this.props.children;
    }
}
