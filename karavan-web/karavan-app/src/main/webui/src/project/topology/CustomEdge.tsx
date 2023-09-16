import * as React from 'react';

import './topology.css';
import {DefaultEdge, DefaultGroup, observer} from '@patternfly/react-topology';


const CustomEdge: React.FC<any> = observer(({ element, ...rest }) => {
    const data = element.getData();

    return (
        <DefaultEdge element={element} {...rest}>
        </DefaultEdge>
    )
})
export default CustomEdge;