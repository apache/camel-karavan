import {useCommandPaletteStore} from "./useCommandPaletteStore";
import {DslMetaModel} from "@designer/utils/DslMetaModel";
import {FILE_WORDS_SEPARATOR, KARAVAN_DOT_EXTENSION, KARAVAN_FILENAME, MARKDOWN_EXTENSION} from "@core/contants";
import {useFilesStore, useFileStore, useProjectStore} from "@stores/ProjectStore";
import React from "react";
import {CamelUi} from "@designer/utils/CamelUi";
import {v4 as uuidv4} from "uuid";
import {toSpecialRouteId} from "@designer/utils/ValidatorUtils";
import {ComponentApi} from "@core/api/ComponentApi";
import {ProjectFunctionHook} from "@page-project/ProjectFunctionHook";
import {useRouteDesignerHook} from "@designer/route/useRouteDesignerHook";
import {useUIStore} from "@stores/useUIStore";
import {useTemplatesStore} from "@stores/SettingsStore";

export function useCommandHook() {

    const parentDsl = useCommandPaletteStore((s) => s.parentDsl);
    const showSteps = useCommandPaletteStore((s) => s.showSteps);
    const parentId = useCommandPaletteStore((s) => s.parentId);
    const setShowSelector = useCommandPaletteStore((s) => s.setShowPalette);
    const selectedPosition = useCommandPaletteStore((s) => s.selectedPosition);
    const setShowProperties = useCommandPaletteStore((s) => s.setShowProperties);
    const setSelectedDsl = useCommandPaletteStore((s) => s.setSelectedDsl);
    const isRouteTemplate = useCommandPaletteStore((s) => s.isRouteTemplate);
    const setElements = useCommandPaletteStore((s) => s.setElements);
    const setStoreFilter = useCommandPaletteStore((state) => state.setFilter);
    const filter = useCommandPaletteStore((state) => state.filter);
    const setFileName = useCommandPaletteStore((state) => state.setFileName);
    const selectedDsl = useCommandPaletteStore((s) => s.selectedDsl);
    const fileName = useCommandPaletteStore((state) => state.fileName);
    const showProperties = useCommandPaletteStore((s) => s.showProperties);
    const files = useFilesStore((s) => s.files);
    const file = useFileStore((s) => s.file);
    const project = useProjectStore((s) => s.project);
    const tabIndex = useProjectStore(s => s.tabIndex);
    const templateFiles = useTemplatesStore((s) => s.templateFiles);
    const pageId = useUIStore(s => s.pageId);
    const {createNewRouteFile} = ProjectFunctionHook();
    const {onAddNewRouteStep} = useRouteDesignerHook();
    const onDslSelect = file === undefined ? createNewRouteFile : onAddNewRouteStep;

    function afterSelect(dsl: DslMetaModel) {
        setStoreFilter('');
        setShowSelector(false);
        onDslSelect(dsl, parentId, selectedPosition, fileName);
        setFileName(undefined);
    }

    function validated(): boolean {
        return files.find(f => f.name === `${fileName}${KARAVAN_DOT_EXTENSION.CAMEL_YAML}`) === undefined;
    }

    function close() {
        setStoreFilter('');
        setFileName(undefined);
        setShowSelector(false);
    }

    function dslCardClick(evt: React.MouseEvent | React.KeyboardEvent<HTMLDivElement>, dsl: any) {
        evt.stopPropagation();
        if (parentId?.length > 0) {
            afterSelect(dsl as DslMetaModel);
        } else {
            setSelectedDsl(dsl as DslMetaModel);
            setShowProperties(true)
        }
    }

    function setAllElements() {
        const blockedComponents = ComponentApi.getBlockedComponentNames();
        const eipE = CamelUi.getSelectorModelsForParentFiltered(parentDsl, 'eip', showSteps);
        const cE = CamelUi.getSelectorModelsForParentFiltered(parentDsl, 'component', showSteps)
            .filter(dsl => (!blockedComponents.includes(dsl.uri || dsl.name)));
        const e: DslMetaModel[] = [];
        if (parentDsl !== undefined) {
            e.push(...eipE)
        }
        e.push(...cE)
        const kE = CamelUi.getSelectorModelsForParentFiltered(parentDsl, 'kamelet', showSteps);
        e.push(...kE);
        setElements(e);
    }

    function generateParamUri(dsl: DslMetaModel) {
        const uuid = uuidv4().substring(0, 3)
        const uri = dsl.uri + FILE_WORDS_SEPARATOR +
            (dsl.properties && Object.keys(dsl.properties).length > 0
                ? Object.values(dsl.properties).join(FILE_WORDS_SEPARATOR)
                : uuid);
        return uri
            .replace(/[^a-zA-Z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    function generateRouteFileName(dsl: DslMetaModel): string {
        if (dsl === undefined) {
            return "from-" + uuidv4().substring(0, 3);
        }
        const paramsUri = generateParamUri(dsl);
        const fullUri = `${FILE_WORDS_SEPARATOR}${paramsUri}`;
        if (isRouteTemplate) {
            return toSpecialRouteId(`${FILE_WORDS_SEPARATOR}${fullUri}-route-template`);
        } else {
            return toSpecialRouteId(`${FILE_WORDS_SEPARATOR}${fullUri}`);
        }
    }

    const isFileSelected = file?.name !== undefined && project?.projectId !== undefined;
    const isFileCamel = isFileSelected && file?.name.endsWith(KARAVAN_DOT_EXTENSION.CAMEL_YAML);
    const isFileGroovy = isFileSelected && file?.name.endsWith(KARAVAN_DOT_EXTENSION.GROOVY);
    const isApplicationProperties = isFileSelected && file?.name === KARAVAN_FILENAME.APP_PROPERTIES;
    const isFileMarkdown = isFileSelected && file?.name.endsWith(MARKDOWN_EXTENSION);
    const isTopology = tabIndex === 'topology' && !isFileSelected && project?.projectId !== undefined;
    const isDashboard = pageId === 'dashboard' && !isFileSelected && project?.projectId === undefined;
    const isProjects = pageId === 'projects';
    const isLogOpen = project?.projectId !== undefined && tabIndex === 'log';

    const showCamelSteps = React.useMemo(() => {
        if (showProperties) {
            return false;
        }
        if (isDashboard || isTopology || isFileCamel) {
            return true;
        }
        if (isProjects && !isFileSelected) {
            return true;
        }
        return false;
    }, [isDashboard,
        isProjects,
        isTopology,
        isFileCamel,
        isLogOpen,
        isApplicationProperties,
        isFileMarkdown,
        showProperties,
        file?.name,
        project?.projectId,
        ]);


    return {
        afterSelect, validated, close, dslCardClick, setAllElements, generateRouteFileName, onDslSelect, selectedDsl,
        isFileSelected,
        isFileCamel,
        isFileGroovy,
        isFileMarkdown,
        isTopology,
        isDashboard,
        isLogOpen,
        isProjects,
        file,
        files,
        project,
        pageId,
        tabIndex,
        isApplicationProperties,
        showCamelSteps,
    };
}