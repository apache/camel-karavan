import {ROUTES} from "@compass/navigation/Routes";
import {useNavigate} from "react-router-dom";
import {useProjectInfoStore} from "@stores/useProjectInfoStore";

export const PROJECT_ID_PREFIX = "project-";
export const CONSUMER_PREFIX = "consumer-";
export const PRODUCER_PREFIX = "producer-";
export const STANDALONE_PREFIX = "standalone-";
export const STANDALONE_NODE_ID = `${STANDALONE_PREFIX}projects`;

export const NODE_DIAMETER_PROJECT = 50;
export const NODE_DIAMETER_INOUT = NODE_DIAMETER_PROJECT / 1.5;

export function ArchitectureHook() {

    const [projectInfos] = useProjectInfoStore(s => [s.projectInfos]);
    const navigate = useNavigate();

    function selectFile(integration: string, fileName: string) {
        navigate(`${ROUTES.PROJECTS}/${integration}/${fileName}`);
    }

    function getIntegrationInfo(integrationId: string) {
        return projectInfos.find(i => i.projectId === integrationId);
    }

    return {
        getIntegrationInfo, selectFile,
    }
}