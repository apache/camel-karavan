import {Subject} from 'rxjs';
import {CamelElement} from "../model/CamelModel";
import {InOut} from "../model/ConnectionModels";

const positions = new Subject<DslPosition>();

export class DslPosition {
    step: CamelElement = new CamelElement("")
    rect: DOMRect = new DOMRect()

    constructor(step: CamelElement, rect: DOMRect) {
        this.step = step;
        this.rect = rect;
    }
}

export class InOutPosition {
    inout: InOut = new InOut('in', '', '', 0, 0)
    rect: DOMRect = new DOMRect()

    constructor(inout: InOut, rect: DOMRect) {
        this.inout = inout;
        this.rect = rect;
    }
}

export const EventBus = {
    sendPosition: (step: CamelElement, rect: DOMRect) => positions.next(new DslPosition(step, rect)),
    onPosition: () => positions.asObservable(),
};
