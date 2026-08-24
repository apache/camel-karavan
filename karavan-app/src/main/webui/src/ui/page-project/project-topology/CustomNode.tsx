import * as React from 'react';
import {useRef} from 'react';
import {CheckCircleIcon, LockedIcon} from '@patternfly/react-icons';
import {
    Decorator,
    DEFAULT_DECORATOR_RADIUS,
    DefaultNode,
    getDefaultShapeDecoratorCenter,
    NodeLabel,
    observer,
    TopologyQuadrant,
    WithContextMenuProps
} from '@patternfly/react-topology';
import {getDesignerIcon, OpenApiIcon} from "@designer/icons/KaravanIcons";
import {CamelUi} from "@designer/utils/CamelUi";
import '../project-topology/topology.css';
import {RouteDefinition} from "@core/model/CamelDefinition";
import {AutoStartupFalseIcon, ErrorHandlerIcon} from "@designer/icons/OtherIcons";
import {CustomNodeMetricAttachment} from "../project-topology/CustomNodeMetricAttachment";
import {runInAction} from "mobx";
import {SvgIcon} from "@shared/icons/SvgIcon";
import {useTopologyHook} from "../project-topology/useTopologyHook";
import {Category, IntentRequestScaleIn, IntentRequestScaleOut, Java} from "@carbon/icons-react";
import {NODE_DIAMETER_INOUT, NODE_DIAMETER_ROUTE} from "../project-topology/TopologyApi";
import {TemplatedRouteHook} from "../templated-route/TemplatedRouteHook";
import {useArchitectureStore} from "@stores/ArchitectureStore";
import {useCustomNodeHook} from "@page-project/project-topology/useCustomNodeHook";

function getIcon(data: any) {
    if (['route'].includes(data.icon)) {
        return (
            <g transform={`translate(14, 14) scale(2)`} className='icon-wrapper'>
                <Category/>
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
            <g transform={`translate(7, 7) scale(1.6)`}>
                {SvgIcon({icon: 'bean'})}
            </g>
        )
    } else if (data.icon === 'java') {
        return (
            <g transform={`translate(7, 7) scale(1.6)`}>
                <Java className={"carbon"}/>
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
                <OpenApiIcon width={32} height={32}/>
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
    return <></>;
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

function getAttachments(data: any, state: string) {
    const showStats = data?.showStats;
    const isRunning = state !== undefined;
    if (data && data?.step?.dslName === 'RouteDefinition') {
        const route: RouteDefinition = data?.step;
        const routeId = route?.id;
        const errorHandler = route?.errorHandler !== undefined;
        const metricGroup = (routeId && showStats ? <CustomNodeMetricAttachment type='route' routeId={routeId}/> : undefined);
        return (
            <g>
                {isRunning && <rect className={`halo-${state?.toLowerCase()}`} x="0" y="0" rx="15" ry="15" width={NODE_DIAMETER_ROUTE} height={NODE_DIAMETER_ROUTE}></rect>}
                {metricGroup}
                <g className="pf-topology__node__label__badge auto-start" transform="translate(-4, -4)">
                    {errorHandler && <g className="" transform="translate(13, -4)">{ErrorHandlerIcon()}</g>}
                    {isDisable(data) && <g className="" transform={`translate(${NODE_DIAMETER_ROUTE - 16}, ${NODE_DIAMETER_ROUTE -16})`}>{AutoStartupFalseIcon()}</g>}
                </g>
            </g>
        )
    } else if (data?.badge === 'component' && isRunning) {
        const xy = NODE_DIAMETER_INOUT / 2;
        const r = xy + 1;
        return (
            <g>
                <circle className={`halo-${data.state?.toLowerCase()}`} cx={xy} cy={xy} r={r}></circle>
            </g>
        )
    } else if (data && data.icon === 'openapi' && showStats) {
        return (
            <g>
                <CustomNodeMetricAttachment type='openapi'/>
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

function getTemplatedRouteDecorator(data: any, x: number, y: number, decoratorRef: React.Ref<any>, badge: string) {
    const templatedRouteDecorator = (
        <Decorator
            radius={9}
            padding={2}
            showBackground
            className="templated-route-decorator"
            icon={<LockedIcon width={12}/>}
            x={7}
            y={y - 7}
            innerRef={decoratorRef}
        />
    );
    return badge === 'TR' && templatedRouteDecorator;
}

function getUsedDecorator(data: any, x: number, y: number, decoratorRef: React.RefObject<any>) {
    const icon = <CheckCircleIcon/>;
    return (
        <Decorator
            radius={DEFAULT_DECORATOR_RADIUS * 1.5}
            x={NODE_DIAMETER_ROUTE/2}
            y={y - (NODE_DIAMETER_ROUTE/2)}
            showBackground
            className="variable-used-route-decorator"
            icon={icon}
            innerRef={decoratorRef}
        />
    );
}

const CustomNode: React.FC<any & WithContextMenuProps> = observer(({element, onContextMenu, contextMenuOpen, selected, ...rest}) => {

    const connectedToSelectedNodes = useArchitectureStore((s) => s.connectedToSelectedNodes);
    const selectedVariable = useArchitectureStore((s) => s.selectedVariable)
    const selectedBean = useArchitectureStore((s) => s.selectedBean)
    const {getRouteStatus} = useCustomNodeHook();
    const {selectFile, project} = useTopologyHook();
    const {openTemplatedRoutePanel} = TemplatedRouteHook();

    const trDecoratorRef = useRef(null);
    const variableDecoratorRef = useRef(null);
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
    const {x, y} = getDefaultShapeDecoratorCenter("lowerRight" as TopologyQuadrant, element);

    const state = getRouteStatus(data.routeId);
    const stateClassName = state !== undefined ? ' show-state' : "";
    const {width, height} = element.getDimensions();
    const hideContextMenuKebab = !['API', 'R'].includes(badge);
    const nodeLabelClass = !['API', 'R'].includes(badge) ? "pf-topology__node__label" : "pf-topology__node__label route-label";
    let className = "common-node common-node-" + badge + " topology-color-" + colorClass + " " + disableClass + stateClassName;
    if (connectedToSelectedNodes.includes(element.id)){
        className += " connected-selected"
    }
    const variableUsed = badge === 'R' && selectedVariable?.usages?.map(usage => usage.routeId).includes(data?.routeId);
    const beanUsed = badge === 'R' && selectedBean?.usages?.map(usage => usage.routeId).includes(data?.routeId);
    if ((selectedVariable !== null || selectedBean !== null) && !variableUsed && !beanUsed) {
        className += " not-used-node"
    }

    return (
        <g onDoubleClick={event => {
            event.stopPropagation();
            if (data.badge === 'TR') {
                openTemplatedRoutePanel(data?.templateId, data?.routeId, data?.fileName);
            } else {
                selectFile(data.fileName)
            }
        }}>
            <DefaultNode
                showStatusDecorator
                className={className}
                scaleLabel={true}
                element={element}
                attachments={getAttachments(data, state)}
                labelIconPadding={1}
                label={label}
                {...rest}
                showLabel={false}
                selected={selected}
            >
                {getIcon(data)}
                {getTemplatedRouteDecorator(data, x, y, trDecoratorRef, badge)}
                {(variableUsed || beanUsed) && getUsedDecorator(data, x, y, variableDecoratorRef)}
                <NodeLabel
                    x={width / 2}
                    y={height - (hideContextMenuKebab ? 5 : -4)}
                    paddingX={8}
                    paddingY={4}
                    className={nodeLabelClass}
                    onContextMenu={onContextMenu}
                    contextMenuOpen={contextMenuOpen}
                    hideContextMenuKebab={hideContextMenuKebab}
                >
                    {element.getLabel()?.substring(0, 30)}
                </NodeLabel>
            </DefaultNode>
        </g>
    )
})
export default CustomNode;