import React, { useState, useEffect, useMemo } from 'react';
import { SystemCommit } from "@stores/CommitsStore";
import { 
    Button, 
    Content, 
    HelperText, 
    HelperTextItem, 
    ProgressStep, 
    Modal, 
    ModalVariant,
    Spinner
} from "@patternfly/react-core";
import TimeAgo from "javascript-time-ago";
import { Commit } from "@carbon/icons-react";
import { useActivityStore } from "@stores/ActivityStore";
import { KaravanApi } from "../../../api/KaravanApi";

interface Props {
    commit: SystemCommit
}

export function DashboardDevelopmentCardCommit({ commit }: Props): React.ReactElement {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [commitDiff, setCommitDiff] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    
    const { usersActivities } = useActivityStore();
    const userHeartbeat = usersActivities?.HEARTBEAT?.[commit.authorName];
    const alive = userHeartbeat !== undefined;
    
    const commitIdShort = useMemo(() => commit.id?.substring(0, 7), [commit.id]);
    const timeAgo = useMemo(() => new TimeAgo('en-US'), []);
    const rawProjectId = commit?.projectIds?.at(0) || "";
    const projectLabel = useMemo(() => {
        const count = commit?.projectIds?.length || 0;
        return rawProjectId + (count > 1 ? ` (+${count - 1})` : "");
    }, [commit.projectIds, rawProjectId]);

    const handleToggleModal = () => setIsModalOpen(!isModalOpen);

    useEffect(() => {
        if (isModalOpen && commit.id && rawProjectId) {
            setIsLoading(true);
             KaravanApi.getCommitDiff(rawProjectId, commit.id, (diff) => {
                setCommitDiff(diff);
                setIsLoading(false);
            });
        }
    }, [isModalOpen, commit.id, rawProjectId]);

    const getLineStyle = (line: string) => {
        if (line.startsWith('+')) return { color: '#1a7f37', backgroundColor: '#dafbe1' };
        if (line.startsWith('-')) return { color: '#d1242f', backgroundColor: '#ffebe9' };
        if (line.startsWith('@@')) return { color: '#0550ae', backgroundColor: '#ddf4ff' };
        if (line.startsWith('diff') || line.startsWith('index') || line.startsWith('---') || line.startsWith('+++')) 
            return { color: '#6e7781', backgroundColor: '#f6f8fa' };
        return { color: '#24292f', backgroundColor: '#ffffff' };
    };

    return (
        <React.Fragment>
            <ProgressStep
                className="commit-progress-step"
                variant={alive ? "success" : "info"}
                icon={<div onClick={handleToggleModal} style={{ cursor: 'pointer' }}><Commit size={20} /></div>}
                id={commit.id}
                titleId={`title-${commit.id}`}
            >
                <HelperText className="commit-card">
                    <HelperTextItem>
                        {rawProjectId && <Button variant="link" isInline style={{ fontSize: '0.85rem' }}>{projectLabel}</Button>}
                    </HelperTextItem>
                    <HelperTextItem>
                        <div onClick={handleToggleModal} style={{ cursor: 'pointer', color: '#0066cc', fontWeight: 600 }}>
                            {commit.message}
                        </div>
                    </HelperTextItem>
                </HelperText>
            </ProgressStep>

            <Modal
                title={`Commit Details: ${commitIdShort}`}
                isOpen={isModalOpen}
                onClose={handleToggleModal}
                variant={ModalVariant.medium}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ padding: '0 10px' }}>
                        <p style={{ fontSize: '1.1rem', marginBottom: '4px' }}><strong>{commit.message}</strong></p>
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>
                            👤 {commit.authorName} • 📅 {timeAgo.format(new Date(commit.commitTime))}
                        </div>
                    </div>
                    
                    <div style={{ 
                        border: '1px solid #d0d7de', 
                        borderRadius: '6px', 
                        overflow: 'hidden'
                    }}>
                        <div style={{ 
                            backgroundColor: '#f6f8fa', 
                            padding: '8px 12px', 
                            borderBottom: '1px solid #d0d7de',
                            fontSize: '0.8rem', color: '#57606a', fontWeight: 600
                        }}>
                            {isLoading ? "Fetching..." : "Unified Diff View"}
                        </div>
                        
                        <div style={{ backgroundColor: '#ffffff', maxHeight: '450px', overflowY: 'auto' }}>
                            {isLoading ? (
                                <div style={{ padding: '40px', textAlign: 'center' }}><Spinner size="lg" /></div>
                            ) : commitDiff ? (
                                commitDiff.split('\n').map((line, i) => (
                                    <div key={i} style={{ 
                                        ...getLineStyle(line),
                                        fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: '12px',
                                        lineHeight: '1.6', padding: '0 12px'
                                    }}>
                                        {line || " "}
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: '20px', textAlign: 'center' }}>No changes detected.</div>
                            )}
                        </div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                        <Button variant="primary" onClick={handleToggleModal}>Chiudi</Button>
                    </div>
                </div>
            </Modal>
        </React.Fragment>
    );
}