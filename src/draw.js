import { Stage, Layer, Text, Rect, Group, Line, Circle, Util } from "konva";
import { draw_cage } from "./cage";
import { draw_path } from "./path";
import { draw_symbol } from "./symbols";
import pako from "pako";
import msgpack from "msgpack-lite";
import { isEqual, range, findLastIndex, last } from "lodash";

let ctx = {};
let cell_size = 0;
let grid_w = null;
let grid_h = null;
let grid_left = 0;
let grid_top = 0;
let grid_bottom = 0;
let grid_right = 0;
let grid_div_width = 0;
let grid_div_height = 0;
let grid_style = "normal";
let grid_left_diagonal = false;
let grid_right_diagonal = false;
let corner_offset = 0;
let hover_offset = 0;
let symbol_page = 0;
let multi_digit = false;
let number_bg = false;

const thin_grid_line = 0.01;
const medium_grid_line = 0.05;
const fat_grid_line = 0.1;

const type_path = 1;
const type_cage = 2;

const lock_normal = 1;
const lock_color = 2;
const lock_boundary = 3;

const b_corner = 1;
const b_side = 2;
const b_quarter = 3;
const b_boundary = 4;
const b_edge = 5;

const b_left = 1;
const b_top = 2;
const b_bottom = 3;
const b_right = 4;

const sol_text_color = "rgb(29, 106, 229)";
const mark_color = "rgba(247, 208, 56, 0.5)";
export const DrawColors = [
  "rgba(0, 0, 0, 1)",
  "rgba(207, 207, 207, 0.5)",
  "rgba(255, 255, 255, 0)",
  "rgba(163, 224, 72, 0.5)",
  "rgba(210, 59, 231, 0.5)",
  "rgba(235, 117, 50, 0.5)",
  "rgba(226, 38, 31, 0.5)",
  "rgba(247, 208, 56, 0.5)",
  "rgba(52, 187, 230, 0.5)",
  //
  "rgba(140, 140, 140, 0.5)",
  "rgba(80, 80, 80, 0.5)",
  "rgba(20, 20, 20, 0.5)",
];

export function DrawColorPremul(color) {
  if (typeof color === "number") {
    color = DrawColors[color];
  }
  // Premultiply for thermo
  color = Util.colorToRGBA(color);
  color.r = color.r * color.a + (1 - color.a) * 255;
  color.g = color.g * color.a + (1 - color.a) * 255;
  color.b = color.b * color.a + (1 - color.a) * 255;
  color.a = 1;
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
}

let current_color = 0;
let current_mode = "normal";
let current_rmode = null;
let current_style = null;
let solve_mode = false;
let scene = null;
let matrix = [];
let stuff = [];
let edges = {};
let drag = false;
let drag_toggle = null;
let drag_button = -1;
let undo_stack = [];
let redo_stack = [];
let current = null;
let outer = null;
let underlay = null;
let shift = false;
let cursor = null;
let boundary = null;
let grid_lines = [];

function reset() {
  matrix = [];
  stuff = [];
  edges = {};
  undo_stack = [];
  redo_stack = [];
  current = null;
  outer = null;
  underlay = null;
  shift = false;
  cursor = null;
}

export function DrawSetSymbolPage(page) {
  symbol_page = page;
}

class TextHolder {
  constructor(container, color, fontSize, size) {
    this.container = container;
    this._color = color;
    this.fontSize = fontSize;
    this.size = size;
    this._text = "";
    this.obj = null;
  }

  text(t) {
    if (t === undefined) return this._text;

    this._text = t;
    if (this._text.length > 0) {
      if (!this.obj) {
        this.obj = new Text({
          fill: this._color,
          text: this._text,
          fontSize: this.fontSize,
        });
        this.container.add(this.obj);
      } else this.obj.text(this._text);

      if (this.size === 1) {
        let size = cell_size;
        let meas = {
          width: this.fontSize * this._text.length * 0.6,
          height: this.fontSize,
        };
        this.obj.position({
          x: (size - meas.width) / 2 - size * 0.2,
          y: (size - meas.height) / 2 - size * 0.1,
        });
      } else if (this.size === 2) {
        let size = 64;
        let meas = {
          width: this.fontSize * this._text.length * 0.5,
          height: this.fontSize,
        };
        this.obj.position({
          x: (size - meas.width) / 2,
          y: (size - meas.height) / 2,
        });
      } else {
        this.obj.position({
          x: 0,
          y: 0,
        });
      }
    } else if (this.obj) {
      this.obj.destroy();
      this.obj = null;
    }
  }

  color(c) {
    if (c === undefined) return this._color;

    this._color = c;
    if (this.obj) this.obj.fill(this._color);
  }
}

function set_symbol(container, str, color, _size) {
  let text;
  let size = _size;
  if (container.normal) {
    if (typeof color === "number") color = DrawColors[color];
    size = cell_size;
    text = container.normal.text;
    if (multi_digit) str = text.text() + str;
    container = container.symcont;
  } else if (size > 0) {
    // Symbol page
    color = "gray";
  } else {
    size = container.bsize;
    if (multi_digit && str !== "") str = (container.symboltext || "") + str;
  }
  if (str[0] === "#" || !text) {
    draw_symbol(container, str, color, size, number_bg);
  } else {
    text.text(str);
    text.color(color);
  }
}

export function DrawSymbol(element, page, num, size) {
  let stage = new Stage({ container: element, width: size, height: size });
  let layer = new Layer();
  set_symbol(layer, "#" + page + num, current_color, size);
  stage.add(layer);
  stage.draw();
}

function save_state() {
  let state = [];
  each_cell((m) => {
    let s = { x: m.x, y: m.y };
    if (m.normal.text.text() !== "") s.normal = m.normal.text.text();
    else {
      if (m.center.text.text() !== "") s.center = m.center.text.text();
      if (m.corner.length > 0) s.corner = m.corner.map((c) => c.text.text());
    }
    if (m.r_color.fillEnabled()) s.color = m.r_color.fill();
    state.push(s);
  });
  return state;
}

function save_undo() {
  let state = save_state();
  undo_stack.push(state);
}

function load_state(state) {
  state.forEach((c) => {
    let m = get(c.x, c.y);
    set_cell([c.x, c.y], "reset", null, "");
    if (c.normal) m.normal.text.text(c.normal);
    else {
      if (c.center) m.center.text.text(c.center);
      if (c.corner) c.corner.forEach((c, i) => m.corner[i].text.text(c));
      if (c.color) {
        m.r_color.fill(c.color);
        m.r_color.fillEnabled(true);
      }
    }
  });
}

function _set_cell(lock, pos, mode, color, newtext) {
  let x = pos[0];
  let y = pos[1];
  let b = null;
  if (pos.length === 3) b = get(...pos);
  let m = get(x, y);

  if (!m.main_grid && mode !== "normal" && !lock) {
    return;
  }
  if (m.lock_type === lock_normal && !lock && mode !== "color") {
    return;
  }

  if (mode === "reset") {
    m.center.text.text("");
    m.normal.text.text("");
    m.corner.forEach((c) => c.text.text(""));
    m.r_color.fill(null);
    m.r_color.fillEnabled(false);
    m.boundary.forEach((b) => {
      if (b.edge && !b.lock) {
        b.edge.destroy();
        b.edge = null;
      }
    });
    if (lock) {
      m.r_color_set.fill(null);
      m.r_color_set.fillEnabled(false);
      m.fill = -1;
      if (m.symcont.symbol) {
        m.symcont.symbol.destroy();
        m.symcont.symbol = null;
        m.symcont.symboltext = "";
      }
      m.boundary.forEach((b) => {
        if (b.symbol) {
          b.symbol.destroy();
          b.symbol = null;
          b.symboltext = "";
        }
        if (b.rect) {
          b.rect.destroy();
          b.rect = null;
        }
        if (b.edge) {
          b.edge.destroy();
          b.edge = null;
        }
      });
    }
  } else if (b) {
    set_symbol(b, newtext, color);
  } else if (mode === "normal") {
    if (!lock) {
      color = sol_text_color;
    } else {
      m.lock_type = newtext !== "" ? lock_normal : 0;
      if (newtext[0] !== "#") {
        m.color = color;
      }
    }
    set_symbol(m, newtext, color);
    if (newtext[0] !== "#") {
      m.center.text.text("");
      m.corner.forEach((c) => c.text.text(""));
    }
  } else if (mode === "center" && m.normal.text.text() === "") {
    let current = m.center.text.text();
    let center = "";
    if (newtext !== "") {
      for (let i = 1; i <= 9; ++i) {
        if (
          (current.indexOf(i) === -1 && i === +newtext) ||
          (current.indexOf(i) !== -1 && i !== +newtext)
        ) {
          center += i;
        }
      }
    }

    m.center.text.text(center);
  } else if (mode === "corner" && m.normal.text.text() === "") {
    let current = "";
    m.corner.forEach((t) => (current += t.text.text()));
    let text = "";
    if (newtext !== "") {
      for (let i = 1; i <= 9; ++i) {
        if (
          (current.indexOf(i) === -1 && i === +newtext) ||
          (current.indexOf(i) !== -1 && i !== +newtext)
        ) {
          text += i;
        }
      }
    }
    let i = 0;
    m.corner.forEach((c) => c.text.text(text[i++] || ""));
  } else if (mode === "color") {
    if (!lock) {
      m.r_color.fill(DrawColors[color]);
      m.r_color.fillEnabled(true);
    } else {
      m.r_color_set.fill(DrawColors[color]);
      m.r_color_set.fillEnabled(true);
      m.fill = color;
    }
  }
}

function keyup(event) {
  if (event.key === "Shift") {
    shift = false;
  }
}

function set_cell(pos, mode, color, newtext) {
  let lock = !solve_mode;
  _set_cell(lock, pos, mode, color, newtext);
}

function lock_cell(pos, mode, color, newtext) {
  _set_cell(true, pos, mode, color, newtext);
}

export function DrawSetNumber(number) {
  save_undo();

  let symbol = "" + number;
  if (symbol_page > 0) symbol = "#" + symbol_page + number;
  if (boundary) {
    set_cell(boundary, "boundary", current_color, symbol);
  } else {
    let count = 0;
    let mode = current_mode;
    each_mark((m) => ++count);
    if (count > 1 && solve_mode && mode === "normal") mode = "center";
    each_mark((m) => set_cell([m.x, m.y], mode, current_color, symbol));
  }
  scene.draw();
}

export function DrawSetColor(color_index) {
  save_undo();

  current_color = color_index;
  if (current_mode === "color") {
    each_mark((m) => {
      set_cell([m.x, m.y], "color", color_index, null);
    });
    scene.draw();
  }
}

function keydown(event) {
  if (event.target.tagName === "TEXTAREA") {
    return;
  }

  let newtext;
  if (event.key === "Shift") {
    shift = true;
    return;
  } else if (event.key === "Delete" || event.key === "Backspace") {
    DrawDelete();
    event.preventDefault();
    return;
  } else if (event.key >= "0" && event.key <= "9") {
    newtext = event.key;
    if (symbol_page > 0) newtext = "#" + symbol_page + newtext;
  } else if (event.key === "u" && solve_mode) {
    DrawUndo();
    return;
  } else if (
    event.key.length === 1 &&
    ((event.key >= "a" && event.key <= "z") ||
      (event.key >= "A" && event.key <= "Z")) &&
    !solve_mode
  ) {
    newtext = event.key;
  } else if (event.key.startsWith("Arrow") && cursor) {
    let c = cursor.slice();
    if (!shift) unmark();
    cursor = c;
    if (event.key === "ArrowUp" && cursor[1] > 0) cursor[1] -= 1;
    if (event.key === "ArrowDown" && cursor[1] < grid_h - 1) cursor[1] += 1;
    if (event.key === "ArrowLeft" && cursor[0] > 0) cursor[0] -= 1;
    if (event.key === "ArrowRight" && cursor[0] < grid_w - 1) cursor[0] += 1;
    mark(cursor[0], cursor[1]);
    scene.draw();
    return;
  } else {
    return;
  }

  save_undo();

  if (boundary) {
    set_cell(boundary, "boundary", current_color, newtext);
  } else {
    let count = 0;
    each_mark((m) => ++count);

    let mode = current_mode;
    if (count > 1 && solve_mode && mode === "normal") mode = "center";
    each_mark((m) => {
      if (current_mode === "color") {
        let color = +newtext - 1;
        if (color >= 0 && color <= 9)
          set_cell([m.x, m.y], current_mode, color, null);
      } else set_cell([m.x, m.y], mode, current_color, newtext);
    });
  }
  scene.draw();
}

function get(x, y, b) {
  if (x < 0 || y < 0 || x >= grid_w || y >= grid_h) {
    return null;
  }
  let m = matrix[y][x];
  if (b >= 0) return m.boundary[b];
  return m;
}

function mark(x, y) {
  let m = get(x, y);
  cursor = [x, y];
  if (!m.mark) {
    m.mark = true;
    m.rect.fill(mark_color);
    m.rect.fillEnabled(true);
    return true;
  }
  return false;
}

function inner_mousemove(event, x, y) {
  if (!drag) return;
  if (drag_button !== 0) return;

  if (current_mode === "path") {
    if (current.cells.length > 0) {
      let l = last(current.cells);
      if (l[0] === x && l[1] === y) return;
    }
    current.objs.forEach((o) => o.destroy());
    current.cells.push([x, y]);
    current.objs = draw_path(ctx, current.cells, current_style, current_color);
    scene.draw();
  }
}

let last_toggle_state = null;

function edge_toggle(x, y, i, style, color, lock) {
  let m = get(x, y);
  let b = m.boundary[i];
  let c = solve_mode ? sol_text_color : DrawColors[current_color];
  if (color !== undefined) c = DrawColors[color];
  let eo = cell_size * 0.15;
  let del;

  if (b.lock && solve_mode) return;

  if (last_toggle_state === null) {
    if (b.edge) last_toggle_state = true;
    else last_toggle_state = false;
  }
  del = last_toggle_state;

  let width;
  switch (style) {
    case "thin":
      width = cell_size * thin_grid_line;
      break;
    case "medium":
      width = cell_size * medium_grid_line;
      break;
    default:
      width = cell_size * fat_grid_line;
      break;
  }

  if (del) {
    if (b.edge) {
      b.edge.destroy();
      b.edge = null;
      delete edges[[x, y, i]];
    }
  } else if (!b.edge) {
    let edge;
    let new_edge = (x, y, x1, y1) => {
      edge = new Line({
        x: x,
        y: y,
        points: [0, 0, x1, y1],
        strokeWidth: width,
        stroke: c,
        lineCap: "round",
        listening: false,
      });
    };
    switch (b.btype2) {
      case b_left:
      case b_right:
        new_edge(eo, -eo, 0, cell_size);
        break;
      case b_top:
      case b_bottom:
        new_edge(-eo, eo, cell_size, 0);
        break;
      default:
        break;
    }
    edges[[x, y, i]] = [style, color];
    b.edge = edge;
    b.lock = lock;
    b.add(edge);
  }
  scene.draw();
}

let last_toggle = { x: -1, y: -1, i: -1 };

function edge_mousemove(event, x, y, i) {
  if (!drag) return;

  if (last_toggle.x === x && last_toggle.y === y && last_toggle.i === i) return;
  last_toggle = { x: x, y: y, i: i };
  edge_toggle(x, y, i, current_style, current_color);
}

let last_move = [-1, -1];

function mousemove(event, x, y) {
  if (x === last_move[0] && y === last_move[1]) return;

  last_move[0] = x;
  last_move[1] = y;

  if (!drag) return;

  if (drag_button === 2 && current_rmode === "cross") {
    let m = get(x, y);
    m.normal.text.text("");
    if (m.symcont.symbol) {
      m.symcont.symbol.destroy();
      m.symcont.symbol = null;
      m.symcont.symboltext = "";
    }
    if (drag_toggle) draw_symbol(m.symcont, "#44", sol_text_color, cell_size);
    scene.draw();
    return;
  }

  if (current_mode === "path" || current_mode === "edge") {
  } else if (current_mode === "cage") {
    if (current.cells.length > 0) {
      let l = last(current.cells);
      if (l[0] === x && l[1] === y) return;
    }
    if (current.objs) current.objs.forEach((o) => o.destroy());
    current.cells.push([x, y]);
    current.objs = draw_cage(ctx, current.cells, current_style, current_color);
  } else {
    mark(x, y);
  }

  scene.draw();
}

function mark_boundary(x, y, i) {
  unmark();

  let b = get(x, y).boundary[i];
  if (!b.rect) {
    b.rect = new Rect({
      width: b.bwidth,
      height: b.bheight,
      fillEnabled: false,
    });
    b.add(b.rect);
  }
  b.rect.stroke("red");
  b.rect.strokeWidth(1);
  boundary = [x, y, i];
}

function unmark() {
  if (boundary) {
    let r = get(...boundary).rect;
    if (r) r.strokeWidth(0);
    boundary = null;
  }
  each_mark((m) => {
    m.rect.fill(null);
    m.mark = false;
  });
  cursor = null;
}

function boundary_mousedown(event, x, y, i) {
  mark_boundary(x, y, i);
  scene.draw();
}

function contextmenu(event) {
  if (event.target.tagName === "CANVAS") event.preventDefault();
}

function window_mousedown(event) {
  if (event.target.tagName === "HTML") {
    unmark();
    scene.draw();
  }
  last_move = [-1, -1];
}

function mousedown(event, x, y, i) {
  event.evt.stopPropagation();

  if (event.evt.button === 2 && current_rmode === "edgecross") {
    if (i !== undefined) {
      let b = get(x, y).boundary[i];
      if (b.symbol) {
        b.symbol.destroy();
        b.symbol = null;
        b.symboltext = "";
        drag_toggle = false;
      } else {
        draw_symbol(b, "#44", sol_text_color, [b.bwidth, b.bheight]);
        drag_toggle = true;
      }
      scene.draw();
    }
    return;
  }

  if (event.evt.button === 2 && current_rmode === "cross") {
    let m = get(x, y);
    m.normal.text.text("");
    if (m.symcont.symbol) {
      m.symcont.symbol.destroy();
      m.symcont.symbol = null;
      m.symcont.symboltext = "";
      drag_toggle = false;
    } else {
      draw_symbol(m.symcont, "#44", "black", cell_size);
      drag_toggle = true;
    }
    scene.draw();
    return;
  }

  if (!shift) {
    unmark();
  }

  drag = true;
  if (event.evt.type === "touchstart") drag_button = 0;
  else drag_button = event.evt.button;

  if (boundary) {
    get(...boundary).strokeWidth(0);
    boundary = null;
  }

  if (current_mode === "path") {
    current = { cells: [[x, y]], color: current_color };
    current.objs = draw_path(ctx, current.cells, current_style, current_color);
  } else if (current_mode === "cage") {
    current = { cells: [[x, y]], color: current_color };
    current.objs = draw_cage(ctx, current.cells, current_style, current_color);
  } else if (current_mode === "edge" && i !== undefined) {
    edge_toggle(x, y, i, current_style, current_color);
  } else {
    mark(x, y);
  }

  scene.draw();
}

function edge_mouseup(event, x, y, i) {
  if (event.evt.button === 2) return;
  if (last_toggle_state === null) edge_toggle(x, y, i, current_style, current_color);
  last_toggle_state = null;
  drag = false;
  mark(x, y);
}

function mouseup() {
  drag = false;

  if (current_mode === "path" && current) {
    stuff.push({
      type: type_path,
      style: current_style,
      cells: current.cells,
      objs: current.objs,
      color: current_color,
    });
    cursor = last(current.cells);
    current = null;
  } else if (current_mode === "cage" && current) {
    stuff.push({
      type: type_cage,
      style: current_style,
      cells: current.cells,
      objs: current.objs,
      color: current_color,
    });
    cursor = last(current.cells);
    current = null;
  }
}

export function DrawSetMode(state) {
  current_mode = state.mode;
  number_bg = state.numberBackground;
  multi_digit = state.multiDigit;

  each_cell((m) =>
    m.boundary.forEach((b) => {
      if (b.rect) {
        b.rect.destroy();
        b.rect = null;
      }
    })
  );

  if (state.mode === "cage") current_style = state.cageStyle;
  if (state.mode === "path") current_style = state.pathStyle;
  if (state.mode === "edge") current_style = state.edgeStyle;
  if (state.mode === "edgecross") {
    current_mode = "edge";
    current_rmode = "edgecross";
  }
  if (state.mode === "centerline") {
    current_mode = "path";
    current_style = "fat";
    current_color = sol_text_color;
    current_rmode = "edgecross";
  }
  if (
    (state.mode === "normal" || state.mode === "number") &&
    state.numberStyle === "normal"
  ) {
    current_mode = "normal";
  }

  if (current_mode === "edge") {
    each_cell((m) =>
      m.boundary.forEach((b, i) => {
        if (b.btype === b_edge) {
          if (!b.rect) {
            b.rect = new Rect({
              width: b.bwidth,
              height: b.bheight,
              fill: null,
              fillEnabled: false,
            });
            b.add(b.rect);
          }
          b.rect.fillEnabled(true);
          b.rect.on("mousemove touchmove", (event) =>
            edge_mousemove(event, m.x, m.y, i)
          );
          b.rect.on("mousedown tap touchstart", (event) =>
            mousedown(event, m.x, m.y, i)
          );
          b.rect.on("mouseup touchend", (event) =>
            edge_mouseup(event, m.x, m.y, i)
          );
        }
      })
    );
  }

  let setBoundary = (type) => {
    each_cell((m) =>
      m.boundary.forEach((b, i) => {
        if (b.btype === type) {
          if (!b.rect) {
            b.rect = new Rect({
              width: b.bwidth,
              height: b.bheight,
              fill: null,
              fillEnabled: true,
            });
            b.add(b.rect);
          }
          b.rect.on("mousedown touchstart tap", (event) =>
            boundary_mousedown(event, m.x, m.y, i)
          );
        }
      })
    );
  };

  if (state.mode === "number" && state.numberStyle === "corner") {
    current_mode = "boundary";
    setBoundary(b_corner);
  }
  if (state.mode === "number" && state.numberStyle === "side") {
    current_mode = "boundary";
    setBoundary(b_side);
  }
  if (state.mode === "number" && state.numberStyle === "quarter") {
    current_mode = "boundary";
    setBoundary(b_quarter);
  }
  if (state.mode === "number" && state.numberStyle === "boundary") {
    current_mode = "boundary";
    setBoundary(b_boundary);
  }
  scene.draw();
}

function each_cell(f) {
  for (let x = 0; x < grid_w; ++x) {
    for (let y = 0; y < grid_h; ++y) {
      let m = get(x, y);
      f(m);
    }
  }
}

function each_mark(f) {
  for (let x = 0; x < grid_w; ++x) {
    for (let y = 0; y < grid_h; ++y) {
      let m = get(x, y);
      if (m.mark) f(m);
    }
  }
}

function unserialize_grid(s) {
  [
    cell_size,
    grid_w,
    grid_h,
    grid_left,
    grid_right,
    grid_top,
    grid_bottom,
    grid_div_width,
    grid_div_height,
    grid_style,
    grid_left_diagonal,
    grid_right_diagonal,
  ] = s;
}

function load_grid(base64) {
  let pack = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  let unpack = pako.inflate(pack);
  let data = msgpack.decode(unpack);

  if (data.version !== 1) {
    alert("Bad version");
  }

  unserialize_grid(data.grid);
}

function unserialize(data) {
  stuff = [];
  each_cell((m) => {
    m.lock_type = 0;
    m.normal.text.text("");
    m.center.text.text("");
  });

  if (data.edges) {
    for (const k in data.edges) {
      let pos = k.split(",").map((x) => +x);
      let style = data.edges[k][0];
      let color = data.edges[k][1];
      edge_toggle(...pos, style, color, true);
    }
  }

  data.cells.forEach((c) => {
    let [pos, type, text, color] = c;
    if (type === lock_normal) {
      lock_cell(pos, "normal", color, text);
    } else if (type === lock_color) {
      lock_cell(pos, "color", color, text);
    } else if (type === lock_boundary) {
      lock_cell(pos, "boundary", color, text);
    }
  });
  data.stuff.forEach((_s) => {
    let s = { type: _s[0], style: _s[1], color: _s[2], cells: _s[3] };
    if (s.type === type_path) {
      s.objs = draw_path(ctx, s.cells, s.style, s.color);
    } else if (s.type === type_cage) {
      s.objs = draw_cage(ctx, s.cells, s.style, s.color);
    }
    stuff.push(s);
  });
}

function load(base64) {
  let pack = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  let unpack = pako.inflate(pack);
  let data = msgpack.decode(unpack);

  unserialize(data);
}

export function DrawGetDescription(base64) {
  let pack = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  let unpack = pako.inflate(pack);
  let data = msgpack.decode(unpack);

  return data.desc;
}

function serialize(description) {
  let out = {
    version: 1,
    grid: [
      cell_size,
      grid_w,
      grid_h,
      grid_left,
      grid_right,
      grid_top,
      grid_bottom,
      grid_div_width,
      grid_div_height,
      grid_style,
      grid_left_diagonal,
      grid_right_diagonal,
    ],
    cells: [],
    stuff: stuff.map((e) => [e.type, e.style, e.color, e.cells]),
    edges: edges,
    desc: description,
  };

  each_cell((m) => {
    let pos = [m.x, m.y];
    if (m.lock_type === lock_normal) {
      if (m.normal.text.text() !== "")
        out.cells.push([pos, m.lock_type, m.normal.text.text(), m.color]);
      if (m.symcont.symboltext !== "" && m.symcont.symboltext !== undefined)
        out.cells.push([
          pos,
          m.lock_type,
          m.symcont.symboltext,
          m.symcont.symbolcolor,
        ]);
    }
    if (m.fill >= 0) {
      out.cells.push([pos, lock_color, null, m.fill]);
    }
    m.boundary.forEach((b, i) => {
      if (b.symboltext)
        out.cells.push([
          [m.x, m.y, i],
          lock_boundary,
          b.symboltext,
          b.symbolcolor,
        ]);
    });
  });

  console.log(out);
  return out;
}

export function DrawGenerateUrl(description) {
  let out = serialize(description);
  let coded = msgpack.encode(out);
  let packed = pako.deflate(coded);
  let base64 = btoa(String.fromCharCode(...packed));
  return window.location.origin + "/?s=1&p=" + encodeURIComponent(base64);
}

export function DrawCheck() {
  let r = range(1, 10);
  let rows = Array.from({ length: 9 }, () => []);
  let columns = Array.from({ length: 9 }, () => []);
  let boxes = Array.from({ length: 9 }, () => []);
  let missing = null;
  each_cell((m) => {
    let x = m.x - grid_left;
    let y = m.y - grid_top;
    let n = +m.normal.text.text();
    if (n === 0 && missing === null) {
      missing = `Missing entry at ${x + 1}, ${y + 1}`;
    }
    columns[x].push(n);
    rows[y].push(n);
    let b = Math.floor(x / 3) + Math.floor(y / 3) * 3;
    boxes[b].push(n);
  });
  if (missing) {
    return [false, missing];
  }
  for (let i = 0; i < 9; ++i) {
    if (!isEqual(rows[i].sort(), r)) {
      return [false, `Bad row ${i + 1}`];
    }
    if (!isEqual(columns[i].sort(), r)) {
      return [false, `Bad column ${i + 1}`];
    }
    if (!isEqual(boxes[i].sort(), r)) {
      return [false, `Bad box ${i + 1}`];
    }
  }
  return [true, "OK"];
}

export function DrawDelete() {
  if (!solve_mode && cursor) {
    let i = findLastIndex(stuff, (s) =>
      s.cells.find((c) => c[0] === cursor[0] && c[1] === cursor[1])
    );
    if (i === -1) {
      each_mark((m) => {
        if (i !== -1) return;
        i = findLastIndex(stuff, (s) =>
          s.cells.find((c) => c[0] === m.x && c[1] === m.y)
        );
      });
    }
    if (i !== -1) {
      stuff[i].objs.forEach((o) => o.destroy());
      stuff.splice(i, 1);
      scene.draw();
      return;
    }
  }

  save_undo();

  if (boundary) {
    set_cell(boundary, "boundary", null, "");
  } else {
    each_mark((m) => {
      set_cell([m.x, m.y], "reset", null, "");
    });
  }

  for (const key in edges) {
    let pos = key.split(",").map((x) => +x);
    each_mark((m) => {
      if (pos[0] === m.x && pos[1] === m.y) edge_toggle(...pos);
    });
  }

  scene.draw();
}

export function DrawReset() {
  each_cell((m) => {
    set_cell([m.x, m.y], "reset", null, "");
  });

  if (!solve_mode) {
    stuff.forEach((s) => s.objs.forEach((o) => o.destroy()));
    stuff = [];
  }

  undo_stack = [];
  redo_stack = [];

  scene.draw();
}

export function DrawUndo() {
  if (undo_stack.length === 0) return;
  let state = save_state();
  redo_stack.push(state);
  state = undo_stack.pop();
  load_state(state);
  scene.draw();
}

export function DrawRedo() {
  if (redo_stack.length === 0) return;
  let state = save_state();
  undo_stack.push(state);
  state = redo_stack.pop();
  load_state(state);
  scene.draw();
}

function add_grid(layer) {
  let dash = grid_style === "dash" ? [4] : null;
  let dots = grid_style === "dots";

  let thin = {
    stroke: "black",
    strokeWidth: cell_size * thin_grid_line,
    dash: dash,
  };
  let fat = {
    stroke: "black",
    strokeWidth: cell_size * medium_grid_line,
  };

  grid_lines.forEach((g) => g.destroy());

  let frame_w = grid_w - grid_left - grid_right;
  let frame_h = grid_h - grid_top - grid_bottom;

  grid_lines = [];
  if (grid_left_diagonal || grid_right_diagonal) {
    let diagonal = {
      stroke: DrawColors[1],
      strokeWidth: cell_size * medium_grid_line,
    };
    if (grid_left_diagonal)
      grid_lines.push(
        new Line({
          points: [
            grid_left * cell_size,
            grid_top * cell_size,
            (grid_left + frame_w) * cell_size,
            (grid_top + frame_h) * cell_size,
          ],
          ...diagonal,
        })
      );
    if (grid_right_diagonal)
      grid_lines.push(
        new Line({
          points: [
            (grid_w - grid_right) * cell_size,
            grid_top * cell_size,
            grid_left * cell_size,
            (grid_top + frame_h) * cell_size,
          ],
          ...diagonal,
        })
      );
  }

  if (dots) {
    let dsize = cell_size * 0.07;
    for (let y = 0; y <= frame_h; ++y) {
      for (let x = 0; x <= frame_w; ++x) {
        grid_lines.push(
          new Circle({
            x: (grid_left + x) * cell_size,
            y: (grid_top + y) * cell_size,
            radius: dsize,
            fill: "black",
          })
        );
      }
    }
  } else {
    for (let x = 0; x <= frame_w; ++x) {
      grid_lines.push(
        new Line({
          x: (grid_left + x) * cell_size,
          y: grid_top * cell_size,
          points: [0, 0, 0, frame_h * cell_size],
          ...(x % grid_div_width === 0 ? fat : thin),
        })
      );
    }
    for (let y = 0; y <= frame_h; ++y) {
      grid_lines.push(
        new Line({
          x: grid_left * cell_size,
          y: (grid_top + y) * cell_size,
          points: [0, 0, frame_w * cell_size, 0],
          ...(y % grid_div_height === 0 ? fat : thin),
        })
      );
    }

    grid_lines.push(
      new Rect({
        x: grid_left * cell_size,
        y: grid_top * cell_size,
        width: frame_w * cell_size,
        height: frame_h * cell_size,
        stroke: "black",
        strokeWidth: cell_size * medium_grid_line,
        fillEnabled: false,
      })
    );
  }

  layer.add(...grid_lines);
}

function addBoundaries(x, y, boundary) {
  const bc = cell_size * 0.03;
  const cs = cell_size;
  const bsize = cell_size * 0.3;

  const addBoundary = (x, y, size, type, type2) => {
    let b = new Group({ x: x, y: y });
    let w = size;
    let h = size;
    let s = size;
    if (Array.isArray(size)) {
      w = size[0];
      h = size[1];
      s = Math.min(size[0], size[1]);
    }
    b.rect = null;
    b.bsize = s;
    b.bwidth = w;
    b.bheight = h;
    b.btype = type;
    b.btype2 = type2;
    boundary.push(b);
  };

  // Corners
  addBoundary(bc, bc, bsize, b_corner);
  addBoundary(cs - bsize - bc, bc, bsize, b_corner);
  addBoundary(bc, cs - bsize - bc, bsize, b_corner);
  addBoundary(cs - bsize - bc, cs - bsize - bc, bsize, b_corner);

  // Sides
  addBoundary(bc, cs / 2 - bsize / 2, bsize, b_side);
  addBoundary(cs / 2 - bsize / 2, bc, bsize, b_side);
  addBoundary(cs - bsize - bc, cs / 2 - bsize / 2, bsize, b_side);
  addBoundary(cs / 2 - bsize / 2, cs - bsize - bc, bsize, b_side);

  // Quarter
  const qsize = cell_size * 0.4;
  const qc = cell_size * 0.05;
  addBoundary(qc, qc, qsize, b_quarter);
  addBoundary(cs - qsize - qc, qc, qsize, b_quarter);
  addBoundary(qc, cs - qsize - qc, qsize, b_quarter);
  addBoundary(cs - qsize - qc, cs - qsize - qc, qsize, b_quarter);

  // Edges
  const ew = cell_size * 0.3;
  const eh = cell_size * 0.7;
  const eo = ew / 2;
  addBoundary(-eo, eo, [ew, eh], b_edge, b_left);
  addBoundary(eo, -eo, [eh, ew], b_edge, b_top);
  if (x === grid_w - grid_right - 1)
    addBoundary(cs - eo, eo, [ew, eh], b_edge, b_right);
  if (y === grid_h - grid_bottom - 1)
    addBoundary(eo, cs - eo, [eh, ew], b_edge, b_bottom);

  // Boundaries
  addBoundary(-bsize / 2, -bsize / 2, bsize, b_boundary);
  addBoundary(-bsize / 2, cs / 2 - bsize / 2, bsize, b_boundary);
  addBoundary(cs / 2 - bsize / 2, -bsize / 2, bsize, b_boundary);
  if (x === grid_w - grid_right - 1) {
    addBoundary(cs - bsize / 2, -bsize / 2, bsize, b_boundary);
    addBoundary(cs - bsize / 2, cs / 2 - bsize / 2, bsize, b_boundary);
  }
  if (y === grid_h - grid_bottom - 1) {
    addBoundary(-bsize / 2, cs - bsize / 2, bsize, b_boundary);
    addBoundary(cs / 2 - bsize / 2, cs - bsize / 2, bsize, b_boundary);
    addBoundary(cs - bsize / 2, cs - bsize / 2, bsize, b_boundary);
  }
}

function render(wrapper) {
  corner_offset = cell_size * 0.08;
  hover_offset = cell_size * 0.2;

  const margin = cell_size * 0.2;
  const stage_w = grid_w * cell_size + margin * 2;
  const stage_h = grid_h * cell_size + margin * 2;
  let stage = new Stage({
    container: wrapper,
    width: stage_w,
    height: stage_h,
  });
  scene = new Layer();
  stage.add(scene);

  reset();

  outer = new Group({ x: margin, y: margin });
  scene.add(outer);

  underlay = new Group();
  let underlay2 = new Group();
  let gridlayer = new Group();
  let overlay = new Group();
  outer.add(underlay2, underlay, gridlayer, overlay);

  for (let y = 0; y < grid_h; ++y) {
    matrix[y] = [];
  }
  let cs = cell_size;

  for (let x = 0; x < grid_w; ++x) {
    for (let y = 0; y < grid_h; ++y) {
      let xp = x * cs;
      let yp = y * cs;
      let main_grid =
        x >= grid_left &&
        y >= grid_top &&
        x < grid_w - grid_right &&
        y < grid_h - grid_bottom;
      let ocont = new Group({ x: xp, y: yp });
      let cont = new Group({ x: xp, y: yp });
      let symcont = new Group();
      let r = new Rect({
        width: cs,
        height: cs,
        strokeWidth: 0,
        fillEnabled: true,
      });
      let r_color = new Rect({
        width: cs,
        height: cs,
        strokeWidth: 0,
        fillEnabled: false,
      });
      let r_color_set = new Rect({
        width: cs,
        height: cs,
        strokeWidth: 0,
        fillEnabled: false,
      });
      let r_inner = new Rect({
        x: hover_offset,
        y: hover_offset,
        width: cs - hover_offset * 2,
        height: cs - hover_offset * 2,
        fillEnabled: true,
      });
      let normal = new Group({ x: cell_size * 0.25, y: cell_size * 0.15 });
      normal.text = new TextHolder(normal, sol_text_color, cell_size * 0.7, 1);
      let center = new Group();
      center.text = new TextHolder(center, sol_text_color, cell_size * 0.3, 2);
      let corner_pos = [];
      corner_pos[0] = [corner_offset, corner_offset];
      corner_pos[1] = [cs - corner_offset, corner_offset];
      corner_pos[2] = [cs - corner_offset, cs - corner_offset];
      corner_pos[3] = [corner_offset, cs - corner_offset];
      corner_pos[4] = [cs / 2, corner_offset];
      corner_pos[5] = [cs - corner_offset, cs / 2];
      corner_pos[6] = [cs / 2, cs - corner_offset];
      corner_pos[7] = [corner_offset, cs / 2];

      let corner = [];
      let boundary = [];
      if (main_grid) {
        corner_pos.forEach((p, i) => {
          p = p.slice(0);
          p[0] -= cs * 0.025;
          p[1] -= cs * 0.025;
          if (i < 4) {
            if (i === 2 || i === 3) p[1] -= cs * 0.15;
            if (i === 1 || i === 2) p[0] -= cs * 0.1;
          } else {
            if (i === 6) p[1] -= cs * 0.15;
            if (i === 5 || i === 7) p[1] -= cs * 0.05;
            if (i === 4 || i === 6) p[0] -= cs * 0.025;
            if (i === 5) p[0] -= cs * 0.1;
          }
          let g = new Group({ x: p[0], y: p[1] });
          g.text = new TextHolder(g, sol_text_color, cs * 0.2, 3);
          corner.push(g);
        });
      }
      addBoundaries(x, y, boundary);

      cont.add(r_color_set, r_color, r, r_inner, symcont, normal, center);
      cont.on("mousedown touchstart tap", (event) => mousedown(event, x, y));
      cont.on("mousemove touchmove", (event) => mousemove(event, x, y));
      r_inner.on("mousemove touchmove", (event) =>
        inner_mousemove(event, x, y)
      );
      matrix[y][x] = {
        x: x,
        y: y,
        pos: [xp, yp],
        symcont: symcont,
        cont: cont,
        ocont: ocont,
        rect: r,
        boundary: boundary,
        fill: -1,
        color: null,
        normal: normal,
        center: center,
        corner: corner,
        corner_pos: corner_pos,
        r_color_set: r_color_set,
        r_color: r_color,
        main_grid: main_grid,
      };
      underlay.add(cont);
      if (main_grid) ocont.add(...corner);
      ocont.add(...boundary);
      overlay.add(ocont);
    }
  }

  add_grid(gridlayer);

  ctx.scene = scene;
  ctx.underlay = underlay;
  ctx.underlay2 = underlay2;
  ctx.overlay = overlay;
  ctx.cell_size = cell_size;
  ctx.corner_offset = corner_offset;
  ctx.each_cell = each_cell;
  ctx.thin_grid_line = thin_grid_line;
  ctx.medium_grid_line = medium_grid_line;
  ctx.fat_grid_line = fat_grid_line;
  ctx.get = get;
}

export function DrawUpdateGrid(wrapper, state) {
  let s = serialize();
  if ("cellSize" in state) cell_size = state.cellSize;
  if ("gridDivWidth" in state) grid_div_width = state.gridDivWidth;
  if ("gridDivHeight" in state) grid_div_height = state.gridDivHeight;
  if ("gridStyle" in state) grid_style = state.gridStyle;
  if ("gridLeftDiagonal" in state) grid_left_diagonal = state.gridLeftDiagonal;
  if ("gridRightDiagonal" in state)
    grid_right_diagonal = state.gridRightDiagonal;
  render(wrapper);
  unserialize(s);
  scene.draw();
}

export function DrawRender(code, wrapper, state) {
  solve_mode = state.solveMode;
  cell_size = state.cellSize;
  grid_left = state.left;
  grid_right = state.right;
  grid_top = state.top;
  grid_bottom = state.bottom;
  grid_w = grid_left + state.width + grid_right;
  grid_h = grid_top + state.height + grid_bottom;
  grid_div_width = state.gridDivWidth;
  grid_div_height = state.gridDivHeight;
  grid_style = state.gridStyle;
  grid_left_diagonal = state.gridLeftDiagonal;
  grid_right_diagonal = state.gridRightDiagonal;

  if (code) load_grid(code);

  render(wrapper);

  if (code) load(code);

  scene.draw();

  DrawSetMode(state);
}

window.addEventListener("keydown", (event) => keydown(event));
window.addEventListener("keyup", (event) => keyup(event));
window.addEventListener("mousedown", (event) => window_mousedown(event));
window.addEventListener("mouseup", (event) => mouseup(event));
window.addEventListener("touchend", (event) => mouseup(event));
window.addEventListener("contextmenu", (event) => contextmenu(event));
