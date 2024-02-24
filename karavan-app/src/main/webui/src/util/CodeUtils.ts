import {ProjectFile} from "../api/ProjectModels";
import {RegistryBeanDefinition} from "karavan-core/lib/model/CamelDefinition";
import {Integration} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {CamelUi} from "../designer/utils/CamelUi";

export class CodeUtils {

    static getBeans(files: ProjectFile[]): RegistryBeanDefinition[] {
        const result: RegistryBeanDefinition[] = [];
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
}