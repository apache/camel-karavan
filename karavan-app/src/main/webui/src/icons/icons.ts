// icons.ts
const icons = import.meta.glob('./*.svg', {
    eager: true,
    import: 'default',
    query: '?react', // ensures they are React components
}) as Record<string, React.FC<React.SVGProps<SVGSVGElement>>>;

// Map "./json.svg" → "json"
export const Icons = Object.fromEntries(
    Object.entries(icons).map(([path, component]) => {
        const name = path.replace('./', '').replace('.svg', '');
        return [name, component];
    })
);
