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
import {
    DeleteDefinition,
    FromDefinition,
    GetDefinition,
    HeadDefinition,
    PatchDefinition,
    PostDefinition,
    PutDefinition,
    RestDefinition, SagaDefinition,
} from '../model/CamelDefinition';
import {
    CamelElement,
    Integration,
} from '../model/IntegrationDefinition';
import {
    TopologyIncomingNode,
    TopologyOutgoingNode,
    TopologyRestNode,
    TopologyRouteNode,
} from '../model/TopologyDefinition';
import { ComponentApi } from './ComponentApi';
import { CamelDefinitionApiExt } from './CamelDefinitionApiExt';
import { CamelDisplayUtil } from './CamelDisplayUtil';
import { CamelMetadataApi } from '../model/CamelMetadata';
import { CamelUtil } from './CamelUtil';

const outgoingDefinitions: string[] = ['ToDefinition', 'KameletDefinition', 'ToDynamicDefinition', "PollEnrichDefinition", "EnrichDefinition", "WireTapDefinition", "SagaDefinition"];

export class ChildElement {
    constructor(public name: string = '', public className: string = '', public multiple: boolean = false) {}
}

export class TopologyUtils {
    private constructor() {}

    static getOutgoingDefinitions = (): string[] => {
        return outgoingDefinitions;
    }

    static isElementInternalComponent = (element: CamelElement): boolean => {
        const uri = (element as any).uri;
        const component = ComponentApi.findByName(uri);
        return component !== undefined &&
            (TopologyUtils.isComponentInternal(component.component.label) || TopologyUtils.hasInternalUri(element));
    }

    static getConnectorType = (element: CamelElement): 'component' | 'kamelet' => {
        return CamelUtil.isKameletComponent(element) ? 'kamelet' : 'component';
    }

    static cutKameletUriSuffix = (uri: string): string => {
        if (uri.endsWith("-sink")) {
            return uri.substring(0, uri.length - 5);
        } else if (uri.endsWith("-source")) {
            return uri.substring(0, uri.length - 7);
        } else if (uri.endsWith("-action")) {
            return uri.substring(0, uri.length - 7);
        } else {
            return uri;
        }
    }

    static getUniqueUri = (element: CamelElement): string => {
        const uri:string = (element as any).uri || '';
        let result = uri.startsWith("kamelet") ? TopologyUtils.cutKameletUriSuffix(uri).concat(":") : uri.concat(":");
        const className = element.dslName;
        if (className === 'FromDefinition' || className === 'ToDefinition') {
            if (!CamelUtil.isKameletComponent(element)) {
                const requiredProperties = CamelUtil.getComponentProperties(element).filter(p => p.required);
                for (const property of requiredProperties) {
                    const value = CamelDefinitionApiExt.getParametersValue(element, property.name, property.kind === 'path');
                    if (value !== undefined && property.type === 'string' && value.trim().length > 0) {
                        result = result + property.name + "=" + value + "&";
                    }
                }
            } else {
                const requiredProperties = CamelUtil.getKameletProperties(element, true);
                for (const property of requiredProperties) {
                    const value = CamelDefinitionApiExt.getParametersValue(element, property.id);
                    if (value !== undefined && property.type === 'string' && value.trim().length > 0) {
                        result = result + property.id + "=" + value + "&";
                    }
                }
            }
        }
        return result.endsWith("&") ? result.substring(0, result.length - 1) : result;
    }

    static isComponentInternal = (label: string): boolean => {
        const labels = label.split(",");
        if (labels.includes('core') && (
            labels.includes('transformation')
            || labels.includes('testing')
            || labels.includes('scheduling')
            || labels.includes('monitoring')
            || labels.includes('transformation')
            || labels.includes('java')
            || labels.includes('endpoint')
            || labels.includes('script')
            || labels.includes('validation')
        )) {
            return true;
        } else if (label === 'transformation') {
            return true;
        }
        return false;
    }

    static hasInternalUri = (element: CamelElement): boolean => {
        return this.hasDirectUri(element) || this.hasSedaUri(element);
    }

    static hasDirectUri = (element: CamelElement): boolean => {
        return this.hasUriStartWith(element, 'direct');
    }

    static hasSedaUri = (element: CamelElement): boolean => {
        return this.hasUriStartWith(element, 'seda');
    }

    static hasUriStartWith = (element: CamelElement, text: string): boolean => {
        if ((element as any).uri && typeof (element as any).uri === 'string') {
            return (element as any).uri.startsWith(text);
        } else if (element.dslName === 'SagaDefinition') {
            const completion = (element as SagaDefinition).completion || '';
            const compensation = (element as SagaDefinition).compensation || '';
            return completion.startsWith(text) || compensation.startsWith(text);
        } else {
            return false;
        }
    }

    static findTopologyRestNodes = (integration: Integration[]): TopologyRestNode[] => {
        const result:TopologyRestNode[] = [];
        integration.forEach(i => {
            const filename = i.metadata.name;
            const uris: string[] = [];
            const routes = i.spec.flows?.filter(flow => flow.dslName === 'RestDefinition');
            routes?.forEach((rest: RestDefinition) => {
                rest?.get?.forEach((d: GetDefinition) => {
                    if (d.to) uris.push(d.to);
                });
                rest?.post?.forEach((d: PostDefinition) => {
                    if (d.to) uris.push(d.to);
                });
                rest?.put?.forEach((d: PutDefinition) => {
                    if (d.to) uris.push(d.to);
                });
                rest?.delete?.forEach((d: DeleteDefinition) => {
                    if (d.to) uris.push(d.to);
                });
                rest?.patch?.forEach((d: PatchDefinition) => {
                    if (d.to) uris.push(d.to);
                });
                rest?.head?.forEach((d: HeadDefinition) => {
                    if (d.to) uris.push(d.to);
                });
                const title = 'REST: ' + (rest.description ? rest.description : rest.id);
                result.push(new TopologyRestNode(rest.path || '', '' + rest.id, uris, title, filename, rest))
            })
        })
        return result;
    };

    static findTopologyIncomingNodes = (integration: Integration[]): TopologyIncomingNode[] => {
        const result:TopologyIncomingNode[] = [];
        integration.forEach(i => {
            const filename = i.metadata.name;
            const routes = i.spec.flows?.filter(flow => flow.dslName === 'RouteDefinition');
            const routeElements = routes?.map(r => {
                const id = 'incoming-' + r.id;
                const title = CamelDisplayUtil.getStepDescription(r.from);
                const type = TopologyUtils.isElementInternalComponent(r.from) ? 'internal' : 'external';
                const connectorType = TopologyUtils.getConnectorType(r.from);
                const uniqueUri = TopologyUtils.getUniqueUri(r.from);
                return new TopologyIncomingNode(id, type, connectorType, r.id, title, filename, r.from, uniqueUri);
            }) || [];
            result.push(...routeElements)
        })
        return result;
    }

    static findTopologyRouteNodes = (integration: Integration[]): TopologyRouteNode[] => {
        const result:TopologyRouteNode[] = [];
        integration.forEach(i => {
            const filename = i.metadata.name;
            const routes = i.spec.flows?.filter(flow => flow.dslName === 'RouteDefinition');
            const routeElements = routes?.map(r => {
                const id = 'route-' + r.id;
                const title = '' + (r.description ? r.description : r.id)
                return new TopologyRouteNode(id, r.id, title, filename, r.from, r);
            }) || [];
            result.push(...routeElements)
        })
        return result;
    }

    static findTopologyOutgoingNodes = (integration: Integration[]): TopologyOutgoingNode[] => {
        const result:TopologyOutgoingNode[] = [];
        integration.forEach(i => {
            const filename = i.metadata.name;
            const routes = i.spec.flows?.filter(flow => flow.dslName === 'RouteDefinition');
            routes?.forEach(route => {
                const from: FromDefinition = route.from;
                const elements = TopologyUtils.findOutgoingInStep(from, []);
                elements.forEach((e: any) => {
                    const id = 'outgoing-' + route.id + '-' + e.id;
                    const title = CamelDisplayUtil.getStepDescription(e);
                    const type = TopologyUtils.isElementInternalComponent(e) ? 'internal' : 'external';
                    const connectorType = TopologyUtils.getConnectorType(e);
                    const uniqueUri = TopologyUtils.getUniqueUri(e);
                    result.push(new TopologyOutgoingNode(id, type, connectorType, route.id, title, filename, e, uniqueUri));
                })
            })

        })
        return result;
    }

    static findOutgoingInStep = (step: CamelElement, result: CamelElement[]): CamelElement[] => {
        if (step !== undefined) {
            const el = (step as any);
            if (outgoingDefinitions.includes(el.dslName)) {
                result.push(step);
            } else {
                const childElements = CamelDefinitionApiExt.getElementChildrenDefinition(el.dslName);
                childElements.forEach(child => {
                    if (child.multiple) {
                        const sub = (el[child.name] as CamelElement[]);
                        TopologyUtils.findOutgoingInSteps(sub, result);
                    } else {
                        const sub = (el[child.name] as CamelElement);
                        TopologyUtils.findOutgoingInStep(sub, result);
                    }
                })
            }
        }
        return result;
    }

    static findOutgoingInSteps = (steps: CamelElement[], result: CamelElement[]): CamelElement[] => {
        if (steps !== undefined && steps.length > 0) {
            steps.forEach(step => TopologyUtils.findOutgoingInStep(step, result))
        }
        return result;
    }

    static getNodeIdByUriAndName(tins: TopologyIncomingNode[], uri: string, name: string): string | undefined {
        if (uri && name) {
            const node =  tins
                .filter(r => r.from.uri === uri && r?.from?.parameters?.name === name).at(0);
            if (node) {
                return node.id;
            }
        }
    }

    static getNodeIdByUri(tins: TopologyIncomingNode[], uri: string): string | undefined {
        const parts = uri.split(":");
        if (parts.length > 1) {
            return TopologyUtils.getNodeIdByUriAndName(tins, parts[0], parts[1])
        }
    }

    static getRouteIdByUriAndName(tins: TopologyIncomingNode[], uri: string, name: string): string | undefined {
        if (uri && name) {
            const node =  tins
                .filter(r => r.from.uri === uri && r?.from?.parameters?.name === name).at(0);
            if (node) {
                return 'route-' + node.routeId;
            }
        }
    }

    static getNodeIdByUniqueUri(tins: TopologyIncomingNode[], uniqueUri: string): string | undefined {
        const node =  tins
            .filter(r => r.uniqueUri === uniqueUri).at(0);
        if (node) {
            return node.id;
        }
    }

    static getRouteIdByUri(tins: TopologyIncomingNode[], uri: string): string | undefined {
        const parts = uri.split(":");
        if (parts.length > 1) {
            return TopologyUtils.getRouteIdByUriAndName(tins, parts[0], parts[1])
        }
    }
}
