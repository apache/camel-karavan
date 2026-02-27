import React, {useEffect, useState} from 'react';
import {Button, TextInputGroup, TextInputGroupMain, TextInputGroupUtilities, Tooltip, TooltipPosition,} from '@patternfly/react-core';
import {SearchIcon} from '@patternfly/react-icons';
import {useAppConfigStore, useProjectStore} from "@stores/ProjectStore";
import {Project} from "@models/ProjectModels";
import {shallow} from "zustand/shallow";
import RefreshIcon from "@patternfly/react-icons/dist/esm/icons/sync-alt-icon";
import {ProjectService} from "@services/ProjectService";
import {useSearchStore} from "@stores/SearchStore";
import {useDebounceValue} from "usehooks-ts";
import {SearchApi} from "@api/SearchApi";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";
import PullIcon from "@patternfly/react-icons/dist/esm/icons/code-branch-icon";
import {UploadProjectModal} from "@features/projects/UploadProjectModal";
import {ModalConfirmation} from "@shared/ui/ModalConfirmation";

export function ProjectsToolbar() {

    const [search, setSearch, setSearchResults] = useSearchStore((s) => [s.search, s.setSearch, s.setSearchResults], shallow)
    const [setProject] = useProjectStore((s) => [s.setProject], shallow)
    const [showUpload, setShowUpload] = useState<boolean>(false);
    const [debouncedSearch] = useDebounceValue(search, 300);
    const [pullIsOpen, setPullIsOpen] = useState(false);
    const [config] = useAppConfigStore((s) => [s.config], shallow);
    const isDev = config.environment === 'dev';

    useEffect(() => {
        if (search !== undefined && search !== '') {
            SearchApi.searchAll(search, response => {
                if (response) {
                    setSearchResults(response);
                }
            })
        } else {
            setSearchResults([])
        }
    }, [debouncedSearch]);

    function searchInput() {
        return (
            <TextInputGroup style={{ width: "300px" }}>
                <TextInputGroupMain
                    value={search}
                    id="search-input"
                    // placeholder='Search'
                    type="text"
                    autoComplete={"off"}
                    autoFocus={true}
                    icon={<SearchIcon />}
                    onChange={(_event, value) => {
                        setSearch(value);
                    }}
                    aria-label="text input example"
                />
                <TextInputGroupUtilities>
                    <Button variant="plain" onClick={_ => {
                        setSearch('');
                    }}>
                        <TimesIcon aria-hidden={true}/>
                    </Button>
                </TextInputGroupUtilities>
            </TextInputGroup>
        )
    }

    return (
        <div className="project-files-toolbar" style={{justifyContent: "flex-end"}}>
            <Tooltip content='Pull new Integrations from git' position={TooltipPosition.left}>
                <Button icon={<PullIcon/>}
                        variant={"link"}
                        isDanger
                        onClick={e => setPullIsOpen(true)}
                />
            </Tooltip>
            <Button icon={<RefreshIcon/>}
                    variant={"link"}
                    onClick={e => ProjectService.refreshProjects()}
            />
            {searchInput()}
            {isDev &&
                <Button className="dev-action-button" variant="secondary"
                        onClick={e => setShowUpload(true)}>
                    Import project
                </Button>
            }
            {isDev &&
                <Button className="dev-action-button" variant="primary"
                        onClick={e => setProject(new Project(), 'create')}>
                    Create Project
                </Button>
            }
            {showUpload && <UploadProjectModal open={showUpload} onClose={() => setShowUpload(false)}/>}
            <ModalConfirmation isOpen={pullIsOpen}
                               message='Pull new Integrations from Git!'
                               onConfirm={() => {
                                   ProjectService.pullAllProjects();
                                   setPullIsOpen(false);
                               }}
                               onCancel={() => setPullIsOpen(false)}
                               btnConfirmVariant='danger'
                               btnConfirm='Confirm Pull'
            />
        </div>
    )
}