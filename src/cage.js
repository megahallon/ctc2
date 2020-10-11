import { Line } from "pencil.js";

class DashLine extends Line {
    setContext(ctx) {
        super.setContext(ctx);
        ctx.setLineDash([this.options.dash, this.options.dash]);
    }
}

export function draw_cage(ctx, cells, style)
{
    if (style === "dash")
        return draw_dash_cage(ctx, cells);
    if (style === "edge")
        return draw_edge_cage(ctx, cells);
}

function draw_dash_cage(ctx, cells)
{
    let corner_offset = ctx.corner_offset;
    let get_cage = (x, y) => {
        return cells.find(e => e[0] === x && e[1] === y);
    };

    let lines = [];
    ctx.each_cell(m => {
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
            l.push(new DashLine(
                start, [[end[0] - start[0], end[1] - start[1]]],
                {dash: 4, strokeWidth: 2, stroke: "black"}));
        }
        if (!left) {
            let start = m.corner_pos[0];
            let end = m.corner_pos[3];
            if (up) {
                start = m.corner_ext_pos[1].slice(0);
                start[1] -= (!ul ? 0 : corner_offset);
            }
            if (down) {
                end = m.corner_ext_pos[6].slice(0);
                end[1] += (!dl ? 0 : corner_offset);
            }
            add_line(start, end);
        }
        if (!right) {
            let start = m.corner_pos[1];
            let end = m.corner_pos[2];
            if (up) {
                start = m.corner_ext_pos[2].slice(0);
                start[1] -= (!ur ? 0 : corner_offset);
            }
            if (down) {
                end = m.corner_ext_pos[5].slice(0);
                end[1] += (!dr ? 0 : corner_offset);
            }
            add_line(start, end);
        }
        if (!up) {
            let start = m.corner_pos[0];
            let end = m.corner_pos[1];
            if (left) {
                start = m.corner_ext_pos[0].slice(0);
                start[0] -= (!ul ? 0 : corner_offset);
            }
            if (right) {
                end = m.corner_ext_pos[3].slice(0);
                end[0] += (!ur ? 0 : corner_offset);
            }
            add_line(start, end);
        }
        if (!down) {
            let start = m.corner_pos[3];
            let end = m.corner_pos[2];
            if (left) {
                start = m.corner_ext_pos[7].slice(0);
                start[0] -= (!dl ? 0 : corner_offset);
            }
            if (right) {
                end = m.corner_ext_pos[4].slice(0);
                end[0] += (!dr ? 0 : corner_offset);
            }
            add_line(start, end);
        }
        l.forEach(e => m.r.add(e));
        lines = lines.concat(l);
    });
    ctx.scene.render();
    return lines;
}

function draw_edge_cage(ctx, cells)
{
    let get_cage = (x, y) => {
        return cells.find(e => e[0] === x && e[1] === y);
    };

    let lines = [];
    ctx.each_cell(m => {
        let x = m.x;
        let y = m.y;
        if (!get_cage(x, y)) return;
        let up = get_cage(x, y - 1);
        let down = get_cage(x, y + 1);
        let left = get_cage(x - 1, y);
        let right = get_cage(x + 1, y);
        let l = [];
        let add_line = (start, end) => {
            l.push(new Line(
                start, [[end[0] - start[0], end[1] - start[1]]],
                {strokeWidth: 4, stroke: "black"}));
        }
        if (!left) {
            let start = m.r_corner_pos[0];
            let end = m.r_corner_pos[3];
            add_line(start, end);
        }
        if (!right) {
            let start = m.r_corner_pos[1];
            let end = m.r_corner_pos[2];
            add_line(start, end);
        }
        if (!up) {
            let start = m.r_corner_pos[0];
            let end = m.r_corner_pos[1];
            add_line(start, end);
        }
        if (!down) {
            let start = m.r_corner_pos[3];
            let end = m.r_corner_pos[2];
            add_line(start, end);
        }
        l.forEach(e => m.r.add(e));
        lines.push(...l);
    });
    ctx.scene.render();
    return lines;
}
