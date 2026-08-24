import * as React from 'react';

import {DefaultEdge, EdgeTerminalType, NodeStatus, observer} from '@patternfly/react-topology';

const ArchitectureEdge: React.FC<any> = observer(({ element, ...rest }) => {

    const data = element.getData();

    if (data.invisible) return undefined;
    let className = data.isRunning ? "edge-running" : "";
    if (data.isTransparent) {
        className = 'edge-transparent';
    }

    return (
        <DefaultEdge
            element={element}
            startTerminalType={EdgeTerminalType.none}
            endTerminalType={EdgeTerminalType.directional}
            endTerminalSize={10}
            endTerminalStatus={data?.endTerminalStatus || NodeStatus.default}
            tagStatus={data?.endTerminalStatus || NodeStatus.default}
            tag={data.label}
            className={className}
            {...rest}
        />
    )
})
export default ArchitectureEdge;