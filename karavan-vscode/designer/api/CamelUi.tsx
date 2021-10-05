import {KameletApi} from "./KameletApi";
import {CamelElement} from "../model/CamelModel";
import {Kamelet, Property} from "../model/KameletModels";
import {DslMetaModel} from "../model/DslMetaModel";
import {Metadata} from "./CamelMetadata";

const DslElements: string[] = [
    "aggregate",
    "choice",
    // "circuitBreaker",
    "convertBodyTo",
    "doTry",
    "dynamicRouter",
    "enrich",
    "filter",
    "log",
    "loop",
    "marshal",
    "multicast",
    "pollEnrich",
    "recipientList",
    "removeHeader",
    "removeHeaders",
    "resequence",
    "saga",
    "setBody",
    "setHeader",
    "sort",
    "split",
    "threads",
    "throttle",
    "to",
    "toD",
    "transform",
    "unmarshal",
    "validate",
    "wireTap",
];
const DslLabels = ["routing", "transformation", "error", "configuration"];
const KameletLabels = ["source", "sink", "action"];
const defaultIcon =
    "data:image/svg+xml,%3Csvg viewBox='0 0 130.21 130.01' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='a' x1='333.48' x2='477' y1='702.6' y2='563.73' gradientTransform='translate(94.038 276.06) scale(.99206)' gradientUnits='userSpaceOnUse'%3E%3Cstop stop-color='%23F69923' offset='0'/%3E%3Cstop stop-color='%23F79A23' offset='.11'/%3E%3Cstop stop-color='%23E97826' offset='.945'/%3E%3C/linearGradient%3E%3ClinearGradient id='b' x1='333.48' x2='477' y1='702.6' y2='563.73' gradientTransform='translate(94.038 276.06) scale(.99206)' gradientUnits='userSpaceOnUse'%3E%3Cstop stop-color='%23F69923' offset='0'/%3E%3Cstop stop-color='%23F79A23' offset='.08'/%3E%3Cstop stop-color='%23E97826' offset='.419'/%3E%3C/linearGradient%3E%3ClinearGradient id='c' x1='633.55' x2='566.47' y1='814.6' y2='909.12' gradientTransform='translate(-85.421 56.236)' gradientUnits='userSpaceOnUse'%3E%3Cstop stop-color='%23f6e423' offset='0'/%3E%3Cstop stop-color='%23F79A23' offset='.412'/%3E%3Cstop stop-color='%23E97826' offset='.733'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cg transform='translate(-437.89 -835.29)'%3E%3Ccircle cx='503.1' cy='900.29' r='62.52' fill='url(%23a)' stroke='url(%23b)' stroke-linejoin='round' stroke-width='4.96'/%3E%3Cpath d='M487.89 873.64a89.53 89.53 0 0 0-2.688.031c-1.043.031-2.445.362-4.062.906 27.309 20.737 37.127 58.146 20.25 90.656.573.015 1.142.063 1.719.063 30.844 0 56.62-21.493 63.28-50.312-19.572-22.943-46.117-41.294-78.5-41.344z' fill='url(%23c)' opacity='.75'/%3E%3Cpath d='M481.14 874.58c-9.068 3.052-26.368 13.802-43 28.156 1.263 34.195 28.961 61.607 63.25 62.5 16.877-32.51 7.06-69.919-20.25-90.656z' fill='%2328170b' opacity='.75'/%3E%3Cpath d='M504.889 862.546c-.472-.032-.932.028-1.375.25-5.6 2.801 0 14 0 14-16.807 14.009-13.236 37.938-32.844 37.938-10.689 0-21.322-12.293-32.531-19.812-.144 1.773-.25 3.564-.25 5.375 0 24.515 13.51 45.863 33.469 57.063 5.583-.703 11.158-2.114 15.344-4.906 21.992-14.662 27.452-42.557 36.438-56.031 5.596-8.407 31.824-7.677 33.594-11.22 2.804-5.601-5.602-14-8.406-14h-22.406c-1.566 0-4.025-2.78-5.594-2.78h-8.406s-3.725-5.65-7.031-5.875z' fill='%23fff'/%3E%3C/g%3E%3C/svg%3E";

export class CamelUi {
    static getSelectorLabels = (
        parentType: string
    ): [string, "element" | "kamel"][] => {
        switch (parentType) {
            case "":
                return [
                    ["routing", "element"],
                    ["source", "kamel"],
                ];
            case "choice":
                return [["routing", "element"]];
            default:
                const r: [string, "element" | "kamel"][] = DslLabels.map((value) => [
                    value,
                    "element",
                ]);
                r.push(["sink", "kamel"]);
                r.push(["action", "kamel"]);
                return r;
        }
    };

    static sortSelectorModels = (models: DslMetaModel[]): DslMetaModel[] => {
        return models.sort((a, b) => (a.title > b.title ? 1 : -1));
    };
    static getSelectorModels = (
        label: string,
        type: "element" | "kamel",
        parentDslName: string
    ): DslMetaModel[] => {
        if (type === "element") {
            if (parentDslName === undefined || parentDslName.length === 0) {
                return Metadata.filter((m) => m.name === "from").map(
                    (m) =>
                        new DslMetaModel({
                            name: m.name,
                            title: m.title,
                            description: m.description,
                        })
                );
            } else if (parentDslName === "choice") {
                return Metadata.filter((m) =>
                    ["when", "otherwise"].includes(m.name)
                ).map(
                    (m) =>
                        new DslMetaModel({
                            name: m.name,
                            title: m.title,
                            description: m.description,
                        })
                );
            } else {
                return Metadata.filter((m) => DslElements.includes(m.name))
                    .filter((m) => m.labels.includes(label))
                    .map(
                        (m) =>
                            new DslMetaModel({
                                name: m.name,
                                title: m.title,
                                description: m.description,
                            })
                    );
            }
        } else {
            return KameletApi.getKamelets()
                .filter(
                    (k) => k.metadata.labels["camel.apache.org/kamelet.type"] === label
                )
                .map(
                    (k) =>
                        new DslMetaModel({
                            name: parentDslName ? "to" : "from",
                            uri: "kamelet:" + k.metadata.name,
                            title: k.title(),
                            description: k.title(),
                        })
                );
        }
    };

    static nameFomTitle = (title: string): string => {
        return title.replace(/[^a-z0-9+]+/gi, "-").toLowerCase();
    };

    static titleFromName = (name?: string) => {
        return name
            ? name
                .replace(".yaml", "")
                .split("-")
                .map((value) => CamelUi.capitalizeName(value))
                .reduce(
                    (previousValue, currentValue) => previousValue + " " + currentValue
                )
            : name;
    };

    static isKameletComponent = (element: CamelElement | undefined): boolean => {
        if (element && ["from", "to"].includes(element.dslName)) {
            const uri: string = (element as any).uri;
            return uri !== undefined && uri.startsWith("kamelet:");
        } else {
            return false;
        }
    };

    static getKamelet = (element: CamelElement): Kamelet | undefined => {
        if (["from", "to"].includes(element.dslName)) {
            const uri: string = (element as any).uri;
            const k =
                uri !== undefined ? KameletApi.findKameletByUri(uri) : undefined;
            return k;
        } else {
            return undefined;
        }
    };

    static getKameletProperties = (element: any): Property[] => {
        const uri: string = (element as any).uri;
        const kamelet = KameletApi.findKameletByUri(uri);
        return kamelet
            ? KameletApi.getKameletProperties(kamelet?.metadata.name)
            : [];
    };

    static getTitle = (element: CamelElement): string => {
        const uri: string = (element as any).uri;
        const k: Kamelet | undefined = CamelUi.getKamelet(element);
        if (k) {
            return CamelUi.capitalizeName(element.dslName) + ":" + k.title();
        } else {
            return uri
                ? CamelUi.capitalizeName(element.dslName) + ":" + uri
                : CamelUi.capitalizeName(element.dslName);
        }
    };

    static getKameletIcon = (uri: string | undefined): string => {
        return uri ? KameletApi.findKameletByUri(uri)?.icon() || "" : "";
    };
    static getIconForName = (dslName: string): string => {
        switch (dslName) {
            case "filter":
                return "data:image/svg+xml,%3Csvg aria-hidden='true' focusable='false' data-prefix='fas' data-icon='filter' class='svg-inline--fa fa-filter fa-w-16' role='img' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath fill='currentColor' d='M487.976 0H24.028C2.71 0-8.047 25.866 7.058 40.971L192 225.941V432c0 7.831 3.821 15.17 10.237 19.662l80 55.98C298.02 518.69 320 507.493 320 487.98V225.941l184.947-184.97C520.021 25.896 509.338 0 487.976 0z'%3E%3C/path%3E%3C/svg%3E";
            case "otherwise":
                return "data:image/svg+xml,%0A%3Csvg aria-hidden='true' focusable='false' data-prefix='fas' data-icon='exclamation' class='svg-inline--fa fa-exclamation fa-w-6' role='img' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 512'%3E%3Cpath fill='currentColor' d='M176 432c0 44.112-35.888 80-80 80s-80-35.888-80-80 35.888-80 80-80 80 35.888 80 80zM25.26 25.199l13.6 272C39.499 309.972 50.041 320 62.83 320h66.34c12.789 0 23.331-10.028 23.97-22.801l13.6-272C167.425 11.49 156.496 0 142.77 0H49.23C35.504 0 24.575 11.49 25.26 25.199z'%3E%3C/path%3E%3C/svg%3E";
            case "choice":
                return "data:image/svg+xml,%3Csvg version='1.1' id='Layer_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='24px' height='24px' viewBox='0 0 24 24' enable-background='new 0 0 24 24' xml:space='preserve'%3E%3Cimage id='image0' width='24' height='24' x='0' y='0' href='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAAAAADFHGIkAAAABGdBTUEAALGPC/xhBQAAACBjSFJN%0AAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QA/4ePzL8AAAAJcEhZ%0AcwAAAGAAAABgAPBrQs8AAAAHdElNRQflCBkAGygLvxAlAAAAfElEQVQoz72Ruw3DMAxET248gXYw%0AIGVGu9QIKTOIs44gQkM8F0pkFSljX8PPA3gH0KHfmnQJcO56j7+COvSciorWhw7sjY1EACuUMO9Y%0AVDBYO1DKi6JBXvSwTSeQVygAFuQ1AvnSThf/CfSNW1+tPusYV5KUALa+czf8/ABZVnxoAj4zNwAA%0AACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMS0wOC0yNVQwMDoyNzo0MCswMDowMIKK/iQAAAAldEVYdGRh%0AdGU6bW9kaWZ5ADIwMjEtMDgtMjVUMDA6Mjc6NDArMDA6MDDz10aYAAAAAElFTkSuQmCC' /%3E%3C/svg%3E";
            case "when":
                return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='currentColor' height='1em' width='1em' viewBox='0 0 384 512' aria-hidden='true' role='img' style='vertical-align: -0.125em;'%3E%3Cpath d='M202.021 0C122.202 0 70.503 32.703 29.914 91.026c-7.363 10.58-5.093 25.086 5.178 32.874l43.138 32.709c10.373 7.865 25.132 6.026 33.253-4.148 25.049-31.381 43.63-49.449 82.757-49.449 30.764 0 68.816 19.799 68.816 49.631 0 22.552-18.617 34.134-48.993 51.164-35.423 19.86-82.299 44.576-82.299 106.405V320c0 13.255 10.745 24 24 24h72.471c13.255 0 24-10.745 24-24v-5.773c0-42.86 125.268-44.645 125.268-160.627C377.504 66.256 286.902 0 202.021 0zM192 373.459c-38.196 0-69.271 31.075-69.271 69.271 0 38.195 31.075 69.27 69.271 69.27s69.271-31.075 69.271-69.271-31.075-69.27-69.271-69.27z'%3E%3C/path%3E%3C/svg%3E";
            case "aggregate":
                return "data:image/svg+xml,%3Csvg version='1.1' id='Layer_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='512px' height='640px' viewBox='0 0 512 640' enable-background='new 0 0 512 640' xml:space='preserve'%3E%3Cimage id='image0' width='512' height='640' x='0' y='0' href='data:image/png;base64,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%0AAABJRU5ErkJggg==' /%3E%3C/svg%3E";
            case "split":
                return "data:image/svg+xml,%3Csvg version='1.1' id='Layer_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='512px' height='640px' viewBox='0 0 512 640' enable-background='new 0 0 512 640' xml:space='preserve'%3E%3Cimage id='image0' width='512' height='640' x='0' y='0' href='data:image/png;base64,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' /%3E%3C/svg%3E%0A";
            case "sort":
                return "data:image/svg+xml,%0A%3Csvg aria-hidden='true' focusable='false' data-prefix='fas' data-icon='sort-amount-up' class='svg-inline--fa fa-sort-amount-up fa-w-16' role='img' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath fill='currentColor' d='M304 416h-64a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h64a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zM16 160h48v304a16 16 0 0 0 16 16h32a16 16 0 0 0 16-16V160h48c14.21 0 21.38-17.24 11.31-27.31l-80-96a16 16 0 0 0-22.62 0l-80 96C-5.35 142.74 1.77 160 16 160zm416 0H240a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h192a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zm-64 128H240a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h128a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zM496 32H240a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h256a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16z'%3E%3C/path%3E%3C/svg%3E";
            case "loop":
                return "data:image/svg+xml,%0A%3Csvg aria-hidden='true' focusable='false' data-prefix='fas' data-icon='undo' class='svg-inline--fa fa-undo fa-w-16' role='img' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath fill='currentColor' d='M212.333 224.333H12c-6.627 0-12-5.373-12-12V12C0 5.373 5.373 0 12 0h48c6.627 0 12 5.373 12 12v78.112C117.773 39.279 184.26 7.47 258.175 8.007c136.906.994 246.448 111.623 246.157 248.532C504.041 393.258 393.12 504 256.333 504c-64.089 0-122.496-24.313-166.51-64.215-5.099-4.622-5.334-12.554-.467-17.42l33.967-33.967c4.474-4.474 11.662-4.717 16.401-.525C170.76 415.336 211.58 432 256.333 432c97.268 0 176-78.716 176-176 0-97.267-78.716-176-176-176-58.496 0-110.28 28.476-142.274 72.333h98.274c6.627 0 12 5.373 12 12v48c0 6.627-5.373 12-12 12z'%3E%3C/path%3E%3C/svg%3E";
            case "multicast":
                return "data:image/svg+xml,%0A%3Csvg aria-hidden='true' focusable='false' data-prefix='fas' data-icon='arrows-alt' class='svg-inline--fa fa-arrows-alt fa-w-16' role='img' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath fill='currentColor' d='M352.201 425.775l-79.196 79.196c-9.373 9.373-24.568 9.373-33.941 0l-79.196-79.196c-15.119-15.119-4.411-40.971 16.971-40.97h51.162L228 284H127.196v51.162c0 21.382-25.851 32.09-40.971 16.971L7.029 272.937c-9.373-9.373-9.373-24.569 0-33.941L86.225 159.8c15.119-15.119 40.971-4.411 40.971 16.971V228H228V127.196h-51.23c-21.382 0-32.09-25.851-16.971-40.971l79.196-79.196c9.373-9.373 24.568-9.373 33.941 0l79.196 79.196c15.119 15.119 4.411 40.971-16.971 40.971h-51.162V228h100.804v-51.162c0-21.382 25.851-32.09 40.97-16.971l79.196 79.196c9.373 9.373 9.373 24.569 0 33.941L425.773 352.2c-15.119 15.119-40.971 4.411-40.97-16.971V284H284v100.804h51.23c21.382 0 32.09 25.851 16.971 40.971z'%3E%3C/path%3E%3C/svg%3E";
            case "from":
                return defaultIcon;
            case "to":
                return defaultIcon;
            default:
                return defaultIcon;
        }
    };

    static getIcon = (element: CamelElement): string => {
        const k: Kamelet | undefined = CamelUi.getKamelet(element);
        if (["from", "to"].includes(element.dslName)) {
            return k ? k.icon() : defaultIcon;
        } else {
            return CamelUi.getIconForName(element.dslName);
        }
    };

    static capitalizeName = (name: string) => {
        try {
            return name[0].toUpperCase() + name.substring(1);
        } catch (e) {
            return name;
        }
    };

    static camelizeName = (
        name: string,
        separator: string,
        firstSmall: boolean
    ) => {
        const res = name
            .split(separator)
            .map((value) => CamelUi.capitalizeName(value))
            .join("");
        return firstSmall ? res[0].toLowerCase() + res.substring(1) : res;
    };
}
