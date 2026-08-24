import {ContextMenuItem, GraphElement} from '@patternfly/react-topology';
import * as React from "react";
import {ROUTES} from "@compass/navigation/Routes";
import {useNavigate} from "react-router-dom";
import {ProjectService} from "@services/ProjectService";
import {FolderOpenIcon, MiddlewareIcon, PlayIcon, StopIcon, TimesIcon} from "@patternfly/react-icons";
import {ArchitectureHook, PROJECT_ID_PREFIX} from "./ArchitectureHook";

const COLOR_INFO = 'var(--pf-t--global--text--color--link--default)';
const COLOR_DANGER = 'var(--pf-t--global--color--status--danger--default)';

interface Props {
    element: GraphElement
}

function ArchitectureMenu(props: Props): React.ReactElement[] {

    // const {setShowModal, setSelectedDomain, deleteDomain} = useDashboardStore();
    const result: React.ReactElement[] = [];
    const {element} = props;
    const data = element.getData();
    const prefix = data.prefix;
    const empty = data.empty;
    const {getIntegrationInfo} = ArchitectureHook();
    const projectId = data.projectId;
    const domainName = data.domainName;
    const info = getIntegrationInfo(projectId);
    const isDevModeRunning = info?.isDevModeRunning ?? false;
    const isPackagedRunning = info?.isPackagedRunning ?? false;
    const navigate = useNavigate();

    function start(e?: any) {
        e?.stopPropagation();
        ProjectService.startDevModeContainer(projectId, false, false, false);
    }

    function stop(e?: any) {
        e?.stopPropagation();
        ProjectService.deleteDevModeContainer(projectId)
    }

    function open(e?: any) {
        e?.stopPropagation();
        navigate(`${ROUTES.PROJECTS}/${projectId}`);
    }

    if (element.getType() === "group") {
        result.push(
            <ContextMenuItem icon={<MiddlewareIcon color={COLOR_INFO}/>} key={`create-project`} onClick={e => {
                e.stopPropagation();
                // setSelectedDomain(domainName)
                // setShowModal('project')
            }}>
                {`Create Project`}
            </ContextMenuItem>
        )
        if (empty) {
            result.push(
                <ContextMenuItem icon={<TimesIcon color={COLOR_DANGER}/>} key={`delete-domain`} onClick={e => {
                    e.stopPropagation();
                    // deleteDomain(domainName)
                }}>
                    {`Delete Domain`}
                </ContextMenuItem>
            )
        }
    } else if (element.getType() === "node") {
        if (prefix === PROJECT_ID_PREFIX) {
            if (isDevModeRunning) {
                result.push(
                    <ContextMenuItem isDanger icon={<StopIcon color={COLOR_DANGER}/>} key={"stop"} onClick={e => stop(e)}>
                        Stop DevMode
                    </ContextMenuItem>
                )
            } else if (!isDevModeRunning && !isPackagedRunning){
                result.push(
                    <ContextMenuItem icon={<PlayIcon color={COLOR_INFO}/>} key={"start"} onClick={e => start(e)}>
                        Start DevMode
                    </ContextMenuItem>
                )
            }
            result.push(
                <ContextMenuItem icon={<FolderOpenIcon color={COLOR_INFO}/>} key={"open"} onClick={e => open(e)}>
                    Open Project
                </ContextMenuItem>
            )
        }
    } else {

    }
    return result
}

export function ArchitectureMenus(element: GraphElement) {
    return (
        [<ArchitectureMenu key={1} element={element}/>]
    )
}
