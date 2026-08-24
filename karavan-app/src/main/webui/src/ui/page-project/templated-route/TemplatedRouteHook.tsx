import {useFilesStore, useFileStore, useProjectStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {ProjectFile} from "@models/ProjectModels";
import {TemplatedRouteDefinition} from "@core/model/CamelDefinition";
import {CamelDefinitionYaml} from "@core/api/CamelDefinitionYaml";
import {CamelDefinitionApi} from "@core/api/CamelDefinitionApi";
import {Integration} from "@core/model/IntegrationDefinition";
import {useProjectPageStore} from "../ProjectPageStore";
import {getIntegrations} from "../project-topology/TopologyApi";
import {useTemplatedRouteStore} from "../templated-route/TemplatedRouteStore";

export function TemplatedRouteHook() {

    const {project} = useProjectStore();
    const {setTemplateId} = useTemplatedRouteStore();
    const {setShowSideBar, setTitle} = useProjectPageStore();
    const [files, saveFile] = useFilesStore((s) => [s.files, s.saveFile], shallow);
    const [setFile] = useFileStore((s) => [s.setFile], shallow);

    function openTemplatedRoutePanel(templateId?: string, routeId?: string, fileName?: string) {
        setShowSideBar('templatedRoute');
        setTitle('Templated Routes');
        setTemplateId(templateId);
        const file = files.find((file) => file.name === fileName);
        if (file) {
            setFile('none', file);
        }
    }

    function findTemplatedRoutes (fileName: string, routeTemplateRef: string): TemplatedRouteDefinition[] {
        const result: TemplatedRouteDefinition[] = [];
        const integrations = getIntegrations(files?.filter(f => f.name === fileName));
        integrations.forEach(i => {
            try {
                const templatedRoutes: TemplatedRouteDefinition[] = i.spec.flows?.filter(flow => flow.dslName === 'TemplatedRouteDefinition');
                result.push(...templatedRoutes?.filter(tr => tr.routeTemplateRef === routeTemplateRef));
            } catch (e) {
                console.error(e);
            }
        });
        return result;
    }

    function getTemplatedRoute(name: string): TemplatedRouteDefinition {
        try {
            const file = files.find(f => f.name === name);
            const i = CamelDefinitionYaml.yamlToIntegration(file.name, file.code);
            return i?.spec?.flows?.find(f => f.dslName === "TemplatedRouteDefinition" && f.routeId === name)
                ?? CamelDefinitionApi.createTemplatedRouteDefinition({routeId: name, prefixId: name});
        } catch (err) {
            return CamelDefinitionApi.createTemplatedRouteDefinition({routeId: name, prefixId: name});
        }
    }

    function saveTemplatedRoutes(routes: TemplatedRouteDefinition[], selectedId: string, filename: string) {
        const i = Integration.createNew(filename);
        i.spec.flows.push(...routes);
        const code = CamelDefinitionYaml.integrationToYaml(i);
        const file = new ProjectFile(filename, project.projectId, code, Date.now());
        const fileExists = files.find(f => f.name === filename) !== undefined;
        saveFile(file, !fileExists).then(_ => {

        });
    }


    function clearAllSelection() {
        setShowSideBar(null);
        setTitle(null);
    }

    return {
        clearAllSelection, getTemplatedRoute, saveTemplatedRoutes,findTemplatedRoutes, openTemplatedRoutePanel
    }
}