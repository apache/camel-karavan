import React from 'react';
import {Button, Flex, FlexItem} from '@patternfly/react-core';
import '../designer/karavan.css';
import DeleteIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon";
import {useAppConfigStore} from "../api/ProjectStore";
import {shallow} from "zustand/shallow";

interface Props {
    reloadOnly?: boolean
}

export function BuildToolbar (props: Props) {

    const [config] = useAppConfigStore((state) => [state.config], shallow)

    return (<Flex className="toolbar" direction={{default: "row"}} alignItems={{default: "alignItemsCenter"}}>
        <FlexItem>
                <Button style={{visibility:"hidden"}} size="sm" variant={"control"} icon={<DeleteIcon/>} onClick={() => {}}>
                </Button>
        </FlexItem>
    </Flex>);
}
