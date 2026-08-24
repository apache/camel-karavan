import {createWithEqualityFn} from "zustand/traditional";
import {shallow} from "zustand/shallow";
import {RouteTemplateDefinition} from "@core/model/CamelDefinition";
import {KARAVAN_DOT_EXTENSION} from "@core/contants";
import {CamelDefinitionYaml} from "@core/api/CamelDefinitionYaml";
import isEqual from "lodash/isEqual";
import {ProjectFile} from "@models/ProjectModels";

interface TemplatedRouteState {
    routeTemplates: Record<string, RouteTemplateDefinition>;
    fetchRouteTemplates: (files: ProjectFile[]) => Promise<void>;
    templateId?: string;
    setTemplateId: (templateId?: string) => void;
}

export const useTemplatedRouteStore = createWithEqualityFn<TemplatedRouteState>((set, get) => ({
    routeTemplates: {},
    fetchRouteTemplates: async (files: ProjectFile[]): Promise<void> => {
        const current = get().routeTemplates;
            const templatesFiles = files?.filter(file => file.name.endsWith(KARAVAN_DOT_EXTENSION.CAMEL_YAML));
            const templates: Record<string, RouteTemplateDefinition> = {};
            templatesFiles?.forEach((f) => {
                const i = CamelDefinitionYaml.yamlToIntegration(f.name, f.code);
                const template: RouteTemplateDefinition = i.spec?.flows?.find(flow => flow.dslName === 'RouteTemplateDefinition');
                if (template) {
                    templates[template.id] = template;
                }
            });
            if (!isEqual(current, templates)) {
                set({routeTemplates: templates});
            }
    },
    setTemplateId: (templateId?: string): void => {
        set({templateId: templateId});
    }
}), shallow)


