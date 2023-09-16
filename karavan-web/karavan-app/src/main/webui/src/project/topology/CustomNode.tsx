import * as React from 'react';
import { RegionsIcon } from '@patternfly/react-icons';

import { DefaultNode, observer} from '@patternfly/react-topology';
import {getDesignerIcon} from "../../designer/utils/KaravanIcons";
import {CamelUi} from "../../designer/utils/CamelUi";
import './topology.css';
import {useFilesStore, useFileStore, useProjectStore} from "../../api/ProjectStore";
import {shallow} from "zustand/shallow";

function getIcon(data: any) {
    if (['route', 'rest'].includes(data.icon)) {
        return (
            <g transform={`translate(14, 14)`}>
                {getDesignerIcon(data.icon)}
            </g>
        )
    } else if (data.icon === 'element') {
        return (
            <g transform={`translate(14, 14)`}>
                {CamelUi.getConnectionIcon(data.step)}
            </g>
        )
    }
    return <RegionsIcon/>;
}

const CustomNode: React.FC<any> = observer(({ element, ...rest }) => {

    const [files] = useFilesStore((s) => [s.files], shallow);
    const [setFile] = useFileStore((s) => [s.setFile], shallow);

    const data = element.getData();

    function openFile(data: any) {
        if (data.fileName) {
            const file = files.filter(f => f.name === data.fileName)?.at(0);
            if (file) {
                setFile('select', file);
            }
        }
    }

    return (
        <DefaultNode
            className="common-node"
            element={element} {...rest}
            onSelect={e => openFile(data)}
        >
            {getIcon(data)}
        </DefaultNode>
    )
})
export default CustomNode;