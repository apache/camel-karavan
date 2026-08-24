// Helper function to escape special characters for the regex
import React, {ReactNode} from "react";

export const escapeRegExp = (text: string) => {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Helper function to highlight filter keywords in a given text
export const highlightText = (text: string, filter: string): ReactNode => {
    if (!filter || !filter.trim()) return text;

    // Split filter into individual words and remove empty strings
    const keywords = filter.split(/\s+/).filter(Boolean);
    if (keywords.length === 0) return text;

    // Create a regex to match any of the keywords (case-insensitive)
    const escapedKeywords = keywords.map(escapeRegExp);
    const regex = new RegExp(`(${escapedKeywords.join('|')})`, 'gi');

    // Split text by the regex (the capturing group '()' ensures matches are kept in the array)
    const parts = text.split(regex);

    return parts.map((part, i) => {
        // If the current part matches any of our keywords, wrap it in a span with the special class
        const isMatch = keywords.some(kw => kw.toLowerCase() === part.toLowerCase());
        return isMatch ? (
            <span key={i} className="highlight-match">{part}</span>
        ) : (
            <React.Fragment key={i}>{part}</React.Fragment>
        );
    });
};