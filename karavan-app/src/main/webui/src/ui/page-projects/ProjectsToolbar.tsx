import React, {useEffect, useState} from 'react';
import {Button, TextInputGroup, TextInputGroupMain, TextInputGroupUtilities, Tooltip, TooltipPosition,} from '@patternfly/react-core';
import {CodeBranchIcon, SearchIcon, SyncAltIcon, TimesIcon} from '@patternfly/react-icons';
import {shallow} from "zustand/shallow";
import {ProjectService} from "@services/ProjectService";
import {useSearchStore} from "@stores/SearchStore";
import {useDebounceValue} from "usehooks-ts";
import {SearchApi} from "@api/SearchApi";
import {UploadProjectModal} from "./UploadProjectModal";
import {ModalConfirmation} from "@shared/ui/ModalConfirmation";
import {ProjectsToolbarTags} from "./ProjectsToolbarTags";
import {useAppConfig} from "@compass/useConfig";
import {useDashboardStore} from "@stores/DashboardStore";

export interface ProjectsToolbarProps {
    type: "full" | "simple"
}

export function ProjectsToolbar(props: ProjectsToolbarProps) {

    const {type} = props;
    const [search, setSearch, setSearchResults] = useSearchStore((s) => [s.search, s.setSearch, s.setSearchResults], shallow)
    const {setShowSideBar, showSideBar} = useDashboardStore();
    const [showUpload, setShowUpload] = useState<boolean>(false);
    const [debouncedSearch] = useDebounceValue(search, 300);
    const [pullIsOpen, setPullIsOpen] = useState(false);
    const {isDev} = useAppConfig();

    function refreshDesign() {
        ProjectService.refreshProjects();
    }

    useEffect(() => refreshDesign(), [showSideBar]);

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
            <TextInputGroup style={{width: "300px"}}>
                <TextInputGroupMain
                    value={search}
                    id="search-input"
                    // placeholder='Search'
                    type="text"
                    autoComplete={"off"}
                    autoFocus={true}
                    icon={<SearchIcon/>}
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

    const additionalElements =
        <>
            <Tooltip content='Pull new Integrations from git' position={TooltipPosition.left}>
                <Button icon={<CodeBranchIcon/>}
                        variant={"link"}
                        isDanger
                        onClick={e => setPullIsOpen(true)}/>
            </Tooltip>
            {searchInput()}
        </>

    const devElements =
        <>
            {isDev &&
                <Button className="dev-action-button" variant="primary"
                        onClick={e => setShowSideBar("integration", "Create Apache Camel integration project")}>
                    Create Integration
                </Button>
            }
            {isDev &&
                <Button className="dev-action-button" variant="tertiary"
                        onClick={e => setShowUpload(true)}>
                    Import project
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
        </>

    return (
        <div className="projects-toolbar" style={{justifyContent: "space-between"}}>
            <ProjectsToolbarTags/>
            <Button icon={<SyncAltIcon/>}
                    variant={"link"}
                    onClick={e => refreshDesign()}/>
            {type === "full" && additionalElements}
            {devElements}
        </div>
    )
}