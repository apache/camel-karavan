import { KnowledgebasePage } from "./knowledgebase/KnowledgebasePage"
import { ComponentApi } from "karavan-core/lib/api/ComponentApi";
import { KameletApi } from "karavan-core/lib/api/KameletApi";
interface Props {
    dark: boolean,
}
export const KnowledgebaseHome = (props: Props) => {
   

    const onchangeBlockedList = (type: string, name: string, checked: boolean) => {
        if (type === 'kamelet') {

            const blockedKamelet = KameletApi.saveBlockedKameletName(name, checked);
        }
        else if (type === 'component') {
            const blockedComponent = ComponentApi.saveBlockedComponentName(name, checked);
        }
    }
    return (
        <KnowledgebasePage dark={props.dark} changeBlockList={(type: string, name: string, checked: boolean) => onchangeBlockedList(type, name, checked)}  />
    );
}