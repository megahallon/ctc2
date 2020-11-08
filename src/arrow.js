import { Line } from "konva";

export default class Arrow extends Line {
  constructor(config) {
    super(config);
    this.arrowLength = config.arrowLength;
  }

  _sceneFunc(context) {
    let points = this.points();
    let length = points.length;
    context.beginPath();
    context.moveTo(points[0], points[1]);
    for (let n = 2; n < length; n += 2) {
      context.lineTo(points[n], points[n + 1]);
    }
    let p0x = points[points.length - 2];
    let p0y = points[points.length - 1];
    let p1x = points[points.length - 4];
    let p1y = points[points.length - 3];
    let dx = p1x - p0x;
    let dy = p1y - p0y;
    let dl = Math.sqrt(dx ** 2 + dy ** 2);
    if (dl > 0) {
      let a = Math.atan2(dy, dx);
      let a1 = a + Math.PI / 4;
      let a2 = a - Math.PI / 4;
      let al = this.arrowLength;
      context.moveTo(p0x + al * Math.cos(a1), p0y + al * Math.sin(a1));
      context.lineTo(p0x, p0y);
      context.lineTo(p0x + al * Math.cos(a2), p0y + al * Math.sin(a2));
    }
    context.strokeShape(this);
  }
}
