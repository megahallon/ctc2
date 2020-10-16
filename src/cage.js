import { Line } from "konva";

export function draw_cage(ctx, cells, style) {
  if (style === "dash") return draw_dash_cage(ctx, cells);
  if (style === "edge") return draw_edge_cage(ctx, cells);
}

function draw_dash_cage(ctx, cells) {
  let corner_offset = ctx.corner_offset;
  let cs = ctx.cell_size;
  let get_cage = (x, y) => {
    return cells.find((e) => e[0] === x && e[1] === y);
  };

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
  ctx.each_cell((m) => {
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
        new Line({points: [...start, ...end],
          dash: [4],
          strokeWidth: 2,
          stroke: "black",
        })
      );
    };
    if (!left) {
      let start = m.corner_pos[0];
      let end = m.corner_pos[3];
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
      let start = m.corner_pos[1];
      let end = m.corner_pos[2];
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
      let start = m.corner_pos[0];
      let end = m.corner_pos[1];
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
      let start = m.corner_pos[3];
      let end = m.corner_pos[2];
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
    l.forEach((e) => m.cont.add(e));
    lines = lines.concat(l);
  });
  return lines;
}

function draw_edge_cage(ctx, cells) {
  let get_cage = (x, y) => {
    return cells.find((e) => e[0] === x && e[1] === y);
  };

  const corner = [
    [0, 0],
    [ctx.cell_size, 0],
    [ctx.cell_size, ctx.cell_size],
    [0, ctx.cell_size],
  ];

  let lines = [];
  ctx.each_cell((m) => {
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
          strokeWidth: 4,
          stroke: "black",
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
    l.forEach((e) => m.cont.add(e));
    lines.push(...l);
  });
  return lines;
}
