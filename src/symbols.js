//import Arrow from "./arrow";
import { Circle, Star, Rect, Group, Text, Line, Arrow } from "konva";
import { DrawColorPremul } from "./draw";

/*
class Text2 extends Text
{
    makePath(ctx) {
        const origin = this.getOrigin();
        ctx.translate(origin.x, origin.y);

        this.path = new window.Path2D();
        this.path.rect(0, 0, this.width, this.height);

        ctx.fillStyle = "rgba(255,255,255,1)";
        ctx.fill(this.path);
        ctx.fillStyle = this.options.fill.toString(ctx);

        ctx.translate(-origin.x, -origin.y);

        super.makePath(ctx);

        return this;
    }
}
*/

export function draw_symbol(container, str, _color, size, bg) {
  let page = +str.substr(1, 1);
  let symbol = +str.substr(2, 1);
  let color = DrawColorPremul(_color);
  let cx = size / 2;
  let cy = size / 2;
  let sym;

  if (str[0] !== "#") page = 0;

  if (page === 0) {
    sym = new Text({
      x: size * 0.5 - (0.25 * size * str.length),
      y: size * 0.1,
      text: str,
      fontSize: size,
      fill: color,
      listening: false,
    });
  }
  if (page === 1) {
    if (symbol === 1) {
      // circle fill
      sym = new Circle({
        x: cx,
        y: cy,
        radius: (0.8 * size) / 2,
        fill: color,
        stroke: "black",
        strokeWidth: 2,
      });
    }
    if (symbol === 2) {
      // circle outline
      sym = new Circle({
        x: cx,
        y: cy,
        radius: (0.8 * size) / 2,
        fill: "white",
        stroke: color,
        strokeWidth: 2,
      });
    }
    if (symbol === 3) {
      // dash circle fill
      sym = new Circle({
        x: cx,
        y: cy,
        radius: (0.8 * size) / 2,
        fill: color,
        stroke: "black",
        strokeWidth: 2,
        dash: [4],
      });
    }
    if (symbol === 4) {
      // dash circle outline
      sym = new Circle({
        x: cx,
        y: cy,
        radius: (0.8 * size) / 2,
        fill: "white",
        stroke: color,
        strokeWidth: 2,
        dash: [4],
      });
    }
  }
  if (page === 2) {
    // Little killer style arrows
    let offset = size * 0.05;
    let offset2 = size * 0.15;
    let aopt = {
      stroke: color,
      strokeWidth: 3,
      fill: color,
      pointerLength: size * 0.3,
      pointerWidth: size * 0.3,
    };
    if (symbol === 1) {
      sym = new Arrow({
        x: cx,
        y: cy,
        points: [0, 0, size - cx - offset, size - cy - offset],
        ...aopt,
      });
    }
    if (symbol === 2) {
      sym = new Arrow({
        x: cx,
        y: cy,
        points: [0, 0, size - cx - offset, -cy + offset],
        ...aopt,
      });
    }
    if (symbol === 3) {
      sym = new Arrow({
        x: cx,
        y: cy,
        points: [0, 0, -cx + offset, -cy + offset],
        ...aopt,
      });
    }
    if (symbol === 4) {
      sym = new Arrow({
        x: cx,
        y: cy,
        points: [0, 0, -cx + offset, size - cy - offset],
        ...aopt,
      });
    }
    if (symbol === 5) {
      sym = new Arrow({
        x: offset2,
        y: cy,
        points: [0, 0, size - offset2 * 2, 0],
        ...aopt,
      });
    }
    if (symbol === 6) {
      sym = new Arrow({
        x: size - offset2,
        y: cy,
        points: [0, 0, -(size - offset2 * 2), 0],
        ...aopt,
      });
    }
    if (symbol === 7) {
      sym = new Arrow({
        x: cx,
        y: offset2,
        points: [0, 0, 0, size - offset2 * 2],
        ...aopt,
      });
    }
    if (symbol === 8) {
      sym = new Arrow({
        x: cx,
        y: size - offset2,
        points: [0, 0, 0, -(size - offset2 * 2)],
        ...aopt,
      });
    }
  }
  if (page === 3) {
    // Yajilin style arrows
    let offset = size * 0.15;
    let aopt = {
      stroke: color,
      fill: color,
      strokeWidth: 2,
      pointerLength: size * 0.1,
      pointerWidth: size * 0.1,
    };
    if (symbol === 1) {
      sym = new Arrow({
        x: offset,
        y: offset,
        points: [0, 0, size - offset * 2, 0],
        ...aopt,
      });
    }
    if (symbol === 2) {
      sym = new Arrow({
        x: size - offset,
        y: offset,
        points: [0, 0, -(size - offset * 2), 0],
        ...aopt,
      });
    }
    if (symbol === 3) {
      sym = new Arrow({
        x: size - offset,
        y: offset,
        points: [0, 0, 0, size - offset * 2],
        ...aopt,
      });
    }
    if (symbol === 4) {
      sym = new Arrow({
        x: size - offset,
        y: size - offset,
        points: [0, 0, 0, -(size - offset * 2)],
        ...aopt,
      });
    }
    if (symbol === 5) {
      sym = new Arrow({
        x: size - offset,
        y: size - offset,
        points: [0, 0, -(size - offset * 2), 0],
        ...aopt,
      });
    }
    if (symbol === 6) {
      sym = new Arrow({
        x: offset,
        y: size - offset,
        points: [0, 0, size - offset * 2, 0],
        ...aopt,
      });
    }
    if (symbol === 7) {
      sym = new Arrow({
        x: offset,
        y: size - offset,
        points: [0, 0, 0, -(size - offset * 2)],
        ...aopt,
      });
    }
    if (symbol === 8) {
      sym = new Arrow({
        x: offset,
        y: offset,
        points: [0, 0, 0, size - offset * 2],
        ...aopt,
      });
    }
  }
  if (page === 4) {
    if (symbol === 1) {
      sym = new Star({
        x: cx,
        y: cy,
        innerRadius: size * 0.2,
        outerRadius: size * 0.4,
        numPoints: 5,
        fill: color,
        stroke: "black",
      });
    }
    if (symbol === 2) {
      let offset = size * 0.1;
      sym = new Line({
        x: offset,
        y: offset,
        points: [
          0,
          0,
          size - offset * 2,
          cy - offset,
          0,
          size - offset * 2,
          0,
          0,
        ],
        fill: color,
        closed: true,
      });
    }
    if (symbol === 3) {
      sym = new Group();
      sym.add(new Rect({ width: size, height: size, fill: color }));
      sym.add(
        new Line({
          points: [0, 0, size, size],
          stroke: "white",
          strokeWidth: 3,
        })
      );
    }
    if (symbol === 4) {
      let o = size * 0.1;
      sym = new Group();
      sym.add(
        new Line({
          points: [o, o, size - o, size - o],
          stroke: color,
          strokeWidth: 3,
        })
      );
      sym.add(
        new Line({
          points: [o, size - o, size - o, o],
          stroke: color,
          strokeWidth: 3,
        })
      );
    }
  }
  if (sym) {
    if (container.symbol) {
      container.symbol.destroy();
    }
    if (bg) {
      let bg = new Rect({ width: size, height: size, fill: "white", listening: false });
      let c = new Group();
      c.add(bg, sym);
      container.symbol = c;
      container.add(c);
    } else {
      container.symbol = sym;
      container.add(sym);
    }
    container.symboltext = str;
    container.symbolcolor = _color;
  }
}
