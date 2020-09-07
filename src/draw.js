import {
    Scene, Text, Rectangle, Component,
    Color, Container, Line, Circle
} from "pencil.js";

import pako from "pako";
import msgpack from "msgpack-lite";

let cell_size = 0;
let grid_w = 0;
let grid_h = 0;
let grid_left = 0;
let grid_top = 0;
let grid_bottom = 0;
let grid_right = 0;
let corner_offset = 0;
let hover_offset = 0;

const sol_text_color = "rgb(29, 106, 229)";
const mark_color = "rgba(247, 208, 56, 0.5)";

const type_thermo = 1;
const type_cage = 2;
const type_edge_cage = 3;

const lock_normal = 1;
const lock_corner = 2;

const colors = [
    "rgba(0, 0, 0, 1)",
    "rgba(207, 207, 207, 0.5)",
    "rgba(255, 255, 255, 0)",
    "rgba(163, 224, 72, 0.5)",
    "rgba(210, 59, 231, 0.5)",
    "rgba(235, 117, 50, 0.5)",
    "rgba(226, 38, 31, 0.5)",
    "rgba(247, 208, 56, 0.5)",
    "rgba(52, 187, 230, 0.5)"];

let current_color = colors[1];
let current_mode = "set";
let current_style = null;
let scene = null;
let matrix = [];
let stuff = [];
let drag = false;
let undo_stack = [];
let thermo = null;
let cage = null;
let edge_cage = null;
let outer = null;
let underlay = null;
let shift = false;
let cursor = null;

function reset() {
    matrix = [];
    stuff = [];
    undo_stack = [];
    thermo = null;
    cage = null;
    edge_cage = null;
    outer = null;
    underlay = null;
    shift = false;
    cursor = null;
}

const textOptions = {
    font: "sans-serif",
    cursor: Component.cursors.pointer
};
const centerTextOptions = {
    font: "sans-serif",
    fill: sol_text_color,
    cursor: Component.cursors.pointer
};
const cornerTextOptions = {
    font: "sans-serif",
    fill: sol_text_color,
    cursor: Component.cursors.pointer
};
const cageCornerTextOptions = {
    font: "sans-serif",
    fill: "black",
    cursor: Component.cursors.pointer
};

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

function set_cell(x, y, mode, newtext)
{
    let m = get(x, y);
    let undo_entry = {
        mode: mode,
        x: x, y: y,
        newtext: newtext,
        old_normal: m.normal.text
    };

    if (!m.main_grid && mode !== "set") {
        return;
    }
    if (m.lock_type === lock_normal && mode !== "set") {
        return;
    }

    if (mode === "normal" || mode === "set") {
        if (mode === "normal") {
            m.normal.options.fill = sol_text_color;
        }
        else {
            m.lock_type = (newtext !== "") ? lock_normal : 0;
            m.normal.options.fill = "black";
        }
        if (!m.main_grid && newtext !== "")
            m.normal.text += newtext;
        else
            m.normal.text = newtext;
        const meas = Text.measure(m.normal.text, m.normal.text.options);
        m.normal.position.x = (cell_size - 2.5 * meas.width) / 2;
        m.normal.position.y = cell_size * 0.15;
        m.center.text = "";
        m.corner.forEach(t => { t.text = ""; });
        m.side.forEach(t => { t.text = ""; });
    }
    else if (mode === "center") {
        let current = m.center.text;
        let center = "";
        m.center.options.fill = sol_text_color;
        if (newtext !== "") {
            for (let i = 1; i <= 9; ++i) {
                if ((current.indexOf(i) === -1 && i === +newtext)
                    || (current.indexOf(i) !== -1 && i !== +newtext)) {
                    center += i;
                }
            }
        }

        m.normal.text = "";
        m.center.text = center;
        const meas = Text.measure(center, m.center.options);
        m.center.position.x = (cell_size - meas.width) / 2;
        m.center.position.y = (cell_size - meas.height) / 2;
    }
    else if (mode === "set_corner") {
        if (newtext === "")
            m.cage_corner.text = "";
        else
            m.cage_corner.text += newtext;
        m.lock_type = (newtext !== "") ? lock_corner : 0;
    }
    else if (mode === "corner") {
        let current = "";
        m.corner.forEach(t => { current += t.text; });
        m.side.forEach(t => { current += t.text; });
        let text = "";
        if (newtext !== "") {
            for (let i = 1; i <= 9; ++i) {
                if ((current.indexOf(i) === -1 && i === +newtext)
                    || (current.indexOf(i) !== -1 && i !== +newtext)) {
                    text += i;
                }
            }
        }
        let i = 0;
        m.normal.text = "";
        m.corner.forEach(t => { t.text = text[i++] || ""; });
        m.side.forEach(t => { t.text = text[i++] || ""; });
    }
    else if (mode === "color") {
        m.r_color.options.fill = colors[newtext - 1];
    }
    undo_entry.normal = m.normal.text;
    undo_stack.push(undo_entry);
}

function keyup(event) {
    if (event.key === "Shift") {
        shift = false;
    }
}

export function DrawSetNumber(number) {
  let count = 0;
  each_cell(m => {
    if (m.mark) {
      set_cell(m.x, m.y, current_mode, number);
      ++count;
    }
  });
  undo_stack.push({mode: 'group', count: count});
  scene.render();
}

export function DrawSetColor(color_index) {
  current_color = colors[color_index];
  each_cell(m => {
    if (m.mark)
      m.r_color.options.fill = current_color;
  });
  scene.render();
}

function keydown(event) {
    let newtext;
    if (event.key === "Shift") {
        shift = true;
        return;
    }
    else if (event.key === "Delete" || event.key === "Backspace") {
        newtext = "";
        event.preventDefault();
    }
    else if (event.key === "d" || event.key === "D") {
        let rem = [];
        stuff.forEach((s, i) => {
            if (s.type === type_thermo) {
                if (cursor[0] === s.start[0] && cursor[1] === s.start[1]) {
                    delete_thermo(cursor);
                    rem.push(i);
                }
            }
            if (s.type === type_cage) {
                if (s.cells.find(c => c[0] === cursor[0] && c[1] === cursor[1])) {
                    delete_cage(s.cells);
                    rem.push(i);
                }
            }
            if (s.type === type_edge_cage) {
                if (s.cells.find(c => c[0] === cursor[0] && c[1] === cursor[1])) {
                    delete_edge_cage(s.cells);
                    rem.push(i);
                }
            }
        });
        rem.forEach(r => stuff.splice(r, 1));
        scene.render();
        return;
    }
    else if (event.key >= "0" && event.key <= "9") {
        newtext = event.key;
    }
    else if (event.key.startsWith("Arrow") && cursor) {
        if (!shift) {
            each_cell(m => {
                if (m.mark) {
                    m.rect.options.fill = "rgba(255, 255, 255, 0)";
                    m.mark = false;
                }
            });
        }

        if (event.key === "ArrowUp" && cursor[1] > 0)
            cursor[1] -= 1;
        if (event.key === "ArrowDown" && cursor[1] < grid_h - 1)
            cursor[1] += 1;
        if (event.key === "ArrowLeft" && cursor[0] > 0)
            cursor[0] -= 1;
        if (event.key === "ArrowRight" && cursor[0] < grid_w - 1)
            cursor[0] += 1;
        mark(cursor[0], cursor[1]);
        scene.render();
        return;
    }
    else {
        return;
    }

    let count = 0;
    for (let x = 0; x < grid_w; ++x) {
      for (let y = 0; y < grid_h; ++y) {
            let m = get(x, y);
            if (m.mark) {
                set_cell(x, y, current_mode, newtext);
                ++count;
            }
        }
    }
    undo_stack.push({mode: 'group', count: count});

    scene.render();
}

function get(x, y) {
    if (x < 0 || y < 0 || x >= grid_w || y >= grid_h) {
        return null;
    }
    return matrix[y][x];
}

function mark(x, y) {
    let m = get(x, y);
    m.mark = true;
    m.rect.options.fill = mark_color;
}

function inner_hover(x, y) {
    if (!drag) return;

    if (current_mode === "thermo") {
        if (thermo.objs)
            thermo.objs.forEach(e => e.parent.remove(e));
        thermo.points.push([x, y]);
        thermo.objs = draw_thermo(thermo.start, thermo.points);
        scene.render();
    }
}

function move(event, x, y) {
    if (!drag) return;

    if (current_mode === "edge") {
        let m = get(x, y);
        let xp = event.position.x - outer.position.x - m.pos[0];
        let yp = event.position.y - outer.position.y - m.pos[1];
        if ((xp < cell_size * 0.4 || xp > cell_size * 0.6) && yp > cell_size * 0.4 && yp < cell_size * 0.6) {
            if (xp < cell_size * 0.4)
                m = get(x - 1, y);
            let edge = new Line(
                [cell_size, 0], [[0, cell_size]],
                {fill: null, strokeWidth: 3, stroke: "black"});
            m.edge_right.add(edge);
            scene.render();
        }
        else if ((yp < cell_size * 0.4 || yp > cell_size * 0.6)
                && xp > cell_size * 0.4 && xp < cell_size * 0.6) {
            if (yp < cell_size * 0.4)
                m = get(x, y - 1);
            let edge = new Line(
                [0, cell_size], [[cell_size, 0]],
                {fill: null, strokeWidth: 3, stroke: "black"});
            m.edge_bottom.add(edge);
            scene.render();
        }
    }
}

function hover(x, y) {
    if (!drag) return;

    if (current_mode === "thermo" || current_mode === "edge") {
    } else if (current_mode === "edge_cage") {
        delete_edge_cage(edge_cage.cells);
        edge_cage.cells.push([x, y]);
        draw_edge_cage(edge_cage.cells);
    } else if (current_mode === "cage") {
        if (cage.lines)
            cage.lines.forEach(l => l.parent.remove(l));
        cage.cells.push([x, y]);
        cage.lines = draw_cage(cage.cells);
    } else {
        mark(x, y);
    }
    scene.render();
}

function mousedown_window() {
    if (!shift) {
        each_cell(m => {
            if (m.mark) {
                m.rect.options.fill = "rgba(255, 255, 255, 0)";
                m.mark = false;
            }
        });
    }
    scene.render();
}

function mousedown(event, x, y) {
    if (!shift) {
        each_cell(m => {
            if (m.mark) {
                m.rect.options.fill = "rgba(255, 255, 255, 0)";
                m.mark = false;
            }
        });
    }

    cursor = [x, y];
    drag = true;

    if (current_mode === "thermo") {
        thermo = {start: [x, y], points: []};
        thermo.objs = draw_thermo(thermo.start, thermo.points);
    }
    else if (current_mode === "cage") {
        cage = {cells: [x, y]};
        cage.lines = draw_cage(cage.cells);
    }
    else if (current_mode === "edge_cage") {
        edge_cage = {cells: [x, y]};
        draw_edge_cage(edge_cage.cells);
    }
    else if (current_mode === "edge") {
    }
    else {
        mark(x, y);
    }

    scene.render();
}

function delete_thermo(pos)
{
    let start = center_px(pos);
    let remove = [];
    underlay.children.forEach(e => {
        if (e.position.x === start[0] && e.position.y === start[1])
            remove.push(e);
    });
    underlay.remove(...remove);
    scene.render();
}

function center_px(p)
{
    return [p[0] * cell_size + cell_size / 2,
            p[1] * cell_size + cell_size / 2];
}

function draw_thermo(start, points) {
    let _color = current_color.match(/[.\d]+/g).map(c => (c > 1) ? c / 255 : +c);
    let color = new Color(..._color);
    color.red = color.red * color.alpha + (1 - color.alpha) * 1;
    color.green = color.green * color.alpha + (1 - color.alpha) * 1;
    color.blue = color.blue * color.alpha + (1 - color.alpha) * 1;
    color.alpha = 1;
    let start_px = center_px(start);
    let bulb = null;
    if (current_style.thermoStyle === "bulb")
      bulb = new Circle(start_px, cell_size * 0.4, {fill: color});
    points = points.map(p => {
        let px = center_px(p);
        return {x: px[0] - start_px[0], y: px[1] - start_px[1]};
    });
    let line = new Line(start_px, points,
        {stroke: color, strokeWidth: cell_size * 0.3, join: Line.joins.miter});
    let objs = [line];
    if (bulb)
      objs.push(bulb);
    underlay.add(...objs);
    scene.render();
    return objs;
}

function mouseup() {
    drag = false;
    if (current_mode === "thermo" && thermo) {
        stuff.push({type: type_thermo, start: thermo.start, points: thermo.points});
        thermo = null;
    }
    else if (current_mode === "cage" && cage) {
        stuff.push({type: type_cage, cells: cage.cells});
        cage = null;
    }
    else if (current_mode === "edge_cage" && edge_cage) {
        stuff.push({type: type_edge_cage, cells: edge_cage.cells});
        edge_cage = null;
    }
}

export function DrawSetMode(state) {
    current_mode = state.mode;
    current_style = state;
    if (state.mode === "cage" && state.cageStyle === "edge")
      current_mode = "edge_cage"
    if (state.mode === "number" && state.numberStyle === "normal")
      current_mode = "set"
    if (state.mode === "number" && state.numberStyle === "corner")
      current_mode = "set_corner"
}

class CageLine extends Line {
    setContext(ctx) {
        super.setContext(ctx);
        ctx.setLineDash([4, 4]);
    }
}

function each_cell(f) {
    for (let x = 0; x < grid_w; ++x) {
        for (let y = 0; y < grid_h; ++y) {
            let m = get(x, y);
            f(m);
        }
    }
}

function delete_cage(cells)
{
    let get_cage = (x, y) => {
        return cells.find(e => e[0] === x && e[1] === y);
    };

    each_cell(m => {
        if (get_cage(m.x, m.y))
            m.r_cage.empty();
    });
}

function draw_cage(cells)
{
    let get_cage = (x, y) => {
        return cells.find(e => e[0] === x && e[1] === y);
    };

    let lines = [];
    each_cell(m => {
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
            l.push(new CageLine(
                start, [[end[0] - start[0], end[1] - start[1]]],
                {strokeWidth: 2, stroke: "black"}));
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
        l.forEach(e => m.r_cage.add(e));
        lines = lines.concat(l);
    });
    scene.render();
    return lines;
}

function delete_edge_cage(cells)
{
    let get_cage = (x, y) => {
        return cells.find(e => e[0] === x && e[1] === y);
    };

    each_cell(m => {
        if (get_cage(m.x, m.y))
            m.edge_cage.empty();
    });
}

function draw_edge_cage(cells)
{
    let get_cage = (x, y) => {
        return cells.find(e => e[0] === x && e[1] === y);
    };

    each_cell(m => {
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
        l.forEach(e => m.edge_cage.add(e));
    });
    scene.render();
}

function load(base64)
{
    let pack = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    let unpack = pako.inflate(pack);
    let data = msgpack.decode(unpack);

    underlay.empty();

    stuff = [];
    each_cell(m => {
        m.lock_type = 0;
        m.normal.text = "";
        m.center.text = "";
    });

    data.cells.forEach(c => {
        if (c[2] === lock_normal) {
            set_cell(c[0], c[1], "set", c[3]);
        }
        else if (c[2] === lock_corner) {
            set_cell(c[0], c[1], "set_corner", c[3]);
        }
    });
    data.stuff.forEach(s => {
        stuff.push(s);
        if (s.type === type_thermo) {
            draw_thermo(s.start, s.points);
        }
        else if (s.type === type_cage) {
            draw_cage(s.cells);
        }
        else if (s.type === type_edge_cage) {
            draw_edge_cage(s.cells);
        }
    });

    scene.render();
}

export function DrawGenerateUrl()
{
    let out = {
        gw: grid_w,
        gh: grid_h,
        cells: [],
        stuff: stuff
    };

    each_cell(m => {
        if (m.lock_type === lock_normal) {
            out.cells.push([m.x, m.y, m.lock_type, m.normal.text]);
        }
        if (m.lock_type === lock_corner) {
            out.cells.push([m.x, m.y, m.lock_type, m.cage_corner.text]);
        }
    });

    let coded = msgpack.encode(out);
    let packed = pako.deflate(coded);
    let base64 = btoa(String.fromCharCode(...packed));
    return window.location.origin + "/?p=" + encodeURIComponent(base64);
}

export function DrawUndo() {
    if (undo_stack.length === 0)
        return;
    let u = undo_stack.pop();
    let count = 0;
    if (u.mode === "group") {
        count = u.count;
        u = undo_stack.pop();
    }
    do {
        if (u.mode === "normal" || u.mode === "set") {
            set_cell(u.x, u.y, u.mode, u.old_normal);
        }
        else if (u.mode === "center" || u.mode === "corner") {
            set_cell(u.x, u.y, u.mode, u.newtext);
        }
        undo_stack.pop();
        --count;
        if (count > 0) {
            u = undo_stack.pop();
        }
    } while (count > 0);
    scene.render();
}

export function DrawAddGrid() {
    let box_w = grid_w - grid_left - grid_right;
    let box_h = grid_h - grid_top - grid_bottom;
    for (let x = 0; x < box_w; ++x) {
        for (let y = 0; y < box_h; ++y) {
            if (x % 3 === 0) {
                let edge = new Line(
                    [0, 0], [[0, cell_size]],
                    {fill: null, strokeWidth: 4, stroke: "black"});
                let m = get(x + grid_left, y + grid_top);
                m.edge_right.add(edge);
            }
            if (y % 3 === 0) {
                let edge = new Line(
                    [0, 0], [[cell_size, 0]],
                    {fill: null, strokeWidth: 4, stroke: "black"});
                let m = get(x + grid_left, y + grid_top);
                m.edge_bottom.add(edge);
            }
        }
    }
    scene.render();
}

export function DrawRender(code, wrapper, cellSize, size, margins) {
    cell_size = cellSize;
    grid_left = margins.left;
    grid_right = margins.right;
    grid_top = margins.top;
    grid_bottom = margins.bottom;
    grid_w = grid_left + size.width + grid_right;
    grid_h = grid_top + size.height + grid_bottom;
    corner_offset = cell_size * 0.08;
    hover_offset = cell_size * 0.2;

    let wrapper_clone = wrapper.cloneNode(false);
    wrapper.parentNode.replaceChild(wrapper_clone, wrapper);
    wrapper_clone.style.width = (cell_size * grid_w + 20) + "px";
    wrapper_clone.style.height = (cell_size * grid_h + 250) + "px";
    scene = new Scene(wrapper_clone);
    scene.on("keyup", (event) => keyup(event));
    scene.on("mouseup", () => mouseup());
    reset();

    const outer_w = cell_size * grid_w;
    const outer_x = (scene.size.x - outer_w) / 2;
    const outer_y = 20;
    const options = {
        fill: "rgba(255, 255, 255, 0)",
        stroke: "black",
        strokeWidth: 1,
        cursor: Component.cursors.pointer
    };
    const options_inner = {
        fill: "rgba(255, 255, 255, 0)",
        cursor: Component.cursors.pointer
    };

    textOptions.fontSize = cell_size * 0.8;
    centerTextOptions.fontSize = cell_size * 0.3;

    outer = new Container([outer_x, outer_y]);
    scene.add(outer);

    underlay = new Container([0, 0]);
    outer.add(underlay);

    for (let y = 0; y < grid_h; ++y) {
        matrix[y] = [];
    }
    for (let x = 0; x < grid_w; ++x) {
        for (let y = 0; y < grid_h; ++y) {
            let xp = x * cell_size;
            let yp = y * cell_size;
            let main_grid = (x >= grid_left && y >= grid_top
              && x < (grid_w - grid_right) && y < (grid_h - grid_bottom));
            let cont = new Container([xp, yp]);
            options.strokeWidth = main_grid ? 1 : 0;
            let r = new Rectangle([0, 0], cell_size, cell_size, options);
            options.strokeWidth = 0;
            let edge_right = new Rectangle([0, 0], cell_size, cell_size, options);
            let edge_bottom = new Rectangle([0, 0], cell_size, cell_size, options);
            let edge_cage = new Rectangle([0, 0], cell_size, cell_size, options);
            let r_cage = new Rectangle([0, 0], cell_size, cell_size, options);
            let r_color = new Rectangle([0, 0], cell_size, cell_size, options);
            let r_hover = new Rectangle(
                [hover_offset, hover_offset],
                cell_size - hover_offset * 2,
                cell_size - hover_offset * 2, options_inner);
            let normal = new Text([0, cell_size * 0.5], "", textOptions);
            let center = new Text([0, cell_size * 0.4], "", centerTextOptions);
            let corner_pos = [];
            corner_pos[0] = [corner_offset, corner_offset];
            corner_pos[1] = [cell_size - corner_offset, corner_offset];
            corner_pos[2] = [cell_size - corner_offset, cell_size - corner_offset];
            corner_pos[3] = [corner_offset, cell_size - corner_offset];
            let side_pos = [];
            side_pos[0] = [cell_size / 2, corner_offset];
            side_pos[1] = [cell_size - corner_offset, cell_size / 2];
            side_pos[2] = [cell_size / 2, cell_size - corner_offset];
            side_pos[3] = [corner_offset, cell_size / 2];
            let center_pos = [cell_size / 2, cell_size / 2];

            let cage_corner = [];
            let corner = [];
            if (main_grid) {
                cornerTextOptions.fontSize = cell_size * 0.25;
                cageCornerTextOptions.fontSize = cell_size * 0.25;
                corner_pos.forEach((p, i) => {
                    p = p.slice(0);
                    p[0] -= cell_size * 0.025;
                    p[1] -= cell_size * 0.025;
                    if (i === 2 || i === 3) p[1] -= cell_size * 0.15;
                    if (i === 1 || i === 2) p[0] -= cell_size * 0.1;
                    if (i === 0)
                        cage_corner.push(new Text2(p, "", cageCornerTextOptions));
                    corner.push(new Text(p, "", cornerTextOptions));
                });
            }
            let side = [];
            if (main_grid) {
                side_pos.forEach((p, i) => {
                    p = p.slice(0);
                    p[0] -= cell_size * 0.02;
                    p[1] -= cell_size * 0.02;
                    if (i === 2) p[1] -= cell_size * 0.15;
                    if (i === 1 || i === 3) p[1] -= cell_size * 0.05;
                    if (i === 0 || i === 2) p[0] -= cell_size * 0.02;
                    if (i === 1) p[0] -= cell_size * 0.1;
                    side.push(new Text(p, "", cornerTextOptions));
                });
            }

            let r_corner = [];
            r_corner[0] = [0, 0];
            r_corner[1] = [cell_size, 0];
            r_corner[2] = [cell_size, cell_size];
            r_corner[3] = [0, cell_size];
            let corner_ext_pos = [];
            corner_ext_pos[0] = [0, corner_offset];
            corner_ext_pos[1] = [corner_offset, 0];
            corner_ext_pos[2] = [cell_size - corner_offset, 0];
            corner_ext_pos[3] = [cell_size, corner_offset];
            corner_ext_pos[4] = [cell_size, cell_size - corner_offset];
            corner_ext_pos[5] = [cell_size - corner_offset, cell_size];
            corner_ext_pos[6] = [corner_offset, cell_size];
            corner_ext_pos[7] = [0, cell_size - corner_offset];
            cont.add(r_color, r, r_cage, edge_cage,
                     edge_right, edge_bottom, r_hover, normal, center,
                     ...cage_corner, ...corner, ...side);
            cont.on("mousedown", (event) => mousedown(event, x, y));
            cont.on("hover", () => hover(x, y));
            cont.on("mousemove", (event) => move(event, x, y));
            r_hover.on("hover", () => inner_hover(x, y));
            matrix[y][x] = {
                x: x, y: y, pos: [xp, yp], cont: cont, rect: r,
                normal: normal, center: center,
                r_corner_pos: r_corner,
                corner: corner, side: side,
                corner_pos: corner_pos, center_pos: center_pos,
                side_pos: side_pos,
                corner_ext_pos: corner_ext_pos,
                cage_corner: cage_corner[0],
                edge_cage: edge_cage,
                edge_right: edge_right,
                edge_bottom: edge_bottom,
                r_cage: r_cage, r_color: r_color, main_grid: main_grid
            };
            outer.add(cont);
        }
    }

    let frame_w = grid_w - grid_left - grid_right;
    let frame_h = grid_h - grid_top - grid_bottom;
    let frame = new Rectangle(
        [grid_left * cell_size, grid_top * cell_size],
        frame_w * cell_size, frame_h * cell_size,
        {strokeWidth: 4, stroke: "black", fill: null});
    outer.add(frame);

    scene.render();

    if (code)
        load(code);

    return null;
}

window.addEventListener("keydown", (event) => keydown(event));
