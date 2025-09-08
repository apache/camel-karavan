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
    BeanFactoryDefinition,
    DeleteDefinition,
    FromDefinition,
    GetDefinition,
    HeadDefinition,
    PatchDefinition,
    PostDefinition,
    PutDefinition,
    RestDefinition, RouteConfigurationDefinition, RouteDefinition, SagaDefinition,
} from '../model/CamelDefinition';
import {
    CamelElement,
    Integration,
} from '../model/IntegrationDefinition';
import {
    TopologyBeanNode,
    TopologyIncomingNode, TopologyOpenApiNode, TopologyOpenApiOperation,
    TopologyOutgoingNode,
    TopologyRestNode, TopologyRouteConfigurationNode,
    TopologyRouteNode,
} from '../model/TopologyDefinition';
import { ComponentApi, INTERNAL_COMPONENTS } from './ComponentApi';
import { CamelDefinitionApiExt } from './CamelDefinitionApiExt';
import { CamelDisplayUtil } from './CamelDisplayUtil';
import { CamelUtil } from './CamelUtil';

const outgoingDefinitions: string[] = ['ToDefinition', 'KameletDefinition', 'ToDynamicDefinition', 'PollEnrichDefinition', 'EnrichDefinition', 'WireTapDefinition', 'SagaDefinition', 'PollDefinition'];

export class ChildElement {
    constructor(public name: string = '', public className: string = '', public multiple: boolean = false) {
    }
}

export interface IncomingLink {
    name: string;
    fileName: string;
}

export class TopologyUtils {
    private constructor() {
    }

    static getOutgoingDefinitions = (): string[] => {
        return outgoingDefinitions;
    };

    static isElementInternalComponent = (element: CamelElement): boolean => {
        const uri = (element as any).uri;
        const component = ComponentApi.findByName(uri);
        if (INTERNAL_COMPONENTS.includes(uri?.split(':')?.[0])) return true;
        return component !== undefined && component.component.remote !== true;
    };

    static getConnectorType = (element: CamelElement): 'component' | 'kamelet' => {
        return CamelUtil.isKameletComponent(element) ? 'kamelet' : 'component';
    };

    static cutKameletUriSuffix = (uri: string): string => {
        if (uri.endsWith('-sink')) {
            return uri.substring(0, uri.length - 5);
        } else if (uri.endsWith('-source')) {
            return uri.substring(0, uri.length - 7);
        } else if (uri.endsWith('-action')) {
            return uri.substring(0, uri.length - 7);
        } else {
            return uri;
        }
    };

    static getUniqueUri = (element: CamelElement): string => {
        const uri: string = (element as any).uri || '';
        let result = uri.startsWith('kamelet') ? TopologyUtils.cutKameletUriSuffix(uri).concat(':') : uri.concat(':');
        const className = element.dslName;
        if (['FromDefinition', 'ToDefinition', 'ToDynamicDefinition', 'WireTapDefinition'].includes(className)) {
            if (!CamelUtil.isKameletComponent(element)) {
                const requiredProperties = CamelUtil.getComponentProperties(element).filter(p => p.required);
                for (const property of requiredProperties) {
                    const value = CamelDefinitionApiExt.getParametersValue(element, property.name, property.kind === 'path');
                    if (value !== undefined && property.type === 'string' && value.trim().length > 0) {
                        result = result + property.name + '=' + value + '&';
                    }
                }
            } else {
                const requiredProperties = CamelUtil.getKameletProperties(element, true);
                for (const property of requiredProperties) {
                    const value = CamelDefinitionApiExt.getParametersValue(element, property.id);
                    if (value !== undefined && property.type === 'string' && value.toString().trim().length > 0) {
                        result = result + property.id + '=' + value + '&';
                    }
                }
            }
        }
        return result.endsWith('&') ? result.substring(0, result.length - 1) : result;
    };

    static hasDirectUri = (element: CamelElement): boolean => {
        return this.hasUriStartWith(element, 'direct');
    };

    static hasSedaUri = (element: CamelElement): boolean => {
        return this.hasUriStartWith(element, 'seda');
    };

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
    };

    static findTopologyRestNodes = (integration: Integration[]): TopologyRestNode[] => {
        const result: TopologyRestNode[] = [];
        integration.forEach(i => {
            try {
                const filename = i.metadata.name;
                const routes = i.spec.flows?.filter(flow => flow.dslName === 'RestDefinition');
                routes?.forEach((rest: RestDefinition) => {
                    const uris: string[] = [];
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
                    const title = '' + (rest.description ? rest.description : rest.id);
                    result.push(new TopologyRestNode(rest.path || '', '' + rest.id, uris, title, filename, rest));
                });
            } catch (e) {
                console.error(e);
            }
        });
        return result;
    };


    static findTopologyOpenApiNodes = (json: string): TopologyOpenApiNode => {
        const operations: TopologyOpenApiOperation[] = [];
        let title = 'OpenAPI';

        try {
            const openapi = JSON.parse(json);

            // Get API title if available
            if (openapi.info && typeof openapi.info.title === "string") {
                title = openapi.info.title;
            }

            const HTTP_METHODS = [
                'get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'
            ];

            if (openapi.paths) {
                for (const path in openapi.paths) {
                    const pathItem = openapi.paths[path];

                    for (const method of HTTP_METHODS) {
                        if (pathItem[method]) {
                            const op = pathItem[method];
                            const operationId = op.operationId || '';
                            // Use operation summary, or description, or fallback to operationId
                            const opTitle =
                                op.summary ||
                                op.description ||
                                operationId ||
                                `${method.toUpperCase()} ${path}`;
                            operations.push(
                                new TopologyOpenApiOperation(
                                    path,
                                    opTitle,
                                    method.toUpperCase(),
                                    operationId
                                )
                            );
                        }
                    }
                }
            }
        } catch (err) {
            console.error(err);
        }
        return new TopologyOpenApiNode('openapi.json', title, operations);
    };

    static findTopologyIncomingNodes = (integration: Integration[]): TopologyIncomingNode[] => {
        const result: TopologyIncomingNode[] = [];
        integration.forEach(i => {
            try {
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
                result.push(...routeElements);
                const templates = i.spec.flows?.filter(flow => flow.dslName === 'RouteTemplateDefinition');
                const templateElements = templates?.map(t => {
                    const r = t.route;
                    const id = 'incoming-' + r.id;
                    const title = CamelDisplayUtil.getStepDescription(r.from);
                    const type = TopologyUtils.isElementInternalComponent(r.from) ? 'internal' : 'external';
                    const connectorType = TopologyUtils.getConnectorType(r.from);
                    const uniqueUri = TopologyUtils.getUniqueUri(r.from);
                    return new TopologyIncomingNode(id, type, connectorType, r.id, title, filename, r.from, uniqueUri);
                }) || [];
                result.push(...templateElements);
            } catch (e) {
                console.error(e);
            }
        });
        return result;
    };

    static findTopologyRouteNodes = (integration: Integration[]): TopologyRouteNode[] => {
        const result: TopologyRouteNode[] = [];
        integration.forEach(i => {
            try {
                const filename = i.metadata.name;
                const routes = i.spec.flows?.filter(flow => flow.dslName === 'RouteDefinition');
                const routeElements = routes?.map(r => {
                    const id = 'route-' + r.id;
                    const title = '' + (r.description ? r.description : r.id);
                    return new TopologyRouteNode(id, r.id, title, filename, r.from, r);
                }) || [];
                result.push(...routeElements);
                const templates = i.spec.flows?.filter(flow => flow.dslName === 'RouteTemplateDefinition');
                const templateElements = templates?.map(t => {
                    const r = t.route;
                    const id = 'route-' + r.id;
                    const title = '' + (r.description ? r.description : r.id);
                    return new TopologyRouteNode(id, r.id, title, filename, r.from, r, t.id, t.description);
                }) || [];
                result.push(...templateElements);
            } catch (e) {
                console.error(e);
            }
        });
        return result;
    };

    static findTopologyRouteConfigurationNodes = (integration: Integration[]): TopologyRouteConfigurationNode[] => {
        const result: TopologyRouteConfigurationNode[] = [];
        integration.forEach(i => {
            try {
                const filename = i.metadata.name;
                const routes = i.spec.flows?.filter(flow => flow.dslName === 'RouteConfigurationDefinition');
                const routeElements = routes?.map(r => {
                    const id = 'route-' + r.id;
                    const title = '' + (r.description ? r.description : (r.id || 'default'));
                    return new TopologyRouteConfigurationNode(id, r.id, title, filename, r);
                }) || [];
                result.push(...routeElements);
            } catch (e) {
                console.error(e);
            }
        });
        return result;
    };

    static findTopologyRouteOutgoingNodes = (integrations: Integration[]): TopologyOutgoingNode[] => {
        const result: TopologyOutgoingNode[] = [];
        integrations.forEach(i => {
            try {
                const filename = i.metadata.name;
                const routes = i.spec.flows?.filter(flow => flow.dslName === 'RouteDefinition') || [];
                const routeFromTemplates = i.spec.flows?.filter(flow => flow.dslName === 'RouteTemplateDefinition').map(rt => rt.route) || [];
                routes.concat(routeFromTemplates).forEach(route => {
                    const from: FromDefinition = route.from;
                    const elements = TopologyUtils.findOutgoingInStep(from, []);
                    elements.forEach((e: any) => {
                        const id = 'outgoing-' + route.id + '-' + e.id;
                        const title = CamelDisplayUtil.getStepDescription(e);
                        const type = TopologyUtils.isElementInternalComponent(e) ? 'internal' : 'external';
                        const connectorType = TopologyUtils.getConnectorType(e);
                        const uniqueUri = TopologyUtils.getUniqueUri(e);
                        if (
                            connectorType !== 'kamelet' ||
                            CamelUtil.getKamelet(e)?.metadata.labels['camel.apache.org/kamelet.type'] !== 'action'
                        ) {
                            result.push(new TopologyOutgoingNode(id, type, connectorType, route.id, title, filename, e, uniqueUri));
                        }
                    });
                    result.push(...TopologyUtils.findDeadLetterChannelNodes(route, filename));
                });
            } catch (e) {
                console.error(e);
            }
        });
        return result;
    };

    static findDeadLetterChannelNodes(route: RouteDefinition, filename: string): TopologyOutgoingNode[] {
        const result: TopologyOutgoingNode[] = [];
        try {
            const deadLetterChannel = route.errorHandler?.deadLetterChannel;
            const deadLetterUri = deadLetterChannel?.deadLetterUri;
            if (deadLetterChannel !== undefined && deadLetterUri !== undefined) {
                const parts = deadLetterUri.split(':');
                if (parts.length > 1 && INTERNAL_COMPONENTS.includes(parts[0])) {
                    const id = 'outgoing-' + route.id + '-' + deadLetterChannel?.id;
                    const title = CamelDisplayUtil.getStepDescription(deadLetterChannel);
                    const type = 'internal';
                    const connectorType = 'component';
                    result.push(new TopologyOutgoingNode(id, type, connectorType, route.id || '', title, filename, deadLetterChannel, deadLetterUri));
                }
            }
        } catch (e) {
            console.error(e);
        }
        return result;
    }

    static findTopologyRouteConfigurationOutgoingNodes = (integrations: Integration[]): TopologyOutgoingNode[] => {
        const result: TopologyOutgoingNode[] = [];
        integrations.forEach(i => {
            try {
                const filename = i.metadata.name;
                const rcs = i.spec.flows?.filter(flow => flow.dslName === 'RouteConfigurationDefinition');
                rcs?.forEach((rc: RouteConfigurationDefinition) => {
                    const children: CamelElement[] = [];
                    children.push(...rc.intercept || []);
                    children.push(...rc.interceptFrom || []);
                    children.push(...rc.interceptSendToEndpoint || []);
                    children.push(...rc.onCompletion || []);
                    children.push(...rc.onException || []);
                    children.forEach(child => {
                        const elements = TopologyUtils.findOutgoingInStep(child, []);
                        elements.forEach((e: any) => {
                            const id = 'outgoing-' + rc.id + '-' + e.id;
                            const title = CamelDisplayUtil.getStepDescription(e);
                            const type = TopologyUtils.isElementInternalComponent(e) ? 'internal' : 'external';
                            const connectorType = TopologyUtils.getConnectorType(e);
                            const uniqueUri = TopologyUtils.getUniqueUri(e);
                            result.push(new TopologyOutgoingNode(id, type, connectorType, rc.id || 'undefined', title, filename, e, uniqueUri));
                        });
                    });
                    if (rc.errorHandler?.deadLetterChannel) {
                        const e = rc.errorHandler?.deadLetterChannel;
                        const id = 'outgoing-' + rc.id + '-' + e.id;
                        const title = CamelDisplayUtil.getStepDescription(e);
                        const comp = e?.deadLetterUri?.split(':')?.[0];
                        const type = INTERNAL_COMPONENTS.includes(comp) ? 'internal' : 'external';
                        const connectorType = 'component';
                        const uniqueUri = e?.deadLetterUri;
                        result.push(new TopologyOutgoingNode(id, type, connectorType, rc.id || 'undefined', title, filename, e, uniqueUri));
                    }
                });
            } catch (e) {
                console.error(e);
            }
        });
        return result;
    };

    static findTopologyBeanNodes = (integrations: Integration[]): TopologyBeanNode[] => {
        const result: TopologyBeanNode[] = [];
        integrations.forEach(integration => {
            const beans = TopologyUtils.getBeans(integration);
            const topologyBeans = beans.map((bean) => new TopologyBeanNode(bean.name, bean.name, integration.metadata.name));
            result.push(...topologyBeans);
        })
        return result;
    }

    static getBeans = (integration: Integration): BeanFactoryDefinition[] => {
        const result: BeanFactoryDefinition[] = [];
        const beans = integration.spec.flows?.filter((e: any) => e.dslName === 'Beans');
        if (beans && beans.length > 0 && beans[0].beans) {
            result.push(...beans[0].beans);
        }
        return result;
    }

    static findOutgoingInStep = (step: CamelElement, result: CamelElement[]): CamelElement[] => {
        if (step !== undefined) {
            const el = (step as any);
            try {
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
                    });
                }
            } catch (e) {
                console.error(e);
            }
        }
        return result;
    };

    static findOutgoingInSteps = (steps: CamelElement[], result: CamelElement[]): CamelElement[] => {
        if (steps !== undefined && steps.length > 0) {
            steps.forEach(step => TopologyUtils.findOutgoingInStep(step, result));
        }
        return result;
    };

    static getNodeIdByUriAndName(tins: TopologyIncomingNode[], uri: string, name: string): string | undefined {
        if (uri && name) {
            const node = tins
                .filter(r => r.from.uri === uri
                    && (r?.from?.parameters?.name === name || r?.from?.parameters?.address === name),
                ).at(0);
            if (node) {
                return node.id;
            }
        }
    }

    static getNodeIdByUri(tins: TopologyIncomingNode[], uri: string): string | undefined {
        const parts = uri.split(':');
        if (parts.length > 1) {
            return TopologyUtils.getNodeIdByUriAndName(tins, parts[0], parts[1]);
        }
    }

    static getRouteIdByUriAndName(tins: TopologyIncomingNode[], uri: string, name: string): string | undefined {
        if (uri && name) {
            const node = tins
                .filter(r => r.from.uri === uri
                    && (r?.from?.parameters?.name === name || r?.from?.parameters?.address === name),
                ).at(0);
            if (node) {
                return 'route-' + node.routeId;
            }
        }
    }

    static getIncomingNodeByUniqueUri(tins: TopologyIncomingNode[], uniqueUri: string): TopologyIncomingNode [] {
        const result: TopologyIncomingNode[] = [];
        tins.filter(r => r.uniqueUri === uniqueUri)
            ?.forEach(node => result.push(node));
        return result;
    }

    static getOutgoingNodeByUniqueUri(tins: TopologyOutgoingNode[], uniqueUri: string): TopologyOutgoingNode [] {
        const result: TopologyOutgoingNode[] = [];
        tins.filter(r => r.uniqueUri === uniqueUri)
            ?.forEach(node => result.push(node));
        return result;
    }

    static getRouteIdByUri(tins: TopologyIncomingNode[], uri: string): string | undefined {
        const parts = uri.split(':');
        if (parts.length > 1) {
            return TopologyUtils.getRouteIdByUriAndName(tins, parts[0], parts[1]);
        }
    }

    static getIncomingLinkMap(integrations: Integration[], openApiJson?: string): Map<string, IncomingLink[]> {
        const data = new Map<string, IncomingLink[]>();
        TopologyUtils.findTopologyRouteOutgoingNodes(integrations).forEach(t => {
            const key = (t.step as any)?.uri + ':' + (t.step as any)?.parameters?.name;
            if (data.has(key)) {
                const list = data.get(key) || [];
                list.push({name: t.routeId, fileName: t.fileName});
                data.set(key, list);
            } else {
                data.set(key, [{name: t.routeId, fileName: t.fileName}]);
            }
        });
        TopologyUtils.findTopologyRestNodes(integrations).forEach(t => {
            t.rest?.get?.forEach(def => {
                if (def.to) {
                    data.set(def.to, [{name: 'get:' + (def.path || ''), fileName: t.fileName}])
                }
            })
            t.rest?.post?.forEach(def => {
                if (def.to) {
                    data.set(def.to, [{name: 'post:' + (def.path || ''), fileName: t.fileName}])
                }
            })
            t.rest?.delete?.forEach(def => {
                if (def.to) {
                    data.set(def.to, [{name: 'delete:' + (def.path || ''), fileName: t.fileName}])
                }
            })
            t.rest?.patch?.forEach(def => {
                if (def.to) {
                    data.set(def.to, [{name: 'patch:' + (def.path || ''), fileName: t.fileName}])
                }
            })
            t.rest?.head?.forEach(def => {
                if (def.to) {
                    data.set(def.to, [{name: 'head:' + (def.path || ''), fileName: t.fileName}])
                }
            })
        });
        if (openApiJson) {
            const nodes = TopologyUtils.findTopologyOpenApiNodes(openApiJson);
            nodes.operations.filter(o => o.operationId?.length > 0)
                .forEach((operation) => {
                    const uri = 'direct:' + operation.operationId;
                    const newLink: IncomingLink = {name: `${operation.method} ${operation.path}`, fileName: nodes.fileName};
                    const currentLinks = data.get(uri);
                    if (currentLinks) {
                        data.set(uri, [...currentLinks, newLink]);
                    } else {
                        data.set(uri, [newLink]);
                    }
                })
        }
        return data;
    }
}
