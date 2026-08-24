import {ProjectFile, ProjectType} from "@models/ProjectModels";
import {ProjectService} from "@services/ProjectService";
import {ComponentApi} from "@core/api/ComponentApi";
import {useFilesStore} from "@stores/ProjectStore";

export function useDocumentationHook() {

    const saveFile = useFilesStore((s) => s.saveFile);

    const loadData = async() => {
        ProjectService.loadCustomKamelets();
        ProjectService.loadBlockedComponentAndKamelets();
    }

    async function onChangeBlockedList  (type: string, name: string, checked: boolean) {
        let fileContent = '';
        if (type === "component") {
            fileContent = ComponentApi.saveBlockedComponentName(name, checked).join('\n');
        }
        const file = new ProjectFile(type + "-blocklist.txt", ProjectType.configuration, fileContent, Date.now());
        saveFile(file);
    }

    return { loadData, onChangeBlockedList};
}