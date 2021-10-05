import {CamelUi} from "../api/CamelUi";

export class InOut {
  type: 'in' | 'out'  = 'in';
  uuid: string = ''
  icon: string = CamelUi.getIconForName("");
  top: number = 0;
  side: number = 0;

  constructor(type: 'in' | 'out', uuid: string, icon: string, top: number, side: number) {
    this.type = type;
    this.uuid = uuid;
    this.icon = icon;
    this.top = top;
    this.side = side;
  }
}

export class Path {
  uuid: string = ''
  startX: number = 0
  startY: number = 0
  endX: number = 0
  endY: number = 0

  constructor(uuid: string, startX: number, startY: number, endX: number, endY: number) {
    this.uuid = uuid;
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
  }

  getPath(): string {
    const x = (this.endX + this.startX) / 2;
    const y = (this.endY + this.startY) / 2;
    return 'M ' + this.startX + ',' + this.startY
        + ' C ' + x + ','+ this.startY + ' ' + y +', ' + this.endY
        + ' ' + this.endX + ',' + this.endY ;
  }
}