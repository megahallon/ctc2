import { Circle, Line } from "konva";
import { DrawColors } from "./draw";

class Thermo extends Line {
  _sceneFunc(context) {
    let points = this.points();
    let length = points.length;
    context.beginPath();
    context.moveTo(points[0], points[1]);
    context.arc(points[0], points[1], 16, 0, 2 * Math.PI, true);
    context.moveTo(points[0], points[1]);
    for (let n = 2; n < length; n += 2) {
      context.lineTo(points[n], points[n + 1]);
    }
    context.strokeShape(this);
  }
}

class Arrow extends Line {
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
      let w = this.strokeWidth() / 2;
      context.moveTo(p0x + al * Math.cos(a1), p0y + al * Math.sin(a1));
      context.lineTo(p0x - dx * w / dl, p0y - dy * w / dl);
      context.lineTo(p0x + al * Math.cos(a2), p0y + al * Math.sin(a2));
    }
    context.strokeShape(this);
  }
}

function center(cell_size, p) {
  return [p[0] * cell_size + cell_size / 2, p[1] * cell_size + cell_size / 2];
}

export function DrawPath(ctx, cells, style, color) {
  let cell_size = ctx.cell_size;
  color = DrawColors[color];

  let start_px = center(cell_size, cells[0]);
  let points = cells.map((p) => {
    let px = center(cell_size, p);
    return [px[0], px[1]];
  });
  if (points.length === 1) points.push(points[points.length - 1]);
  points = points.flat();
  let objs = [];
  let roundLine = {
    points: points,
    stroke: color,
    lineCap: "round",
    lineJoin: "round",
  };
  let squareLine = {
    points: points,
    stroke: color,
    lineCap: "square",
    lineJoin: "miter",
  };
  let newLine = (width) => new Line({
    ...roundLine,
    strokeWidth: width,
  });

  if (style === "thermo") {
    let thermo = new Thermo({
      ...roundLine,
      strokeWidth: cell_size * 0.3,
    });
    objs.push(thermo);
  } else if (style === "polygon") {
    let strokeWidth = cell_size * 0.05;
    let line = new Line({
      ...roundLine,
      strokeWidth: strokeWidth,
      stroke: color,
      closed: true,
    });
    objs.push(line);
  } else if (style === "polygonfill") {
    let strokeWidth = cell_size * 0.05;
    let line = new Line({
      ...roundLine,
      strokeWidth: strokeWidth,
      fill: color,
      closed: true,
    });
    objs.push(line);
  } else if (style === "thin") {
    let line = newLine(cell_size * 0.05);
    objs.push(line);
  } else if (style === "medium") {
    let line = newLine(cell_size * 0.15);
    objs.push(line);
  } else if (style === "fat") {
    let line = newLine(cell_size * 0.3);
    objs.push(line);
  } else if (style === "roundborder") {
    let line1 = newLine(cell_size * 0.8);
    let line2 = new Line({
      ...roundLine,
      strokeWidth: cell_size * 0.67,
      stroke: "white",
    });
    objs.push(line1, line2);
  } else if (style === "border") {
    // TODO only allow 90 degree angles
    let line1 = new Line({
      ...squareLine,
      strokeWidth: cell_size * 0.8,
    });
    let line2 = new Line({
      ...squareLine,
      strokeWidth: cell_size * 0.67,
      stroke: "white",
    });
    objs.push(line1, line2);
  } else if (style === "roundfill") {
    let line = newLine(cell_size * 0.8);
    objs.push(line);
  } else if (style === "squarefill") {
    let line = new Line({
      ...squareLine,
      strokeWidth: cell_size * 0.8,
    });
    objs.push(line);
  } else if (style === "arrowcircle" || style === "arrow") {
    let strokeWidth = cell_size * 0.1;
    let arrow = new Arrow({
      points: points,
      stroke: color,
      strokeWidth: strokeWidth,
      lineCap: "square",
      lineJoin: "miter",
      arrowLength: cell_size * 0.3
    });
    objs.push(arrow);
    if (style === "arrowcircle") {
      let bulb = new Circle({
        x: start_px[0],
        y: start_px[1],
        radius: cell_size * 0.4,
        fill: "white",
        strokeWidth: strokeWidth,
        stroke: color,
      });
      objs.push(bulb);
    }
  }

  ctx.underlay2.add(...objs);
  ctx.scene.draw();

  return objs;
}
