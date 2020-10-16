import { Circle, Line, Arrow, Util } from "konva";
import { DrawColors } from "./draw";
//import Arrow from "./arrow";

function center_px(cell_size, p) {
  return [p[0] * cell_size + cell_size / 2, p[1] * cell_size + cell_size / 2];
}

export function draw_path(ctx, cells, style, color_index) {
  let cell_size = ctx.cell_size;

  let _color = DrawColors[color_index];
  let color = Util.colorToRGBA(_color);
  color.r = color.r * color.a + (1 - color.a) * 255;
  color.g = color.g * color.a + (1 - color.a) * 255;
  color.b = color.b * color.a + (1 - color.a) * 255;
  color.a = 1;
  color = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;

  let start_px = center_px(cell_size, cells[0]);
  let points = cells
    .map((p) => {
      let px = center_px(cell_size, p);
      return [px[0], px[1]];
    })
    .flat();
  let objs = [];

  if (style === "thermo") {
    let strokeWidth = cell_size * 0.3;
    let bulb = new Circle({
      x: start_px[0],
      y: start_px[1],
      radius: cell_size * 0.4,
      fill: color,
    });
    let line = new Line({
      points: points,
      stroke: color,
      strokeWidth: strokeWidth,
      lineCap: "round",
    });
    objs.push(bulb, line);
  } else if (style === "thin") {
    let strokeWidth = cell_size * 0.05;
    let line = new Line({
      points: points,
      stroke: color,
      strokeWidth: strokeWidth,
    });
    objs.push(line);
  } else if (style === "fat") {
    let strokeWidth = cell_size * 0.3;
    let line = new Line({
      points: points,
      stroke: color,
      strokeWidth: strokeWidth,
    });
    objs.push(line);
  } else if (style === "roundborder") {
    let line1 = new Line({
      points: points,
      stroke: color,
      strokeWidth: cell_size * 0.8,
      lineCap: "round",
      lineJoin: "round",
    });
    let line2 = new Line({
      points: points,
      stroke: "white",
      strokeWidth: cell_size * 0.67,
      lineCap: "round",
      lineJoin: "round",
    });
    objs.push(line1, line2);
  } else if (style === "border") {
    let line1 = new Line({
      points: points,
      stroke: color,
      strokeWidth: cell_size * 0.8,
      lineCap: "square",
      lineJoin: "round",
    });
    let line2 = new Line({
      points: points,
      stroke: "white",
      strokeWidth: cell_size * 0.67,
      lineCap: "square",
      lineJoin: "round",
    });
    objs.push(line1, line2);
  } else if (style === "roundfill") {
    let line1 = new Line({
      points: points,
      stroke: color,
      strokeWidth: cell_size * 0.8,
      lineCap: "round",
      lineJoin: "round",
    });
    objs.push(line1);
  } else if (style === "squarefill") {
    let line1 = new Line({
      points: points,
      stroke: color,
      strokeWidth: cell_size * 0.8,
      lineCap: "square",
      lineJoin: "round",
    });
    objs.push(line1);
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
      points: points,
      stroke: color,
      strokeWidth: strokeWidth,
      join: "miter",
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
