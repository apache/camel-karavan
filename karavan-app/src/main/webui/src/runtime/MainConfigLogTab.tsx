import React, {useEffect, useState} from 'react';
import './ProjectLog.css';
import {Table, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import {Bullseye, Content, Spinner} from "@patternfly/react-core";
import {APPLICATION_PROPERTIES} from "@/api/ProjectModels";
import {MainConfiguration} from "@/runtime/RuntimeModels";
import {RuntimeApi} from "@/runtime/RuntimeApi";

interface Props {
    currentPodName: string
    header?: React.ReactNode
}

export function MainConfigLogTab (props: Props) {

    const [mainConfig, setMainConfig ] = useState<MainConfiguration[]>([]);

    useEffect(() => {
        RuntimeApi.getMainConfiguration(props.currentPodName, pes => setMainConfig(pes));
    }, []);

    const showConfig = mainConfig?.length > 0;

    return (
        <div style={{display: "flex", flexDirection:"column", position: "relative", height: "100%"}}>
            {props.header}
            {!showConfig  && <Bullseye height={'100%'}><Spinner></Spinner></Bullseye>}
            {showConfig && <div style={{overflow: "auto"}}>
                <Table aria-label="Main configuration table" height={"100vh"} variant='compact'>
                    <Thead>
                        <Tr>
                            <Th>Key</Th>
                            <Th>Value</Th>
                            <Th>Location</Th>
                        </Tr>
                    </Thead>
                    <Tbody className='event-table'>
                        {mainConfig.sort((a, b) => a.key.localeCompare(b.key)).map((config) => {
                            const bgColor = (config.location.endsWith(APPLICATION_PROPERTIES) || config.location === 'initial') ? 'transparent' : 'yellow';
                            return (
                                <Tr key={config.key}>
                                    <Td>{config.key}</Td>
                                    <Td>{config.value}</Td>
                                    <Td>
                                        <Content component="p" style={{width: 'fit-content', backgroundColor: bgColor}}>{config.location}</Content>
                                    </Td>
                                </Tr>
                            )
                        })}
                    </Tbody>
                </Table>
            </div>}
        </div>
    );
}
