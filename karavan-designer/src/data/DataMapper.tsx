/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, {RefObject} from 'react';
import {
    Button,
    PageSection,
    PageSectionVariants,
    Tooltip,
    TreeView
} from '@patternfly/react-core';
import '../designer/karavan.css';
import './datamapper.css';
import AngleDoubleRightIcon from '@patternfly/react-icons/dist/esm/icons/arrow-alt-circle-right-icon';
import CollapseIcon from '@patternfly/react-icons/dist/esm/icons/angle-double-right-icon';
import ExpandIcon from '@patternfly/react-icons/dist/esm/icons/angle-double-down-icon';
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";
import DownloadImageIcon from "@patternfly/react-icons/dist/esm/icons/image-icon";
import AddIcon from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import {DataMappingConnections} from "./DataMappingConnections";
import {TreeViewDataItem} from "@patternfly/react-core/components";
import {DataTreeItem} from "./DataTreeItem";
import {ConnectionPoint, ConnectionsRect, Exchange, ExchangeElement} from "./DataMapperModel";

interface Props {
    dark: boolean
    tab?: string
}

interface State {
    source: any [],
    target: any [],
    transformation: any [],
    activeItems1: any [],
    activeItems2: any [],
    ref1: RefObject<HTMLDivElement>,
    ref2: RefObject<HTMLDivElement>,
    connections: ConnectionsRect,
    startingPoint: ConnectionPoint,
    movingPoint: ConnectionPoint
}

export class DataMapper extends React.Component<Props, State> {

    state: State = {
        activeItems1: [],
        activeItems2: [],
        source: [new Exchange({defaultExpanded: true})],
        target: [new Exchange({defaultExpanded: true})],
        transformation: [new ExchangeElement({id: "xxx", name: "new java.util.Date()", customBadgeContent: "java"})],
        ref1: React.createRef(),
        ref2: React.createRef(),
        connections: {top: 0, left: 0, width: 0, height: 0},
        startingPoint: new ConnectionPoint(0,0),
        movingPoint: new ConnectionPoint(2000,2000)
    }

    ref1: RefObject<HTMLDivElement> = React.createRef();
    ref2: RefObject<HTMLDivElement> = React.createRef();

    interval: any;

    componentDidMount() {
        this.onRefresh();
        this.interval = setInterval(() => this.onRefresh(), 300);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    onRefresh = () => {
        const source = this.ref1.current?.children[0]?.children[0]?.getBoundingClientRect();
        const target = this.ref2.current?.children[0]?.children[0]?.getBoundingClientRect();
        const sourceTop = source?.top || 0;
        const sourceLeft = source?.left || 0;
        const sourceHeight = source?.height || 0;
        const sourceWidth = source?.width || 0;
        const targetTop = target?.top || 0;
        const targetLeft = target?.left || 0;
        const targetHeight = target?.height || 0;
        const targetWidth = target?.width || 0;
        const height = (sourceTop + sourceHeight > targetTop + targetHeight)
            ? (sourceTop + sourceHeight)
            : (targetTop + targetHeight);
        const width = targetLeft + targetWidth - sourceLeft;
        this.setState({connections: new ConnectionsRect(width, height, sourceTop, sourceLeft)})
    }


    onSelect = (evt: any, treeViewItem: any) => {
        // Ignore folders for selection
        if (treeViewItem && !treeViewItem.children) {
            this.setState({
                activeItems1: [treeViewItem],
                activeItems2: [treeViewItem]
            });
        }
    }

    onDragStart = (rect: DOMRect) => {
        const top = rect.top + (rect.height / 2);
        const left = rect.left + rect.width;
        this.setState({startingPoint: new ConnectionPoint(top, left)})
    }

    onMoving = (clientX: number, clientY: number) => {
        this.setState({movingPoint: new ConnectionPoint(clientY, clientX)})
    }

    private onMapElements(source: ExchangeElement, target: ExchangeElement) {
        this.setState({startingPoint: new ConnectionPoint(0, 0), movingPoint: new ConnectionPoint(0, 0),})
    }

    convertTreeItem(items: any [], type: 'source' | 'target' | 'transformation'): TreeViewDataItem[] {
        return items.map((value: any) => this.convertTreeItems(value, type));
    }

    convertTreeItems(value: any, type: 'source' | 'target' | 'transformation'): TreeViewDataItem {
        return {
            id: value.id,
            name: <DataTreeItem element={value}
                                type={type}
                                onDragStart={this.onDragStart}
                                onMoving={this.onMoving}
                                onMapElements={(source, target) => this.onMapElements(source, target)}/>,
            children: value.children ? this.convertTreeItem(value.children, type) : undefined,
            defaultExpanded: value.id === 'exchange',
            action: value.id === 'headers' ? <Button variant={"plain"} icon={<AddIcon/>}/> : undefined,
            customBadgeContent: value.customBadgeContent
        }
    }

    render() {
        const {activeItems1, startingPoint, movingPoint, source, target, transformation, connections} = this.state;
        return (
            <PageSection variant={this.props.dark ? PageSectionVariants.darker : PageSectionVariants.light} className="page" isFilled padding={{default: 'noPadding'}}>
                <DataMappingConnections rect={connections} moving={movingPoint} starting={startingPoint}/>
                <div className="exchange-mapper">
                    <div className="exchange-tree-panel">
                        <div className="data-toolbar">
                            <div className="panel-header">
                                Source
                            </div>
                        </div>
                        <div className="exchange-tree-parent source" ref={this.ref1}>
                            <TreeView data={this.convertTreeItem(source, 'source')} activeItems={activeItems1} hasBadges hasGuides/>
                        </div>
                    </div>
                    <div className="exchange-tree-panel">
                        <div className="data-toolbar">
                            <div className="panel-header">
                                Transformation
                            </div>
                            <Tooltip content="Add Transformation" position={"left"}>
                                <Button variant="plain" icon={<AddIcon/>} onClick={e => {
                                }}>
                                </Button>
                            </Tooltip>
                        </div>
                        <div className="exchange-tree-parent transformation">
                            <TreeView data={transformation} hasSelectableNodes={false}/>
                        </div>
                    </div>
                    <div className="exchange-tree-panel">
                        <div className="data-toolbar">
                            <div className="panel-header">
                                Target
                            </div>
                        </div>
                        <div className="exchange-tree-parent target" ref={this.ref2}>
                            <TreeView data={this.convertTreeItem(target, 'target')} hasBadges hasGuides/>
                        </div>
                    </div>
                </div>
            </PageSection>
        )
    }
}