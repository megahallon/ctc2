import { Line } from "pencil.js";

export default class Arrow extends Line {
    trace (path) {
        super.trace(path);
        let p = [{x: 0, y: 0}].concat(this.points);
        let last = p[p.length - 1];
        let last1 = p[p.length - 2];
        let dx = last.x - last1.x;
        let dy = last1.y - last.y;
        let a = Math.atan2(dy, dx);
        let a2 = this.options.arrowAngle * Math.PI / 180;
        let ax = this.options.arrow * Math.cos(a + a2);
        let ay = this.options.arrow * Math.sin(a + a2);
        let ax2 = this.options.arrow * Math.cos(a - a2);
        let ay2 = this.options.arrow * Math.sin(a - a2);
        path.moveTo(last.x, last.y);
        path.lineTo(last.x - ax, last.y + ay);
        path.moveTo(last.x, last.y);
        path.lineTo(last.x - ax2, last.y + ay2);
        return this;
    }

    static get defaultOptions() {
      return {
          ...super.defaultOptions,
          arrow: 10,
          arrowAngle: 45
      };
    }
}
