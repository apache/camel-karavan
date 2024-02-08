import { KameletApi } from "karavan-core/lib/api/KameletApi";
import { KnowledgebasePage } from "./KnowledgebasePage"
import { ComponentApi } from "karavan-core/lib/api/ComponentApi";
import { KaravanApi } from "../api/KaravanApi";
import { useState, useEffect } from "react";
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
        if (type === 'component') {
            KaravanApi.updateBlockComponent(name, operation, res => {
                if (res.status === 204) {
                    console.log(res);
                    const blockedComponent = ComponentApi.saveBlockedComponentName(name, operation === 'block' ? 'add' : 'delete');
                    setBlockedComponents([...blockedComponent]);
                } else {
                    // console.log(res) //TODO show notification
                }
            })
        }
        else if (type === 'kamelet') {
            KaravanApi.updateBlockKamelet(name, operation, res => {
                if (res.status === 204) {
                    console.log(res);
                    const blockedKamelet = KameletApi.saveBlockedKameletName(name, operation === 'block' ? 'add' : 'delete');
                    setBlockedKamelets([...blockedKamelet]);
                } else {
                    // console.log(res) //TODO show notification
                }
            })
        }

    }
    return (
        <KnowledgebasePage dark={props.dark} changeBlockList={(type: string, name: string, operation: 'block' | 'unblock') => onchangeBlockedList(type, name, operation)} blockedKamelets={blockedKamelets} blockedComponents={blockedComponents} />
    );
}