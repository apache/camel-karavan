import React from 'react';
import {
    Button,
    Flex,
    FlexItem,
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import UploadIcon from "@patternfly/react-icons/dist/esm/icons/upload-icon";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {useFileStore} from "../../api/ProjectStore";

export const FileToolbar = () => {

    return <Flex className="toolbar" direction={{default: "row"}} justifyContent={{default: "justifyContentFlexEnd"}}>
        <FlexItem>
            <Button isSmall variant={"secondary"} icon={<PlusIcon/>}
                    onClick={e => useFileStore.setState({operation:"create"})}>Create</Button>
        </FlexItem>
        <FlexItem>
            <Button isSmall variant="secondary" icon={<UploadIcon/>}
                    onClick={e => useFileStore.setState({operation:"upload"})}>Upload</Button>
        </FlexItem>
    </Flex>
}
