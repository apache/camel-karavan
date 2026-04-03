import React from 'react';
import {Label, Tooltip} from '@patternfly/react-core';
import './Complexity.css';
import {ComplexityProject, ComplexityType, getComplexityColor, getMaxComplexity} from "./ComplexityModels";
import IconEasy from "@patternfly/react-icons/dist/esm/icons/ok-icon";
import IconNormal from "@patternfly/react-icons/dist/esm/icons/ok-icon";
import IconComplex from "@patternfly/react-icons/dist/esm/icons/warning-triangle-icon";
import {BUILD_IN_PROJECTS} from "@models/ProjectModels";

interface Props {
    complexity: ComplexityProject
}

export function ProjectsTableRowComplexity (props: Props) {

    const {complexity} = props;
    const routesComplexity = complexity.complexityRoute;
    const restComplexity = complexity.complexityRest;
    const javaComplexity = complexity.complexityJava;
    const fileComplexity = complexity.complexityFiles;

    const complexities: ComplexityType[] = [];
    complexities.push(routesComplexity);
    complexities.push(restComplexity);
    complexities.push(javaComplexity);
    complexities.push(fileComplexity);
    const maxComplexity = getMaxComplexity(complexities)
    const color = getComplexityColor(maxComplexity);
    const isBuildIn = BUILD_IN_PROJECTS.includes(complexity.projectId);

    const label = isBuildIn
        ? <Label key='build-in' variant={"outline"} color={'blue'}><IconNormal color={'var(--pf-t--global--color--brand--default)'}/></Label>
        : (
            <Tooltip content={maxComplexity}>
                <>
                    {maxComplexity === 'easy' && <Label key='success' color={color}><IconEasy/></Label>}
                    {maxComplexity === 'normal' && <Label key='info' color={color}><IconNormal/></Label>}
                    {maxComplexity === 'complex' && <Label key='warning' color={color}><IconComplex/></Label>}
                </>
            </Tooltip>
        )

    return (
        <div style={{display: "flex", gap: "3px", justifyContent: 'center', marginLeft: '16px', marginRight: '16px'}} className='complexity'>
            {label}
        </div>
    )
}