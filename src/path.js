import { Circle, Line, Arrow } from "konva";
import { DrawColorPremul } from "./draw";

function center_px(cell_size, p) {
  return [p[0] * cell_size + cell_size / 2, p[1] * cell_size + cell_size / 2];
}

export function draw_path(ctx, cells, style, color) {
  let cell_size = ctx.cell_size;
  color = DrawColorPremul(color);

  let start_px = center_px(cell_size, cells[0]);
  let points = cells.map((p) => {
    let px = center_px(cell_size, p);
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
    let bulb = new Circle({
      x: start_px[0],
      y: start_px[1],
      radius: cell_size * 0.4,
      fill: color,
    });
    let line = newLine(cell_size * 0.3);
    objs.push(bulb, line);
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
    let strokeWidth = cell_size * 0.07;
    if (points.length > 1) {
      let arrow = new Arrow({
        points: points,
        stroke: color,
        strokeWidth: strokeWidth,
        arrow: cell_size * 0.3,
      });
      objs.push(arrow);
    }
    let line = new Line({
      ...squareLine,
      strokeWidth: strokeWidth,
    });
    objs.push(line);
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
