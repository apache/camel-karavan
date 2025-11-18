export const GROOVY_FILE_PREFIX = {
    TRANSFORMATIONS: 'tr',
    DATA_MODELS: 'dm',
    FUNCTIONS: 'fn',
    CLASS: 'cl',
    SCRIPT: 'sc',
} as const;

export type Kind = keyof typeof GROOVY_FILE_PREFIX;

function toPascalCase(input: string): string {
    return input
        .replace(/(^|_|-|\s)+(.)/g, (_, __, c) => c.toUpperCase());
}

export function generateGroovyFilename(kind: Kind, name: string): string {
    switch (kind) {
        case 'CLASS':
            return toPascalCase(name) + '.groovy'; // e.g., order_service -> OrderService.groovy
        case 'TRANSFORMATIONS':
            return `${GROOVY_FILE_PREFIX.TRANSFORMATIONS}_${name}.groovy`;
        case 'FUNCTIONS':
            return `${GROOVY_FILE_PREFIX.FUNCTIONS}_${name}.groovy`;
        case 'DATA_MODELS':
            return `${GROOVY_FILE_PREFIX.DATA_MODELS}_${name}.groovy`;
        case 'SCRIPT':
            return `${GROOVY_FILE_PREFIX.SCRIPT}_${name}.groovy`;
        default:
            throw new Error(`Unknown kind: ${kind}`);
    }
}
