import {ProjectFile} from "../api/ProjectModels";
import {BeanFactoryDefinition} from "karavan-core/lib/model/CamelDefinition";
import {Integration, KameletTypes, MetadataLabels} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {CamelUi} from "../designer/utils/CamelUi";
import {KameletApi} from "karavan-core/lib/api/KameletApi";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";

export class CodeUtils {

    static getBeans(files: ProjectFile[]): BeanFactoryDefinition[] {
        const result: BeanFactoryDefinition[] = [];
        CodeUtils.getIntegrations(files).forEach(integration => {
            const beans = CamelUi.getBeans(integration);
            result.push(...beans);
        })
        return result;
    }

    static getIntegrations(files: ProjectFile[]): Integration[] {
        return files
            .filter(f => f.name.endsWith('.camel.yaml'))
                .map(f => CamelDefinitionYaml.yamlToIntegration(f.name, f.code));
    }

    static getPropertyPlaceholders(files: ProjectFile[]): string[] {
        const result: string[] = []
        const code = CodeUtils.getPropertyCode(files);
        if (code) {
            const lines = code.split('\n').map((line) => line.trim());
            lines
                .filter(line => !line.startsWith("camel.") && !line.startsWith("jkube.") && !line.startsWith("jib."))
                .filter(line => line !== undefined && line !== null && line.length > 0)
                .forEach(line => {
                    const parts = line.split("=");
                    if (parts.length > 0) {
                        result.push(parts[0]);
                    }
                })
        }
        return result;
    }

    static getPropertyCode(files: ProjectFile[]) {
        const file = files.filter(f => f.name === 'application.properties')?.at(0);
        return file?.code;
    }

    static getCodeForNewFile(fileName: string, type: string, copyFromKamelet?: string): string {
        if (type === 'INTEGRATION') {
            return CamelDefinitionYaml.integrationToYaml(Integration.createNew(fileName, 'plain'));
        } else if (type === 'KAMELET') {
            const filenameParts = fileName.replace('.kamelet.yaml', '').split('-');
            const name = filenameParts.join('-');
            const type: string | undefined = filenameParts.slice(-1)[0]
            const kameletType: KameletTypes | undefined = (type === "sink" || type === "source" || type === "action") ? type : undefined;
            const integration = Integration.createNew(name, 'kamelet');
            const meta: MetadataLabels = new MetadataLabels({"camel.apache.org/kamelet.type": kameletType});
            integration.metadata.labels = meta;
            if (copyFromKamelet !== undefined && copyFromKamelet !== '') {
                const kamelet= KameletApi.getKamelets().filter(k => k.metadata.name === copyFromKamelet).at(0);
                if (kamelet) {
                    (integration as any).spec = kamelet.spec;
                    (integration as any).metadata.labels = kamelet.metadata.labels;
                    (integration as any).metadata.annotations = kamelet.metadata.annotations;
                    const i = CamelUtil.cloneIntegration(integration);
                    return CamelDefinitionYaml.integrationToYaml(i);
                }
            }
            return CamelDefinitionYaml.integrationToYaml(integration);
        } else {
            return '';
        }
    }
}