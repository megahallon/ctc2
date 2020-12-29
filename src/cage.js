import { Line } from "konva";
import { DrawColorPremul } from "./draw";

export function DrawCage(ctx, cells, _style, color) {
  let [style, size] = _style.split(":");
  let width = ctx.getLineWidth(size);
  if (style === "dash") return drawDashCage(ctx, cells, width, color);
  if (style === "edge") return drawEdgeCage(ctx, cells, width, color);
}

function drawDashCage(ctx, cells, _size, color) {
  let size = 2; //ctx.cell_size / 32;
  let corner_offset = ctx.cell_size * 0.08;
  let cs = ctx.cell_size;
  let get_cage = (x, y) => {
    return cells.find((e) => e[0] === x && e[1] === y);
  };
  color = DrawColorPremul(color);

  const corner_pos = [
    [corner_offset, corner_offset],
    [cs - corner_offset, corner_offset],
    [cs - corner_offset, cs - corner_offset],
    [corner_offset, cs - corner_offset],
  ];

  const corner_ext_pos = [
    [0, corner_offset],
    [corner_offset, 0],
    [cs - corner_offset, 0],
    [cs, corner_offset],
    [cs, cs - corner_offset],
    [cs - corner_offset, cs],
    [corner_offset, cs],
    [0, cs - corner_offset],
  ];

  let lines = [];
  ctx.eachCell((m) => {
    let x = m.x;
    let y = m.y;
    if (!get_cage(x, y)) return;
    let up = get_cage(x, y - 1);
    let down = get_cage(x, y + 1);
    let left = get_cage(x - 1, y);
    let right = get_cage(x + 1, y);
    let ul = get_cage(x - 1, y - 1);
    let ur = get_cage(x + 1, y - 1);
    let dl = get_cage(x - 1, y + 1);
    let dr = get_cage(x + 1, y + 1);
    let l = [];
    let add_line = (start, end) => {
      l.push(
        new Line({
          points: [...start, ...end],
          dash: [ctx.cell_size / 20],
          strokeWidth: size,
          stroke: color,
        })
      );
    };
    if (!left) {
      let start = corner_pos[0];
      let end = corner_pos[3];
      if (up) {
        start = corner_ext_pos[1].slice(0);
        start[1] -= !ul ? 0 : corner_offset;
      }
      if (down) {
        end = corner_ext_pos[6].slice(0);
        end[1] += !dl ? 0 : corner_offset;
      }
      add_line(start, end);
    }
    if (!right) {
      let start = corner_pos[1];
      let end = corner_pos[2];
      if (up) {
        start = corner_ext_pos[2].slice(0);
        start[1] -= !ur ? 0 : corner_offset;
      }
      if (down) {
        end = corner_ext_pos[5].slice(0);
        end[1] += !dr ? 0 : corner_offset;
      }
      add_line(start, end);
    }
    if (!up) {
      let start = corner_pos[0];
      let end = corner_pos[1];
      if (left) {
        start = corner_ext_pos[0].slice(0);
        start[0] -= !ul ? 0 : corner_offset;
      }
      if (right) {
        end = corner_ext_pos[3].slice(0);
        end[0] += !ur ? 0 : corner_offset;
      }
      add_line(start, end);
    }
    if (!down) {
      let start = corner_pos[3];
      let end = corner_pos[2];
      if (left) {
        start = corner_ext_pos[7].slice(0);
        start[0] -= !dl ? 0 : corner_offset;
      }
      if (right) {
        end = corner_ext_pos[4].slice(0);
        end[0] += !dr ? 0 : corner_offset;
      }
      add_line(start, end);
    }
    if (l.length > 0) m.cont.add(...l);
    lines = lines.concat(l);
  });
  return lines;
}

function drawEdgeCage(ctx, cells, size, color) {
  let cs = ctx.cell_size;
  let get_cage = (x, y) => {
    return cells.find((e) => e[0] === x && e[1] === y);
  };
  color = DrawColorPremul(color);

  const corner = [
    [0, 0],
    [cs, 0],
    [cs, cs],
    [0, cs],
  ];

  let lines = [];
  ctx.eachCell((m) => {
    let x = m.x;
    let y = m.y;
    if (!get_cage(x, y)) return;
    let up = get_cage(x, y - 1);
    let down = get_cage(x, y + 1);
    let left = get_cage(x - 1, y);
    let right = get_cage(x + 1, y);
    let l = [];
    let add_line = (start, end) => {
      l.push(
        new Line({
          points: [...start, ...end],
          strokeWidth: size,
          stroke: color,
          lineCap: "round",
        })
      );
    };
    if (!left) {
      let start = corner[0];
      let end = corner[3];
      add_line(start, end);
    }
    if (!right) {
      let start = corner[1];
      let end = corner[2];
      add_line(start, end);
    }
    if (!up) {
      let start = corner[0];
      let end = corner[1];
      add_line(start, end);
    }
    if (!down) {
      let start = corner[3];
      let end = corner[2];
      add_line(start, end);
    }
    if (l.length > 0) m.ocont.add(...l);
    lines.push(...l);
  });
  return lines;
}
