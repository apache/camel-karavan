import React, {ReactElement} from 'react';
import {DescriptionList, DescriptionListDescription, DescriptionListGroup, DescriptionListTerm, Label, Popover, Tooltip} from '@patternfly/react-core';
import '@/integrations/Complexity.css';
import {useFilesStore, useProjectStore} from "@/api/ProjectStore";
import {ProjectFile} from "@/api/ProjectModels";
import {shallow} from "zustand/shallow";
import {getDesignerIcon} from "@/integration-designer/icons/KaravanIcons";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";
import IconNormal from "@patternfly/react-icons/dist/esm/icons/ok-icon";
import IconComplex from "@patternfly/react-icons/dist/esm/icons/warning-triangle-icon";
import {v4 as uuidv4} from "uuid";
import {ComplexityFile, ComplexityProject, getComplexityColor} from "@/integrations/ComplexityModels";

interface Props {
    file: ProjectFile,
    complexity: ComplexityProject,
}

export function FileComplexity(props: Props) {

    const [files, diff] = useFilesStore((s) => [s.files, s.diff], shallow);
    const [project] = useProjectStore((s) => [s.project], shallow);

    const filenames = files.map(f => f.name);
    const deletedFilenames: string[] = Object.getOwnPropertyNames(diff)
        .map(name => diff[name] === 'DELETED' ? name : '')
        .filter(name => name !== '' && !filenames.includes(name));
    const deletedFiles: ProjectFile[] = deletedFilenames.map(d => new ProjectFile(d, project.projectId, '', 0))

    function getLabel(complex: 'easy' | 'normal' | 'complex', label: ReactElement | undefined, tooltip?: string) {
        if (!label) {
            const icon = complex === 'complex' ? <IconComplex/> : <IconNormal/>;
            return (
                <Tooltip key={uuidv4()} content={tooltip ?? complex} position={'right'}>
                    <Label color={color} className={'complexity-label complexity-' + complex}>{icon}</Label>
                </Tooltip>
            )
        }
        if (complex === 'complex') {
            return <Tooltip key={uuidv4()} content={tooltip} position={'right'}>{label}</Tooltip>;
        } else {
            return <Tooltip key={uuidv4()} content={complex} position={'right'}>{label}</Tooltip>;
        }
    }

    const {file, complexity} = props;
    let labels: React.ReactNode[] = [];
    const compFile = complexity.files.filter(f => f.fileName === file.name)[0] || new ComplexityFile();
    const error = compFile.error || '';
    const complex = compFile.complexity;
    const complexJava = compFile.complexityLines;
    const color= getComplexityColor(complex);

    if (file.name.endsWith('.camel.yaml')) {
        const processors = Object.getOwnPropertyNames(compFile.processors).length;
        const externalComponents = Object.getOwnPropertyNames(compFile.componentsExt).length;
        const internalComponents = Object.getOwnPropertyNames(compFile.componentsInt).length;
        const kamelets = Object.getOwnPropertyNames(compFile.kamelets).length;
        const complex = compFile.complexity;
        const complexRoutes = compFile.complexityRoutes;
        const complexRests = compFile.complexityRests;
        const complexBeans = compFile.complexityBeans;
        const complexProcessors = compFile.complexityProcessors;
        const complexExt = compFile.complexityComponentsExt;
        const complexInt = compFile.complexityComponentsInt;
        const complexKamelets = compFile.complexityKamelets;

        if (compFile.routes > 0) {
            labels.push(
                <Popover
                    key={file.name}
                    aria-label="Routes popover"
                    // headerContent={<div>Complexity</div>}
                    bodyContent={<div>
                        <DescriptionList isHorizontal horizontalTermWidthModifier={{default: '24ch'}}>
                            <DescriptionListGroup>
                                <DescriptionListTerm>Routes</DescriptionListTerm>
                                <DescriptionListDescription>
                                    <Label color={getComplexityColor(complexRoutes)} className={'complexity-' + complexRoutes}>{compFile.routes}</Label>
                                </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                                <DescriptionListTerm>Processors</DescriptionListTerm>
                                <DescriptionListDescription>
                                    <Label color={getComplexityColor(complexProcessors)} className={'complexity-' + complexProcessors}>{processors}</Label>
                                </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                                <DescriptionListTerm>Components (ext)</DescriptionListTerm>
                                <DescriptionListDescription>
                                    <Label color={getComplexityColor(complexExt)} className={'complexity-' + complexExt}>{externalComponents}</Label>
                                </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                                <DescriptionListTerm>Components (internal)</DescriptionListTerm>
                                <DescriptionListDescription>
                                    <Label color={getComplexityColor(complexInt)} className={'complexity-' + complexInt}>{internalComponents}</Label>
                                </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                                <DescriptionListTerm>Kamelets</DescriptionListTerm>
                                <DescriptionListDescription>
                                    <Label color={getComplexityColor(complexKamelets)} className={'complexity-' + complexKamelets}>{kamelets}</Label>
                                </DescriptionListDescription>
                            </DescriptionListGroup>
                        </DescriptionList>
                    </div>}
                    // footerContent="Popover footer"
                >
                    <Label key='routes' icon={getDesignerIcon('routes')} color={getComplexityColor(complex)}
                           className={'complexity-label complexity-' + complex}>{compFile.routes}</Label>
                </Popover>
            )
        }

        const colorRest= getComplexityColor(complexRests);
        if (compFile.rests > 0) {
            labels.push(<Label key='rests' icon={getDesignerIcon('rest')} color={colorRest} className={'complexity-label complexity-' + complexRests}>{compFile.rests}</Label>);
        }
        if (compFile.beans > 0) {
            const colorBean = getComplexityColor(complexBeans);
            labels.push(<Label key='beans' icon={getDesignerIcon('beans')} color={colorBean} className={'complexity-label complexity-' + complexBeans}>{compFile.beans}</Label>);
        }
   }
    return (
        <div style={{display: 'flex', gap: '3px'}} className='complexity'>
            {getLabel(complex, undefined)}
            {error?.length === 0 && labels}
            {error?.length !== 0 && <Tooltip key={uuidv4()} content={error} position={'left'}>
                <Label key='error' icon={<TimesIcon/>} color='red'>Error</Label>
            </Tooltip>}
        </div>
    )
}
