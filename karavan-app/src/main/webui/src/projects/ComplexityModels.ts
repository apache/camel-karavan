export type ComplexityType = 'easy' | 'normal' | 'complex'

export class ComplexityRoute {
    routeId: string = ''
    fileName: string = ''
    consumer: any = {};
    producers: any[] = [];
}

export class ComplexityFile {
    fileName: string = '';
    error: string = '';
    type: string = '';
    chars: number = 0;
    routes: number = 0;
    beans: number = 0;
    rests: number = 0;
    complexity: ComplexityType = 'easy';
    complexityLines: ComplexityType = 'easy';
    complexityRoutes: ComplexityType = 'easy';
    complexityRests: ComplexityType = 'easy';
    complexityBeans: ComplexityType = 'easy';
    complexityProcessors: ComplexityType = 'easy';
    complexityComponentsInt: ComplexityType = 'easy';
    complexityComponentsExt: ComplexityType = 'easy';
    complexityKamelets: ComplexityType = 'easy';
    processors: any = {};
    componentsInt: any = {};
    componentsExt: any = {};
    kamelets: any = {};

    public constructor(init?: Partial<ComplexityFile>) {
        Object.assign(this, init);
    }
}

export class ComplexityProject {
    projectId: string = '';
    lastUpdateDate: number = 0;
    complexityRoute: ComplexityType = 'easy';
    complexityRest: ComplexityType = 'easy';
    complexityJava: ComplexityType = 'easy';
    complexityFiles: ComplexityType = 'easy';
    files: ComplexityFile[] = []
    routes: ComplexityRoute[] = []
    dependencies: string[] = []
    rests: number = 0;

    public constructor(init?: Partial<ComplexityProject>) {
        Object.assign(this, init);
    }
}

export function getComplexityColor(complexity: ComplexityType) {
    return complexity === 'easy' ? 'green' : (complexity === 'complex' ? 'orange' : 'blue');
}

export function getMaxComplexity(complexities: (ComplexityType) []): ComplexityType {
    if (complexities.filter(c => c === 'complex').length > 0) {
        return 'complex'
    } else if (complexities.filter(c => c === 'normal').length > 0) {
        return 'normal'
    } else {
        return 'easy'
    }
}
