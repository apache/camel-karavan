import * as React from 'react';
import {Button, Content, Label} from '@patternfly/react-core';
import {Star, StarFilled, StarHalf} from "@carbon/icons-react";
import {PROJECT_WITH_NO_LABELS, useProjectsStore} from "@stores/ProjectStore";

export function ProjectsToolbarTags() {

    const { labels, selectedLabels, setSelectedLabels} = useProjectsStore();
    const allSelected = labels?.length === selectedLabels.length;
    const allIcon = allSelected
        ? <StarFilled className={'carbon'}/>
        : (selectedLabels?.length > 0 ? <StarHalf className={'carbon'}/> : <Star className={'carbon'}/>);
    return (
        <div className="label-selector">
            <Content component={'p'}>Labels</Content>
            <Button variant={'link'}
                    isInline
                    onClick={(_) => {
                        if (allSelected) {
                            setSelectedLabels([]);
                        } else {
                            setSelectedLabels([...labels.map(t => t)]);
                        }
                    }}
            >
                <Label status={allSelected || selectedLabels?.length > 0 ? 'success' : 'info'}
                       variant={allSelected ? 'outline' : 'outline'}
                       icon={allIcon}
                >
                    all
                </Label>
            </Button>
            {labels?.sort().map((label) => {
                const isSelected = selectedLabels.includes(label);
                const icon = isSelected ? <StarFilled className={'carbon'}/> : <Star className={'carbon'}/>;
                return (
                    <Button key={label}
                            variant={'link'}
                            isInline
                            onClick={_ => {
                                if (isSelected) {
                                    setSelectedLabels([...selectedLabels.filter(t => t !== label)]);
                                } else {
                                    setSelectedLabels([...selectedLabels, label]);
                                }
                            }}
                    >
                        <Label status={isSelected ? 'success' : 'info'}
                               variant={isSelected ? 'outline' : 'outline'}
                               icon={icon}
                        >
                            {label !== PROJECT_WITH_NO_LABELS ? label : 'no label'}
                        </Label>
                    </Button>
                );
            })}
        </div>
    )
}