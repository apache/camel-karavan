import * as React from 'react';
import { RegionsIcon } from '@patternfly/react-icons';

import { DefaultNode, observer} from '@patternfly/react-topology';
import {getDesignerIcon} from "../../designer/utils/KaravanIcons";
import {CamelUi} from "../../designer/utils/CamelUi";
import './topology.css';

function getIcon(data: any) {
    if (data.icon === 'route') {
        return (
            <g transform={`translate(14, 14)`}>
                {getDesignerIcon('routes')}
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
    const data = element.getData();

    return (
        <DefaultNode
            className="common-node"
            element={element} {...rest}
            // badge={data.badge}
            // badgeColor={}
            // badgeTextColor={badgeColors?.badgeTextColor}
            // badgeBorderColor={badgeColors?.badgeBorderColor}
        >
            {getIcon(data)}
        </DefaultNode>
    )
})
export default CustomNode;