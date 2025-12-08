import React, {useState} from 'react';
import {Badge, Button, Label} from '@patternfly/react-core';
import {Tbody, Td, Tr} from '@patternfly/react-table';
import {useSystemStore} from "../../../stores/SystemStore";
import {shallow} from "zustand/shallow";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";
import AddIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {ConfigMapRowKey} from "./ConfigMapRowKey";
import {ConfigMapKeyModal} from "./ConfigMapKeyModal";
import {ModalConfirmation} from "@shared/ui/ModalConfirmation";
import {SystemApi} from "../../../api/SystemApi";
import {SystemService} from "@services/SystemService";

export interface Props {
    index: number
    configmapName: string
}

export function ConfigMapRow(props: Props) {

    const [configmaps, filter] = useSystemStore((s) => [s.configmaps, s.filter], shallow);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [isNewKeyOpen, setIsNewKeyOpen] = useState<boolean>(false);
    const [deleteOpen, setDeleteOpen] = useState<boolean>(false);

    function getConfigMapData(configmapName: string): [string, string][] {
        const configMap = configmaps.filter(s => s.name === configmapName).at(0);
        return Object.getOwnPropertyNames(configMap?.data)
            .sort((a, b) => a.localeCompare(b)).map(key => [key, configMap?.data?.[key]]);
    }

    function deleteConfigMap() {
        SystemApi.deleteConfigMap(configmapName, (val: string) => {
            setDeleteOpen(false);
            SystemService.refresh();
        });
    }

    const {index, configmapName} = props;
    const canDelete = !['build.sh', 'kube-root-ca.crt'].includes(configmapName);
    return (
        <Tbody >
            <Tr key={configmapName} className='configmaps-data'>
                <Td noPadding modifier={"fitContent"}>
                    <Badge>ConfigMap</Badge>
                </Td>
                <Td noPadding isActionCell expand={{
                    rowIndex: props.index,
                    isExpanded: isExpanded,
                    onToggle: () => setIsExpanded(!isExpanded),
                    expandId: 'composable-expandable-example'
                }} modifier={"fitContent"}/>
                <Td modifier='fitContent'>
                    {configmapName}
                </Td>
                <Td>
                </Td>
                <Td>
                </Td>
                <Td modifier='fitContent' className='buttons'>
                    <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'end'}}>
                        <Button variant="link" onClick={event => setIsNewKeyOpen(true)} aria-label="Add">
                            <AddIcon/>
                        </Button>
                        <Button variant="plain" className={canDelete ? 'danger' : ''}
                                isDisabled={!canDelete}
                                onClick={event => setDeleteOpen(true)} aria-label="Delete"
                        >
                            <TimesIcon/>
                        </Button>
                    </div>
                </Td>
            </Tr>
            {getConfigMapData(configmapName).filter(data => data[0].toLowerCase().includes(filter.toLowerCase())).map(data => (
                <ConfigMapRowKey configmapName={configmapName} configmapKey={data[0]} key={configmapName + ':' + data[0]} configmapValue={data[1]} isExpanded={isExpanded} />
            ))}
            <ConfigMapKeyModal configmapName={configmapName}
                            isOpen={isNewKeyOpen}
                            onAfterCreate={configmapKey => setIsNewKeyOpen(false)}
                            onCancel={() => setIsNewKeyOpen(false)}
            />
            <ModalConfirmation
                message={<div>
                    {"Delete ConfigMap "}
                    {<Label color='red'>{configmapName}</Label>}
                    {" ?"}
                </div>}
                isOpen={deleteOpen}
                onCancel={() => setDeleteOpen(false)}
                onConfirm={() => deleteConfigMap()}
                btnConfirmVariant='danger'
                btnConfirm='Delete'
            />
        </Tbody>
    )
}
