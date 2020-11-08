import { Circle, Line } from "konva";
import { DrawColors } from "./draw";
import Arrow from "./arrow";

class Thermo extends Line {
  _sceneFunc(context) {
    let points = this.points();
    let length = points.length;
    context.beginPath();
    context.moveTo(points[0], points[1]);
    context.arc(points[0], points[1], this.strokeWidth() * 0.8, 0, 2 * Math.PI, true);
    context.moveTo(points[0], points[1]);
    for (let n = 2; n < length; n += 2) {
      context.lineTo(points[n], points[n + 1]);
    }
    context.strokeShape(this);
  }
}

function center(cell_size, p) {
  return [p[0] * cell_size + cell_size / 2, p[1] * cell_size + cell_size / 2];
}

export function DrawPath(ctx, cells, style, color) {
  let cell_size = ctx.cell_size;
  let radius = ctx.radius * cell_size;
  let strokeWidth = ctx.getLineWidth("medium");

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
    let line = new Line({
      ...roundLine,
      strokeWidth: strokeWidth,
      stroke: color,
      closed: true,
    });
    objs.push(line);
  } else if (style === "polygonfill") {
    let line = new Line({
      ...roundLine,
      strokeWidth: strokeWidth,
      fill: color,
      closed: true,
    });
    objs.push(line);
  } else if (style === "thin") {
    let line = newLine(ctx.getLineWidth("thin"));
    objs.push(line);
  } else if (style === "medium") {
    let line = newLine(ctx.getLineWidth("medium"));
    objs.push(line);
  } else if (style === "fat") {
    let line = newLine(ctx.getLineWidth("fat"));
    objs.push(line);
  } else if (style === "roundborder") {
    let w = cell_size * ctx.radius * 2 + ctx.getLineWidth("medium");
    let line1 = newLine(w);
    let line2 = new Line({
      ...roundLine,
      strokeWidth: w - ctx.getLineWidth("medium") * 2,
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
    let line = newLine(cell_size * ctx.radius * 2);
    objs.push(line);
  } else if (style === "squarefill") {
    let line = new Line({
      ...squareLine,
      strokeWidth: cell_size * 0.8,
    });
    objs.push(line);
  } else if (style === "arrowcircle" || style === "arrow") {
    let arrow = new Arrow({
      points: points,
      stroke: color,
      strokeWidth: strokeWidth,
      lineCap: "butt",
      lineJoin: "miter",
      arrowLength: cell_size * 0.3
    });
    objs.push(arrow);
    if (style === "arrowcircle") {
      let bulb = new Circle({
        x: start_px[0],
        y: start_px[1],
        radius: radius,
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
