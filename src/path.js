import { Circle, Color, Line } from "pencil.js";
import { DrawColors } from "./draw";
import Arrow from "./arrow";

function center_px(cell_size, p)
{
    return [p[0] * cell_size + cell_size / 2,
            p[1] * cell_size + cell_size / 2];
}

export function draw_path(ctx, cells, style, color_index) {
    let cell_size = ctx.cell_size;

    let _color = DrawColors[color_index].match(/[.\d]+/g).map(c => (c > 1) ? c / 255 : +c);
    let color = new Color(..._color);
    color.red = color.red * color.alpha + (1 - color.alpha) * 1;
    color.green = color.green * color.alpha + (1 - color.alpha) * 1;
    color.blue = color.blue * color.alpha + (1 - color.alpha) * 1;
    color.alpha = 1;
    let start_px = center_px(cell_size, cells[0]);
    let points = cells.map(p => {
        let px = center_px(cell_size, p);
        return {x: px[0] - start_px[0], y: px[1] - start_px[1]};
    });
    let objs = [];

    if (style === "thermo") {
      let strokeWidth = cell_size * 0.3;
      let bulb = new Circle(start_px, cell_size * 0.4, {fill: color});
      let line = new Line(start_px, points.slice(1),
          {stroke: color, strokeWidth: strokeWidth, join: Line.joins.miter});
      objs.push(bulb, line);
    }
    else if (style === "thin") {
      let strokeWidth = cell_size * 0.05;
      let line = new Line(start_px, points.slice(1),
          {stroke: color, strokeWidth: strokeWidth, join: Line.joins.miter});
      objs.push(line);
    }
    else if (style === "fat") {
      let strokeWidth = cell_size * 0.3;
      let line = new Line(start_px, points.slice(1),
          {stroke: color, strokeWidth: strokeWidth, join: Line.joins.miter});
      objs.push(line);
    }
    else if (style === "roundborder") {
      let line1 = new Line(start_px, points.slice(1),
          {stroke: color, strokeWidth: cell_size * 0.8, join: Line.joins.round});
      let line2 = new Line(start_px, points.slice(1),
          {stroke: "white", strokeWidth: cell_size * 0.67, join: Line.joins.round});
      objs.push(line1, line2);
    }
    else if (style === "border") {
      let line1 = new Line(start_px, points.slice(1),
          {stroke: color, strokeWidth: cell_size * 0.8, cap: Line.caps.square, join: Line.joins.round});
      let line2 = new Line(start_px, points.slice(1),
          {stroke: "white", strokeWidth: cell_size * 0.67, cap: Line.caps.square, join: Line.joins.round});
      objs.push(line1, line2);
    }
    else if (style === "roundfill") {
      let line1 = new Line(start_px, points.slice(1),
          {stroke: color, strokeWidth: cell_size * 0.8, join: Line.joins.round});
      objs.push(line1);
    }
    else if (style === "squarefill") {
      let line1 = new Line(start_px, points.slice(1),
          {stroke: color, strokeWidth: cell_size * 0.8, cap: Line.caps.square, join: Line.joins.round});
      objs.push(line1);
    }
    else if (style === "arrowcircle" || style === "arrow") {
      let strokeWidth = cell_size * 0.07;
      if (points.length > 1) {
        let arrow = new Arrow(start_px, points.slice(1),
          {stroke: color, strokeWidth: strokeWidth, arrow: cell_size * 0.3});
        objs.push(arrow);
      }
      let line = new Line(start_px, points.slice(1),
          {stroke: color, strokeWidth: strokeWidth, join: Line.joins.miter});
      objs.push(line);
      if (style === "arrowcircle") {
        let bulb = new Circle(start_px, cell_size * 0.4,
          {fill: "white", strokeWidth: strokeWidth, stroke: color});
        objs.push(bulb);
      }
    }

    ctx.underlay2.add(...objs);
    ctx.scene.render();

    return objs;
}
