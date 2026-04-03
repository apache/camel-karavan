import React from "react";

export function TryOutIcon({ className = '' }: { className?: string } = {}) {
    return (
        <svg viewBox="0 0 512 512" className={`icon tryout-icon ${className}`}>
            <circle cx={256} cy={256} r={200} fill="white" stroke="#0066cc" strokeWidth="32" />
            <path
                fill="rgb(219, 91, 4)"
                d="M230.839 128s95.484 64 84.266 152c0 0 32.047-8 23.438-60.938 0 0 46.234 44.609 45.453 84.938-.641 32.766-41.641 80-118.75 80 0 0 69.531-62.188-22.344-140.875 0 0-84.984 83.844-28.906 140.875 0 0-113.078-28.766-79.906-100.797 33.171-72.047 105.733-78.406 96.749-155.203z"
            />
        </svg>
    );
}
