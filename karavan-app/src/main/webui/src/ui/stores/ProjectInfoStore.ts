import {BUILD_IN_PROJECTS, ContainerStatus} from "@models/ProjectModels";
import {KaravanApi} from "@api/KaravanApi";
import isEqual from "lodash/isEqual";
import {ProjectInfo, RouteComponentsInfo} from "@models/CatalogModels";
import {ComplexityApi} from "@features/projects/ComplexityApi";
import {ComplexityProject} from "@features/projects/ComplexityModels";
import {createWithEqualityFn} from "zustand/traditional";
import {shallow} from "zustand/shallow";


type OpenApiState = {
    projectInfos: ProjectInfo[];
    fetchProjectInfos: () => Promise<void>;
    setProjectInfos: (projectInfos: ProjectInfo[]) => void;
}

export const useOpenApiStore = createWithEqualityFn<OpenApiState>((set, get) => ({
    projectInfos: [],
    setProjectInfos: (projectInfos: ProjectInfo[]) => {
        set({projectInfos: projectInfos});
    },
    fetchProjectInfos: async (): Promise<void> => {
        const containerStatusesPromise = new Promise<ContainerStatus[]>((resolve) => {
                KaravanApi.getAllContainerStatuses((statuses: ContainerStatus[]) => {
                    resolve(statuses);
                });
            });

        const complexitiesPromise = new Promise<ComplexityProject[]>((resolve) => {
            ComplexityApi.getComplexityProjects((complexities) => {
                resolve(complexities);
            });
        });

        // Wait for BOTH API calls
        const [containers, complexities] = await Promise.all([
            containerStatusesPromise,
            complexitiesPromise
        ]);
        const currenProjectInfos = get().projectInfos;
        const projectInfos: ProjectInfo[] = [];
        complexities.filter(c => !BUILD_IN_PROJECTS.includes(c.type)).forEach(c => {
            const routes: RouteComponentsInfo[] = []
            c.routes.forEach(r => {
                routes.push({
                    routeId: r.routeId,
                    nodePrefixId: r.nodePrefixId,
                    fileName: r.fileName,
                    consumers: r.consumers,
                    producers: r.producers,
                    routeTemplateRef: r.routeTemplateRef,
                    isTemplated: r.isTemplated
                })
            })
            const isDevModeRunning = containers.filter(cs => cs.projectId === c.projectId && cs.type === 'devmode')?.at(0)?.state === "running"
            const isPackagedRunning = containers.filter(cs => cs.projectId === c.projectId && cs.type === 'packaged')?.at(0)?.state === "running"
            const isBuildRunning = containers.filter(cs => cs.projectId === c.projectId && cs.type === 'build')?.at(0)?.state === "running"
            const implementsAsyncApi = c.files.filter(f => f.generated).length > 0;
            projectInfos.push({
                projectId: c.projectId,
                isDevModeRunning: isDevModeRunning,
                isPackagedRunning: isPackagedRunning,
                isBuildRunning: isBuildRunning,
                routes: routes,
                exposesOpenApi: c.exposesOpenApi,
                implementsAsyncApi: implementsAsyncApi
            })
        });

        if (!isEqual(currenProjectInfos, projectInfos)) {
            set({ projectInfos: projectInfos });
        }
    },
}), shallow)
