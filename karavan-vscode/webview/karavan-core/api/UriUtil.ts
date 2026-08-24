interface ParsedComponent {
    componentName: string;
    params: Record<string, string>;
}

/**
 * Parses the custom component string format into a structured object.
 */
function parseComponentString(str: string): ParsedComponent {
    const colonIndex = str.indexOf(':');
    let componentName = str;
    let queryString = '';

    if (colonIndex !== -1) {
        componentName = str.slice(0, colonIndex);
        queryString = str.slice(colonIndex + 1);
    }

    const params: Record<string, string> = {};
    if (queryString) {
        // Split by '&' to separate parameters
        const pairs = queryString.split('&');
        for (const pair of pairs) {
            const eqIndex = pair.indexOf('=');
            if (eqIndex !== -1) {
                params[pair.slice(0, eqIndex)] = pair.slice(eqIndex + 1);
            } else {
                params[pair] = ''; // Handle keys missing an '='
            }
        }
    }

    return { componentName, params };
}

/**
 * Recursively checks if a value matches a wildcard pattern.
 * Supports '*' (exactly one word) and '#' (zero or more words).
 */
function matchWildcard(pattern: string, value: string): boolean {
    if (pattern === value) return true;

    const pTokens = pattern.split('.');
    const vTokens = value.split('.');

    function matchTokens(pi: number, vi: number): boolean {
        // If both reached the end, it's a match
        if (pi === pTokens.length && vi === vTokens.length) return true;

        // If pattern ended but value didn't, no match
        if (pi === pTokens.length) return false;

        // Handle Hash (#) - Matches 0 or more words
        if (pTokens[pi] === '#') {
            // Option 1: # matches 0 words (move pattern forward, keep value index)
            if (matchTokens(pi + 1, vi)) return true;

            // Option 2: # matches 1 or more words (consume value token, keep pattern at #)
            if (vi < vTokens.length && matchTokens(pi, vi + 1)) return true;

            return false;
        }

        // If value ended but pattern still needs exact matches or '*', no match
        if (vi === vTokens.length) return false;

        // Handle Asterisk (*) - Matches exactly 1 word, or exact token match
        if (pTokens[pi] === '*' || pTokens[pi] === vTokens[vi]) {
            return matchTokens(pi + 1, vi + 1);
        }

        return false;
    }

    return matchTokens(0, 0);
}

/**
 * Compares two component strings to check if they are equal based on the rules.
 */
export function compareUri(str1: string, str2: string): boolean {
    const parsed1 = parseComponentString(str1);
    const parsed2 = parseComponentString(str2);

    // 1. Ensure the component names match exactly
    if (parsed1.componentName !== parsed2.componentName) {
        return false;
    }

    const keys1 = Object.keys(parsed1.params);
    const keys2 = Object.keys(parsed2.params);

    // 2. Ensure they have the exact same number of parameters
    if (keys1.length !== keys2.length) {
        return false;
    }

    // 3. Ensure all parameter keys match and their values are equal/match wildcards
    for (const key of keys1) {
        // Must contain the exact same keys regardless of sorting order
        if (!Object.prototype.hasOwnProperty.call(parsed2.params, key)) {
            return false;
        }

        const val1 = parsed1.params[key];
        const val2 = parsed2.params[key];

        // Check if val1 acts as a pattern for val2, OR if val2 acts as a pattern for val1
        const isMatch = matchWildcard(val1, val2) || matchWildcard(val2, val1);

        if (!isMatch) {
            return false;
        }
    }

    return true;
}