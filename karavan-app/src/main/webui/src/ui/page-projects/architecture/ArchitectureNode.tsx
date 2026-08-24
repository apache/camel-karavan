import * as React from 'react';
import {DefaultNode, NodeLabel, observer, WithDndDropProps, WithDragNodeProps, WithSelectionProps} from '@patternfly/react-topology';
import {CONSUMER_PREFIX, PRODUCER_PREFIX, PROJECT_ID_PREFIX, STANDALONE_NODE_ID} from "./ArchitectureHook";
import {useNavigate} from "react-router-dom";
import {ROUTES} from "@compass/navigation/Routes";
import {CamelUi} from "@designer/utils/CamelUi";
import {CamelElement} from "@core/model/IntegrationDefinition";
import {runInAction} from "mobx";
import {Apps} from "@carbon/icons-react";

function getIcon(data: any) {
    if (data.prefix === PROJECT_ID_PREFIX ) {
        return (
            <g>
                <g transform={`translate(13, 13) scale(1.5)`}>
                    <Apps/>
                </g>
            </g>
        )
    } else if (data.prefix === CONSUMER_PREFIX || data.prefix === PRODUCER_PREFIX ) {
        const step = new CamelElement("ToDefinition");
        (step as any).uri = data.component?.name;
        return (
            <g transform={`translate(7, 7) scale(0.6)`}>
                {CamelUi.getConnectionIcon(step)}
            </g>
        )
    }
}

export const ArchitectureNode: React.FC<any & WithSelectionProps & WithDragNodeProps & WithDndDropProps> = observer(
    React.forwardRef((props: any, ref) => {
        const {element, onContextMenu, contextMenuOpen, dragNodeRef, ...rest} = props;
        const navigate = useNavigate();
        const data = element.getData();
        const statusTooltip = data.statusTooltip;
        const prefix = data.prefix;
        const projectId = data.projectId;
        const showStats = data.showStats;
        const isRunning = data.isRunning ?? false;
        const runningClassName = isRunning ? 'up' : 'down';
        const typeClassName = `${prefix}${runningClassName}`;
        const statsClassName = showStats && isRunning && data.prefix === PROJECT_ID_PREFIX ? 'integration-node-stats' : ''
        const hideContextMenuKebab = ![PROJECT_ID_PREFIX].includes(data.prefix);
        const {width, height} = element.getDimensions();

        const label = element.getLabel();
        if (label?.length > 30) {
            runInAction(() => {
                element.setLabel(label?.substring(0, 20) + '...');
            });
        }

        let className =  `integration-node integration-node-${runningClassName} ${statsClassName} ${typeClassName}`
        if (element.id === STANDALONE_NODE_ID) {
            className = "node-transparent"
        }

        return (
            <g onDoubleClick={event => {
                event.stopPropagation();
                // The standalone anchor belongs to no project, so there is nothing to open
                if (projectId !== undefined) {
                    navigate(`${ROUTES.PROJECTS}/${projectId}`);
                }
            }}>
                <DefaultNode dragNodeRef={dragNodeRef}
                             showStatusBackground={false}
                             showStatusDecorator
                             statusDecoratorTooltip={statusTooltip}
                             className={className}
                             scaleLabel={true}
                             element={element}
                             onContextMenu={onContextMenu}
                             contextMenuOpen={contextMenuOpen}
                             hideContextMenuKebab={true}
                             showLabel={false}
                             onStatusDecoratorClick={_ => {}}
                             {...rest}
                >
                    {getIcon(data)}
                    <NodeLabel
                        x={width / 2}
                        y={height - (hideContextMenuKebab ? 5 : -4)}
                        paddingX={8}
                        paddingY={4}
                        className={"pf-topology__node__label"}
                        onContextMenu={onContextMenu}
                        contextMenuOpen={contextMenuOpen}
                        hideContextMenuKebab={true}
                    >
                        {element.getLabel()}
                    </NodeLabel>
                </DefaultNode>
            </g>
        )
    })
);
