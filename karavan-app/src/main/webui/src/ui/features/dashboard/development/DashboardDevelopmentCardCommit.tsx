import React, { useState, useEffect } from 'react';
import { SystemCommit } from "@stores/CommitsStore";
import { 
    Button, 
    Content, 
    HelperText, 
    HelperTextItem, 
    Label, 
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

export function DashboardDevelopmentCardCommit(props: Props): React.ReactElement {
    const { commit } = props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [commitDiff, setCommitDiff] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    
    const { usersActivities } = useActivityStore();
    const userHeartbeat = usersActivities?.HEARTBEAT?.[commit.authorName];
    const alive = userHeartbeat !== undefined;
    const commitId = commit.id?.substring((commit.id?.length - 6) || 0);
    const timeAgo = new TimeAgo('en-US');
    
    const rawProjectId = commit?.projectIds?.at(0) || "";
    const projectsCount = commit?.projectIds?.length || 0;
    const projectLabel = rawProjectId + (projectsCount > 1 ? ` (+${projectsCount - 1})` : "");

    const handleToggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };

    useEffect(() => {
        if (isModalOpen && commit.id && rawProjectId) {
            setIsLoading(true);
            KaravanApi.getCommitDiff(rawProjectId, commit.id, (diff) => {
                setCommitDiff(diff);
                setIsLoading(false);
            });
        }
    }, [isModalOpen, commit.id, rawProjectId]);

    return (
        <React.Fragment>
            <ProgressStep
                className={"commit-progress-step"}
                variant={alive ? "success" : "info"}
                icon={
                    <div onClick={handleToggleModal} style={{ cursor: 'pointer' }}>
                        <Commit className={"carbon"} style={{ height: "20px", width: "20px" }} />
                    </div>
                }
                id={commit.id}
                titleId={"title-" + commit.id}
                aria-label={"commit-" + commit.id}
            >
                <HelperText className={"commit-card"}>
                    <HelperTextItem>
                        {rawProjectId && <Button variant={"link"} isInline>{projectLabel}</Button>}
                    </HelperTextItem>
                    <HelperTextItem>
                        <div onClick={handleToggleModal} style={{ cursor: 'pointer', color: '#0066cc', fontWeight: 500 }}>
                            {commit.message}
                        </div>
                    </HelperTextItem>
                </HelperText>
            </ProgressStep>

            <Modal
                title={`Dettagli Commit: ${commitId}`}
                isOpen={isModalOpen}
                onClose={handleToggleModal}
                variant={ModalVariant.medium}
            >
                <div style={{ padding: '0 20px' }}>
                    <Content>
                        <div style={{ marginBottom: '10px' }}>
                            <p><strong>Messaggio:</strong> {commit.message}</p>
                            <p><strong>Autore:</strong> {commit.authorName} ({commit.authorEmail})</p>
                        </div>
                        
                        <div style={{ 
                            backgroundColor: '#151515', 
                            padding: '15px', 
                            borderRadius: '4px', 
                            marginTop: '10px',
                            maxHeight: '450px', 
                            overflowY: 'auto',
                            border: '1px solid #333'
                        }}>
                            {isLoading ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#39d353' }}>
                                    <Spinner size="md" /> Fetching changes from the repository...
                                </div>
                            ) : commitDiff ? (
                                commitDiff.split('\n').map((line, i) => {
                                    let color = '#d4d4d4'; 
                                    let bgColor = 'transparent';
                                    
                                    if (line.startsWith('+')) {
                                        color = '#3fb950'; 
                                        bgColor = 'rgba(46, 160, 67, 0.15)'; 
                                    } else if (line.startsWith('-')) {
                                        color = '#f85149'; 
                                        bgColor = 'rgba(248, 81, 73, 0.15)';
                                    } else if (line.startsWith('@@')) {
                                        color = '#8b949e'; 
                                        bgColor = 'rgba(56, 139, 253, 0.15)';
                                    }
                                    
                                    return (
                                        <div key={i} style={{ 
                                            color, 
                                            backgroundColor: bgColor,
                                            fontFamily: 'monospace', 
                                            whiteSpace: 'pre-wrap', 
                                            fontSize: '12px',
                                            paddingLeft: '5px'
                                        }}>
                                            {line}
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{ color: '#8b949e' }}>No changes detected or binary file.</div>
                            )}
                        </div>
                    </Content>
                </div>

                <div style={{ marginTop: '20px', padding: '10px 20px', textAlign: 'right' }}>
                    <Button key="close" variant="primary" onClick={handleToggleModal}>
                        Chiudi
                    </Button>
                </div>
            </Modal>
        </React.Fragment>
    );
}