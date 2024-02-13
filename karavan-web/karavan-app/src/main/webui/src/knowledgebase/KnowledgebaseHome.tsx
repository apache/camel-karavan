import { KameletApi } from "karavan-core/lib/api/KameletApi";
import { KnowledgebasePage } from "./KnowledgebasePage"
import { ComponentApi } from "karavan-core/lib/api/ComponentApi";
import { KaravanApi } from "../api/KaravanApi";
import { useState, useEffect } from "react";
import { ProjectFile } from "../api/ProjectModels";
import { ProjectService } from "../api/ProjectService";
interface Props {
    dark: boolean,
}
export const KnowledgebaseHome = (props: Props) => {

    const [blockList, setBlockList] = useState<ProjectFile[]>();

    useEffect(() => {
        KaravanApi.getTemplatesFiles((files:ProjectFile[]) => {
            setBlockList([...(files.filter(f => f.name.endsWith('blocklist.txt')))]);
        });
    }, []);

    const onChangeBlockedList = async (type: string, name: string, checked: boolean) => {

        let file: ProjectFile | undefined;
        let fileContent = '';
        if (type === "component") {
            file = blockList?.find(obj => obj.name === 'components-blocklist.txt');
            fileContent = ComponentApi.saveBlockedComponentName(name, checked).join('\n');
        } else {
            file = blockList?.find(obj => obj.name === 'kamelets-blocklist.txt');
            const res = KameletApi.saveBlockedKameletName(name, checked);
            fileContent = res.join('\n');
        }
        if (file) {
            file.code = fileContent;
            ProjectService.updateFile(file, false);
        }
    }

    return (
        <KnowledgebasePage dark={props.dark} changeBlockList={(type: string, name: string, checked: boolean) => onChangeBlockedList(type, name, checked)} />
    );
}