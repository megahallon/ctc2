//import Arrow from "./arrow";
import { Circle, Star, Rect, Group, Line } from "konva";
import { DrawColorPremul } from "./draw";

import Arrow from "./arrow";

export function DrawSymbol(ctx, container, str, _color, _size, bg) {
  let page = +str.substr(1, 1);
  let symbol = +str.substr(2, 1);
  let color = DrawColorPremul(_color);
  let cx;
  let cy;
  let size;

  if (str === "") {
    if (container.text) {
      container.text.text(str);
    }
    if (container.symbol) {
      container.symbol.destroy();
      container.symbol = null;
    }
    container.symboltext = "";
    return;
  }

  if (typeof _size === "object") {
    cx = _size[0] / 2;
    cy = _size[1] / 2;
    size = Math.min(..._size);
  } else {
    size = _size;
    cx = size / 2;
    cy = size / 2;
  }

  let radius = ctx.radius * size;
  let strokeWidth = ctx.getLineWidth("medium", size);
  let sym;

  if (str[0] !== "#") page = 0;

  if (page === 0) {
    container.text.color(color);
    container.text.background(bg);
    container.text.text(str);
    container.symboltext = str;
    container.symbolcolor = _color;
    container.symbolbg = bg;
    return;
  }
  else if (page === 1) {
    let copt = {
      x: cx,
      y: cy,
      radius: radius,
      strokeWidth: strokeWidth,
      listening: false,
    };
    if (symbol === 1) {
      // circle fill
      sym = new Circle({
        ...copt,
        fill: color,
        stroke: "black",
      });
    }
    if (symbol === 2) {
      // circle outline
      sym = new Circle({
        ...copt,
        fill: "white",
        stroke: color,
      });
    }
    if (symbol === 3) {
      // dash circle fill
      sym = new Circle({
        ...copt,
        fill: color,
        stroke: "black",
        dash: [4],
      });
    }
    if (symbol === 4) {
      // dash circle outline
      sym = new Circle({
        ...copt,
        fill: "white",
        stroke: color,
        dash: [4],
      });
    }
    if (symbol === 5) {
      // dash circle outline
      sym = new Circle({
        ...copt,
        fill: color,
        strokeWidth: 0,
      });
    }
  }
  else if (page === 2) {
    // Little killer style arrows
    let offset = size * 0.05;
    let offset2 = size * 0.15;
    let aopt = {
      stroke: color,
      strokeWidth: strokeWidth,
      fill: color,
      pointerLength: size * 0.3,
      pointerWidth: size * 0.3,
      arrowLength: size * 0.3,
      listening: false
    };
    if (symbol === 1) {
      sym = new Arrow({
        x: cx,
        y: cy,
        points: [offset, offset, size - cx - offset, size - cy - offset],
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
  else if (page === 3) {
    // Yajilin style arrows
    let offset = size * 0.2;
    let aopt = {
      stroke: color,
      fill: color,
      strokeWidth: size * 0.03,
      pointerLength: size * 0.1,
      pointerWidth: size * 0.1,
      arrowLength: size * 0.1,
      listening: false,
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
  else if (page === 4) {
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
      let o = size * 0.1;
      sym = new Line({
        points: [o, o, size - o, size / 2, o, size - o, o, o],
        fill: color,
        closed: true,
      });
    }
    if (symbol === 3) {
      // Kakuro box
      sym = new Group();
      sym.add(new Rect({ width: size, height: size, fill: color }));
      sym.add(
        new Line({
          points: [0, 0, size, size],
          stroke: "white",
          strokeWidth: strokeWidth,
        })
      );
    }
    if (symbol === 4) {
      // Cross
      let o = size * 0.1;
      sym = new Group();
      sym.add(
        new Line({
          x: cx - size / 2,
          y: cy - size / 2,
          points: [o, o, size - o, size - o],
          stroke: color,
          strokeWidth: strokeWidth,
          listening: false,
        })
      );
      sym.add(
        new Line({
          x: cx - size / 2,
          y: cy - size / 2,
          points: [o, size - o, size - o, o],
          stroke: color,
          strokeWidth: strokeWidth,
          listening: false,
        })
      );
    }
    if (symbol === 5) {
      let o = size * 0.1;
      sym = new Line({
        x: cx - size / 2,
        y: cy - size / 2,
        points: [o, o, size - o, size / 2, o, size - o],
        stroke: color,
        strokeWidth: strokeWidth,
        listening: false,
      });
    }
    if (symbol === 6) {
      let o = size * 0.1;
      sym = new Line({
        x: cx - size / 2,
        y: cy - size / 2,
        points: [size - o, o, o, size / 2, size - o, size - o],
        stroke: color,
        strokeWidth: strokeWidth,
        listening: false,
      });
    }
    if (symbol === 7) {
      let o = size * 0.1;
      sym = new Line({
        x: cx - size / 2,
        y: cy - size / 2,
        points: [o, o, size / 2, size - o, size - o, o],
        stroke: color,
        strokeWidth: strokeWidth,
        listening: false,
      });
    }
    if (symbol === 8) {
      let o = size * 0.1;
      sym = new Line({
        x: cx - size / 2,
        y: cy - size / 2,
        points: [o, size - o, size / 2, o, size - o, size - o],
        stroke: color,
        strokeWidth: strokeWidth,
        listening: false,
      });
    }
  }
  else if (page === 5) {
    let o = size * 0.1;
    let rect = {
      x: o,
      y: o,
      width: size - o * 2,
      height: size - o * 2,
      listening: false
    };
    if (symbol === 1) {
      sym = new Rect({...rect,
        fill: color,
        stroke: "black",
        strokeWidth: strokeWidth,
      });
    }
    if (symbol === 2) {
      sym = new Rect({...rect,
        fill: null,
        stroke: color,
        strokeWidth: strokeWidth,
      });
    }
    if (symbol === 3) {
      sym = new Rect({...rect,
        fill: color,
        stroke: "black",
        strokeWidth: strokeWidth,
        dash: [4],
      });
    }
    if (symbol === 4) {
      sym = new Rect({...rect,
        fill: null,
        stroke: color,
        strokeWidth: strokeWidth,
        dash: [4],
      });
    }
    if (symbol === 5) {
      sym = new Rect({...rect,
        fill: color,
        strokeWidth: 0,
      });
    }
  }
  if (page === 6) {
    let o = size * 0.1;
    if (symbol === 1) {
      sym = new Line({
        x: cx,
        y: o,
        points: [0, 0, 0, size - o * 2],
        stroke: color,
        strokeWidth: strokeWidth,
        listening: false,
      });
    }
    if (symbol === 2) {
      sym = new Line({
        x: o,
        y: cy,
        points: [0, 0, size - o * 2, 0],
        stroke: color,
        strokeWidth: strokeWidth,
        listening: false,
      });
    }
    if (symbol === 3) {
      sym = new Group();
      sym.add(new Line({
        x: o,
        y: cy,
        points: [0, 0, size - o * 2, 0],
        stroke: color,
        strokeWidth: strokeWidth,
        listening: false,
      }));
      sym.add(new Line({
        x: cx,
        y: o,
        points: [0, 0, 0, size - o * 2],
        stroke: color,
        strokeWidth: strokeWidth,
        listening: false,
      }));
    }
  }
  if (sym) {
    if (container.symbol) {
      container.symbol.destroy();
    }
    if (bg) {
      let bgrect = new Rect({
        width: size,
        height: size,
        fill: "white",
        listening: false,
      });
      let c = new Group();
      c.add(bgrect, sym);
      container.symbol = c;
      container.add(c);
    } else {
      container.symbol = sym;
      container.add(sym);
    }
    container.symboltext = str;
    container.symbolcolor = _color;
    container.symbolbg = bg;
  }
}
