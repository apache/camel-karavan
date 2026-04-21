import React, { useMemo } from 'react';

const getLineStyle = (line: string) => {
    if (line.startsWith('+')) return { color: '#1a7f37', backgroundColor: '#dafbe1' };
    if (line.startsWith('-')) return { color: '#d1242f', backgroundColor: '#ffebe9' };
    if (line.startsWith('@@')) return { color: '#0550ae', backgroundColor: '#ddf4ff' };
    if (line.startsWith('diff') || line.startsWith('index') || line.startsWith('---') || line.startsWith('+++')) 
        return { color: '#6e7781', backgroundColor: '#f6f8fa' };
    return { color: '#24292f', backgroundColor: '#ffffff' };
};

interface Props {
    diff?: string;
}

export const CommitDiffViewer = React.memo(({ diff }: Props) => {
    const lines = useMemo(() => diff ? diff.split('\n') : [], [diff]);
    
    if (lines.length === 0) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>No changes detected.</div>;
    }

    return (
        <div style={{ backgroundColor: '#ffffff', maxHeight: '450px', overflowY: 'auto' }}>
            {lines.map((line, i) => (
                <div key={i} style={{ 
                    ...getLineStyle(line),
                    fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: '12px',
                    lineHeight: '1.6', padding: '0 12px'
                }}>
                    {line || " "}
                </div>
            ))}
        </div>
    );
});