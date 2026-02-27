import * as React from 'react';
import {useRef} from 'react';
import {LockedIcon, RegionsIcon} from '@patternfly/react-icons';
import {Decorator, DEFAULT_DECORATOR_RADIUS, DefaultNode, getDefaultShapeDecoratorCenter, observer, TopologyQuadrant, WithContextMenuProps} from '@patternfly/react-topology';
import {BeanIcon, getDesignerIcon, OpenApiIcon} from "@features/project/designer/icons/KaravanIcons";
import {CamelUi} from "@features/project/designer/utils/CamelUi";
import '@features/project/project-topology/topology.css';
import {RouteDefinition} from "@karavan-core/model/CamelDefinition";
import {AutoStartupFalseIcon, ErrorHandlerIcon} from "@features/project/designer/icons/OtherIcons";
import {runInAction} from "mobx";
import {SvgIcon} from "@shared/icons/SvgIcon";
import {useTopologyHook} from "@features/project/project-topology/useTopologyHook";
import {Category, IntentRequestScaleIn, IntentRequestScaleOut} from "@carbon/icons-react";

function getIcon(data: any) {
    if (['route'].includes(data.icon)) {
        return (
            <g transform={`translate(14, 14) scale(2)`} className='icon-wrapper'>
                <Category/>
                {data?.generatedFromAsyncApi &&
                    <g transform={`translate(9, -2)`}>
                        {SvgIcon({icon: 'asyncapi', width: 14, height: 14})}
                    </g>
                }
            </g>
        )
    } else if (['routeConfiguration'].includes(data.icon)) {
        return (
            <g transform={`translate(8, 8) scale(0.75)`}>
                {getDesignerIcon(data.icon)}
            </g>
        )
    } else if (['rest'].includes(data.icon)) {
        return (
            <g transform={`translate(14, 14)`}>
                {getDesignerIcon(data.icon)}
            </g>
        )
    } else if (data.icon === 'bean') {
        return (
            <g transform={`translate(8, 8) scale(0.75)`}>
                <BeanIcon/>
            </g>
        )
    } else if (data.icon === 'element') {
        return (
            <g transform={`translate(8, 8) scale(0.75)`}>
                {CamelUi.getConnectionIcon(data.step)}
            </g>
        )
    } else if (data.icon === 'openapi') {
        return (
            <g transform={`translate(14, 14)`}>
                <OpenApiIcon width={32} height={32} />
            </g>
        )
    } else if (data.icon === 'asyncapi') {
        return (
            <g transform={`translate(14, 14)`}>
                {SvgIcon({icon: 'asyncapi', width: 32, height: 32})}
            </g>
        )
    } else if (data.icon === 'send') {
        return (
            <g rotate={45} transform={`translate(14, 14) scale(2)`}>
                <IntentRequestScaleOut style={{fill: "var(--pf-t--global--text--color--subtle)"}}/>
                <g transform={`translate(12, -2)`}>
                    {SvgIcon({icon: 'asyncapi', width: 6, height: 6})}
                </g>
            </g>
        )
    } else if (data.icon === 'receive') {
        return (
            <g rotate={45} transform={`translate(14, 14) scale(2)`}>
                <IntentRequestScaleIn style={{fill: "var(--pf-t--global--text--color--subtle)"}}/>
                <g transform={`translate(12, -2)`}>
                    {SvgIcon({icon: 'asyncapi', width: 6, height: 6})}
                </g>
            </g>
        )
    }
    return <RegionsIcon/>;
}

function isDisable(data: any) {
    if ((data && data?.step?.dslName === 'RouteDefinition')) {
        const route: RouteDefinition = data?.step;
        const autoStartup = route?.autoStartup === false;
        return autoStartup;
    } else if (data?.type === 'step' && data?.outgoing && data?.disabled) {
        return true;
    }
    return false;
}

function getAttachments(data: any) {
    const showStats = data?.showStats;
    if (data && data?.step?.dslName === 'RouteDefinition') {
        const route: RouteDefinition = data?.step;
        const routeId = route?.id;
        const errorHandler = route?.errorHandler !== undefined;
        return (
            <g>
                <g className="pf-topology__node__label__badge auto-start" transform="translate(-4, -4)">
                    {errorHandler && <g className="" transform="translate(13, -4)">{ErrorHandlerIcon()}</g>}
                    {isDisable(data) && <g className="" transform="translate(-4, -4)">{AutoStartupFalseIcon()}</g>}
                </g>
            </g>
        )
    } else if (isDisable(data)) {
        return (
            <g className="pf-topology__node__label__badge auto-start" transform="translate(-4, -4)">
                <g className="" transform="translate(-4, -4)">{AutoStartupFalseIcon()}</g>
            </g>
        )
    } else {
        return (<></>)
    }
}

const CustomNode: React.FC<any & WithContextMenuProps> = observer(({element, onContextMenu, contextMenuOpen, selected, ...rest}) => {
    const {selectFile, project} = useTopologyHook(undefined);
    const decoratorRef = useRef(null);
    const data = element.getData();
    const badge: string = ['API', 'RT', 'TR'].includes(data.badge) ? data.badge : data.badge?.substring(0, 1).toUpperCase();
    let colorClass = 'route';
    let label = element.getLabel();
    if (badge === 'C') {
        colorClass = 'component'
    } else if (badge === 'K') {
        colorClass = 'kamelet';
        label = element.getLabel()?.replace('kamelet:', '');
    }
    if (label?.length > 30) {
        runInAction(() => {
            element.setLabel(label?.substring(0, 30) + '...');
        });
    }
    const disableClass = isDisable(data) ? 'disable-node' : '';

    const { x, y } =  getDefaultShapeDecoratorCenter("lowerRight" as TopologyQuadrant, element);

    const decorator = (
        <Decorator
            radius={DEFAULT_DECORATOR_RADIUS}
            showBackground
            className="gen-route-decorator"
            icon= {<LockedIcon width={14}/>}
            x={x - DEFAULT_DECORATOR_RADIUS / 2}
            y={y - DEFAULT_DECORATOR_RADIUS / 2}
            innerRef={decoratorRef}
        />
    );

    return (
        <g onDoubleClick={event => {
            event.stopPropagation();
            selectFile(data.fileName)
        }}>
            <DefaultNode
                showStatusDecorator
                className={"common-node common-node-" + badge + " topology-color-" + colorClass + " " + disableClass}
                scaleLabel={true}
                element={element}
                onContextMenu={onContextMenu}
                contextMenuOpen={contextMenuOpen}
                attachments={getAttachments(data)}
                hideContextMenuKebab={false}
                labelIconPadding={1}
                label={label}
                {...rest}
            >
                {getIcon(data)}
            </DefaultNode>
        </g>
    )
})
export default CustomNode;