import React, {useEffect, useState} from 'react';
import {
    Alert,
    Button,
    capitalize,
    ClipboardCopy,
    Content,
    Form,
    FormGroup,
    FormHelperText,
    Label,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    ModalVariant,
    TextInput,
    ToggleGroup,
    ToggleGroupItem,
    Tooltip,
    TooltipPosition
} from '@patternfly/react-core';
import {useFilesStore, useFileStore, useProjectsStore, useProjectStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {ProjectService} from "@services/ProjectService";
import {CodeBranchIcon, SyncAltIcon} from "@patternfly/react-icons";
import {getShortCommit, isEmpty} from "@utils/StringUtils";
import {FileSearchToolbarItem} from "../FileSearchToolbarItem";
import {useCommitsStore} from "@stores/CommitsStore";
import {BUILD_IN_PROJECTS} from "@models/ProjectModels";
import {useAppConfig} from "@compass/useConfig";
import timeAgo from "@shared/timeAgo";
import {ProjectTitle} from "@page-project/ProjectTitle";
import './FilesToolbar.css'

export function FilesToolbar() {

    const {fetchProjectCommits} = useCommitsStore();
    const {isDev} = useAppConfig();
    const [project, isPushing, isPulling] = useProjectStore((s) => [s.project, s.isPushing, s.isPulling], shallow)
    const [projectsCommited] = useProjectsStore((s) => [s.projectsCommited], shallow)
    const {setShowSideBar, setTitle, fetchCommitedFiles} = useFilesStore();
    const [file, setFile] = useFileStore((s) => [s.file, s.setFile], shallow)
    const [commitMessageIsOpen, setCommitMessageIsOpen] = useState(false);
    const [pullIsOpen, setPullIsOpen] = useState(false);
    const [commitMessage, setCommitMessage] = useState('');
    const [diff, selectedFileNames, selector, setSelector] = useFilesStore((s) => [s.diff, s.selectedFileNames, s.selector, s.setSelector], shallow);
    const isCommitsTab = selector === "commits";

    const projectCommited = projectsCommited?.find(p => p.projectId === project.projectId);

    useEffect(() => {
    }, [project, file]);

    function push() {
        setCommitMessageIsOpen(false);
        useProjectStore.setState({isPushing: true});
        ProjectService.pushProject(project, commitMessage, selectedFileNames);
    }

    function pull() {
        setPullIsOpen(false);
        ProjectService.pullProject(project.projectId);
    }

    function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
        event.stopPropagation();
        if (event.key === 'Enter') {
            event.preventDefault();
            if (!isEmpty(commitMessage)) {
                push();
            }
        }
    }

    function getCommitModal() {
        return (
            <Modal
                title="Commit and push"
                variant={ModalVariant.small}
                isOpen={commitMessageIsOpen}
                onClose={() => setCommitMessageIsOpen(false)}
                onKeyDown={onKeyDown}
            >
                <ModalHeader title='Commit and Push'/>
                <ModalBody>
                    <Form autoComplete="off" isHorizontal className="create-file-form">
                        <FormGroup label="Message" fieldId="name" isRequired>
                            <TextInput id={'commitMessage'} value={commitMessage} onChange={(_, value) => setCommitMessage(value)}/>
                            <FormHelperText/>
                        </FormGroup>
                    </Form>
                </ModalBody>
                <ModalFooter>
                    <Button key="confirm" variant="primary" isDisabled={isEmpty(commitMessage)} onClick={() => push()}>Commit and push</Button>
                    <Button key="cancel" variant="secondary" onClick={() => setCommitMessageIsOpen(false)}>Cancel</Button>
                </ModalFooter>
            </Modal>
        )
    }

    function getPullModal() {
        return (
            <Modal
                title="Pull"
                variant={ModalVariant.small}
                isOpen={pullIsOpen}
                onClose={() => setPullIsOpen(false)}
            >
                <ModalHeader title='Pull' titleIconVariant={"danger"}/>
                <ModalBody>
                    <div>
                        <Alert customIcon={<CodeBranchIcon/>}
                               isInline
                               variant="danger"
                               title="Pulling code from git rewrites all non-commited code in the project!"
                        />
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button key="confirm" variant="danger" isDanger onClick={() => pull()}>Pull</Button>
                    <Button key="cancel" variant="primary" onClick={() => setPullIsOpen(false)}>Cancel</Button>
                </ModalFooter>

            </Modal>
        )
    }

    function needCommit(): boolean {
        return diff && Object.keys(diff).length > 0;
    }

    function isKameletsProject(): boolean {
        return project.projectId === 'kamelets';
    }

    function isBuildInProject(): boolean {
        return BUILD_IN_PROJECTS.includes(project.projectId)
    }

    function getLastUpdatePanel() {
        const color = needCommit() ? "grey" : "green";
        const commit = projectCommited?.lastCommit;
        const date = projectCommited?.lastCommitTimestamp ? new Date(projectCommited?.lastCommitTimestamp) : null;
        const ago = date == null ? "N/A" : timeAgo.format(date);
        return (projectCommited?.lastCommitTimestamp > 0 &&
            <Tooltip isContentLeftAligned content={
                <div className='files-update-panel'>
                    <Content component='p'>{`Last commit: ${date.toISOString()}`}</Content>
                    <ClipboardCopy variant="inline-compact">{commit}</ClipboardCopy>
                </div>
            }
                     position={TooltipPosition.bottom}
            >
                <Label className='commits-label' color={color}>{getShortCommit(commit)}&nbsp;·&nbsp;{ago}</Label>
            </Tooltip>
        )
    }

    const toggle =
        <ToggleGroup aria-label="Source Toggle">
            {['files', 'commits'].map(value => {
                return (
                    <ToggleGroupItem
                        text={capitalize(value)}
                        key={value}
                        buttonId={value}
                        isSelected={selector === value}
                        onChange={(_, selected) => {
                            if (selected) setSelector(value as 'files' | 'commits');
                        }}
                    />
                )
            })}
        </ToggleGroup>

    function onRefresh() {
        if (isCommitsTab) {
            fetchProjectCommits(project.projectId);
        } else {
            ProjectService.refreshProjectFiles(project.projectId);
            useProjectStore.setState({isPushing: false});
            useProjectStore.setState({isPulling: false});
            fetchCommitedFiles(project.projectId);
        }
    }

    return (
        <div className="project-files-toolbar">
            <ProjectTitle/>
            {toggle}
            <Button icon={<SyncAltIcon/>}
                    variant={"link"}
                    onClick={() => onRefresh()}
            />
            <FileSearchToolbarItem disabled={isCommitsTab}/>
            {getLastUpdatePanel()}
            <Tooltip content="Pull from git" position={"bottom-end"}>
                <Button isLoading={isPulling ? true : undefined}
                        variant={"secondary"}
                        isDanger
                        isDisabled={isCommitsTab}
                        className="project-button dev-action-button"
                        onClick={() => {
                            setPullIsOpen(true);
                        }}>
                    {isPulling ? "..." : "Pull"}
                </Button>
            </Tooltip>
            <Tooltip content="Commit and push to git" position={"bottom-end"}>
                <Button isLoading={isPushing ? true : undefined}
                        isDisabled={!isDev || selectedFileNames.length === 0 || isCommitsTab}
                        variant={"secondary"}
                        className="project-button dev-action-button"
                        onClick={() => {
                            const filesChanges = selectedFileNames.length === 1 ? " one file" : `${selectedFileNames.length} files`;
                            const message = commitMessage === ''
                                ? `${project.name} commit with ${filesChanges}`
                                : commitMessage;
                            setCommitMessage(message);
                            setCommitMessageIsOpen(true);
                        }}>
                    {isPushing ? "..." : "Push"}
                </Button>
            </Tooltip>
            {!isKameletsProject() &&
                <Button className="dev-action-button"
                        isDisabled={!isDev || isCommitsTab}
                        variant={"primary"}
                        onClick={e => setFile("create")}>Create</Button>
            }
            {isKameletsProject() &&
                <Button className="dev-action-button"
                        isDisabled={!isDev || isCommitsTab}
                        variant={"primary"}
                        onClick={e => setFile("create", undefined, 'kamelet')}>Create</Button>
            }
            <Button className="dev-action-button"
                        isDisabled={!isDev || isCommitsTab}
                        variant="secondary"
                        onClick={e => setFile("upload")}>Upload</Button>
            {getCommitModal()}
            {getPullModal()}
        </div>
    )
}
