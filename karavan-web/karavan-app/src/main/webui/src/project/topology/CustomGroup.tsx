import * as React from 'react';

import './topology.css';
import { DefaultGroup, observer} from '@patternfly/react-topology';


const CustomGroup: React.FC<any> = observer(({ element, ...rest }) => {
    const data = element.getData();

    return (
        <DefaultGroup element={element} {...rest}>
        </DefaultGroup>
    )
})
export default CustomGroup;