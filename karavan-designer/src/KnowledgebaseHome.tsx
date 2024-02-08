import { useEffect, useState } from "react";
import { KnowledgebasePage } from "./knowledgebase/KnowledgebasePage"
import { ComponentApi } from "karavan-core/lib/api/ComponentApi";
import { KameletApi } from "karavan-core/lib/api/KameletApi";
interface Props {
    dark: boolean,
}
export const KnowledgebaseHome = (props: Props) => {
    const [blockedKamelets, setBlockedKamelets] = useState<string[]>([]);
    const [blockedComponents, setBlockedComponents] = useState<string[]>([]);
    useEffect(() => {
        const kamelets: string[] = KameletApi.getBlockedKameletNames();
        setBlockedKamelets([...kamelets]);
        const components: string[] = ComponentApi.getBlockedComponentNames();
        setBlockedComponents([...components]);

    }, []);

    const onchangeBlockedList = (type: string, name: string, operation: 'block' | 'unblock') => {
        if (type === 'kamelet') {

            const blockedKamelet = KameletApi.saveBlockedKameletName(name, operation === 'block' ? 'add' : 'delete');
            setBlockedKamelets([...blockedKamelet]);
        }
        else if (type === 'component') {
            const blockedComponent = ComponentApi.saveBlockedComponentName(name, operation === 'block' ? 'add' : 'delete');
            setBlockedComponents([...blockedComponent]);
        }
    }
    return (
        <KnowledgebasePage dark={props.dark} changeBlockList={(type: string, name: string, operation: 'block' | 'unblock') => onchangeBlockedList(type, name, operation)} blockedKamelets={blockedKamelets} blockedComponents={blockedComponents} />
    );
}