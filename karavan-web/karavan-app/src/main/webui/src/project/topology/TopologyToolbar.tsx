import * as React from 'react';
import {
    Button,
    ToolbarItem
} from '@patternfly/react-core';
import { useFileStore} from "../../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {useTopologyStore} from "./TopologyStore";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {CreateFileModal} from "../files/CreateFileModal";

export const TopologyToolbar: React.FC = () => {

    const [setFile] = useFileStore((s) => [s.setFile], shallow);
    const [selectedIds, setSelectedIds, setFileName] = useTopologyStore((s) =>
        [s.selectedIds, s.setSelectedIds, s.setFileName], shallow);

    return (
        <ToolbarItem align={{default: "alignRight"}}>
            <Button size="sm"
                    variant={"primary"}
                    icon={<PlusIcon/>}
                    onClick={e => setFile("create")}
            >
                Create
            </Button>
            <CreateFileModal types={['INTEGRATION']}/>
        </ToolbarItem>
    )
}