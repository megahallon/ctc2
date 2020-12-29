import { Rect, Group, Line, Text } from "konva";
import { DrawColors, setSymbol, boundaryMousedown, mousemove, mousedown, innerMousemove, edges } from "./draw";
import { DrawSymbol } from "./symbols";

const markColor = "rgba(247, 208, 56, 0.5)";

export const b_corner = 1;
export const b_side = 2;
export const b_quarter = 3;
export const b_boundary = 4;
export const b_edge = 5;
export const b_bigboundary = 6;
export const b_left = 1;
export const b_top = 2;
export const b_bottom = 3;
export const b_right = 4;

export const lock_normal = 1;
export const lock_color = 2;
export const lock_boundary = 3;

class RectHolder {
  constructor(container, width, height) {
    this.container = container;
    this.width = width;
    this.height = height;
    this.color = null;
    this.obj = null;
  }

  fill(color) {
    if (color === undefined) return this.color;

    this.color = color;
    if (color === null) {
      if (this.obj) {
        this.obj.destroy();
        this.obj = null;
      }
    } else {
      if (this.obj === null) {
        this.obj = new Rect({ width: this.width, height: this.height });
        this.container.add(this.obj);
      }
      this.obj.fill(this.color);
    }
  }
}

class TextHolder {
  constructor(container, color, fontSize, size) {
    this.container = container;
    this._color = color;
    this.fontSize = fontSize;
    this.size = size;
    this._text = "";
    this.obj = null;
    this.bg = false;
    this.bgRect = null;
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
          listening: false
        });
        if (this.bg) {
          this.bgRect = new Rect({
            width: this.size,
            height: this.size,
            fill: "white",
            listening: false,
          });
          this.container.add(this.bgRect);
        }
        this.container.add(this.obj);
      } else this.obj.text(this._text);
      let meas = this.obj.measureSize(this._text);
      this.obj.position({
        x: (this.size - meas.width) / 2,
        y: (this.size - meas.height) / 2,
      });
    } else if (this.obj) {
      if (this.bgRect) {
        this.bgRect.destroy();
        this.bgRect = null;
      }
      this.obj.destroy();
      this.obj = null;
    }
  }

  background(state) {
    this.bg = state;
    if (this.obj) {
      if (this.bg && !this.bgRect) {
        this.obj.destroy();
        this.obj = null;
        this.text(this._text);
      }
      else if (!this.bg && this.bgRect) {
        this.bgRect.destroy();
        this.bgRect = null;
      }
    }
  }

  color(c) {
    if (c === undefined) return this._color;

    this._color = c;
    if (this.obj) this.obj.fill(this._color);
  }
}

export class Cell {
  addBoundaries() {
    const x = this.x;
    const y = this.y;
    const ctx = this.ctx;
    const cell_size = ctx.cell_size;
    const bc = cell_size * 0.04;
    const cs = cell_size;
    const bsize = cell_size * 0.4;

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
      b.bindex = this.boundary.length;
      b.bsize = s;
      b.bwidth = w;
      b.bheight = h;
      b.btype = type;
      b.btype2 = type2;

      b.textcont = new Group({x: x, y: y});
      b.text = new TextHolder(b.textcont, "black", s * 0.7, s);
      this.boundary.push(b);
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
    if (x === ctx.grid_w - ctx.grid_right - 1)
      addBoundary(cs - eo, eo, [ew, eh], b_edge, b_right);
    if (y === ctx.grid_h - ctx.grid_bottom - 1)
      addBoundary(eo, cs - eo, [eh, ew], b_edge, b_bottom);

    // Boundaries
    addBoundary(-bsize / 2, -bsize / 2, bsize, b_boundary);
    addBoundary(-bsize / 2, cs / 2 - bsize / 2, bsize, b_boundary);
    addBoundary(cs / 2 - bsize / 2, -bsize / 2, bsize, b_boundary);
    if (x === ctx.grid_w - ctx.grid_right - 1) {
      addBoundary(cs - bsize / 2, -bsize / 2, bsize, b_boundary);
      addBoundary(cs - bsize / 2, cs / 2 - bsize / 2, bsize, b_boundary);
    }
    if (y === ctx.grid_h - ctx.grid_bottom - 1) {
      addBoundary(-bsize / 2, cs - bsize / 2, bsize, b_boundary);
      addBoundary(cs / 2 - bsize / 2, cs - bsize / 2, bsize, b_boundary);
      addBoundary(cs - bsize / 2, cs - bsize / 2, bsize, b_boundary);
    }

    const bsize2 = cs * 0.8;
    addBoundary(-bsize2 / 2, -bsize2 / 2, bsize2, b_bigboundary);
    addBoundary(-bsize2 / 2, cs / 2 - bsize2 / 2, bsize2, b_bigboundary);
    addBoundary(cs / 2 - bsize2 / 2, -bsize2 / 2, bsize2, b_bigboundary);
    if (x === ctx.grid_w - ctx.grid_right - 1) {
      addBoundary(cs - bsize2 / 2, -bsize2 / 2, bsize2, b_bigboundary);
      addBoundary(cs - bsize2 / 2, cs / 2 - bsize2 / 2, bsize2, b_bigboundary);
    }
    if (y === ctx.grid_h - ctx.grid_bottom - 1) {
      addBoundary(-bsize / 2, cs - bsize / 2, bsize, b_bigboundary);
      addBoundary(cs / 2 - bsize / 2, cs - bsize / 2, bsize, b_bigboundary);
      addBoundary(cs - bsize / 2, cs - bsize / 2, bsize, b_bigboundary);
    }
  }

  constructor(ctx, x, y) {
    const cs = ctx.cell_size;
    const xp = x * cs;
    const yp = y * cs;
    const main_grid =
        x >= ctx.grid_left &&
        y >= ctx.grid_top &&
        x < ctx.grid_w - ctx.grid_right &&
        y < ctx.grid_h - ctx.grid_bottom;
    let ocont = new Group({ x: xp, y: yp });
    let cont = new Group({ x: xp, y: yp });
    let symcont = new Group();
    let r = new Rect({
      width: cs,
      height: cs,
      strokeWidth: 0,
      fillEnabled: true,
    });
    let r_color = new Group();
    r_color.rect = new RectHolder(r_color, cs, cs);
    let r_color_set = new Group();
    r_color_set.rect = new RectHolder(r_color_set, cs, cs);
    let r_inner = new Rect({
      x: ctx.hover_offset,
      y: ctx.hover_offset,
      width: cs - ctx.hover_offset * 2,
      height: cs - ctx.hover_offset * 2,
      fillEnabled: true,
    });
    let normal = new Group();
    normal.text = new TextHolder(normal, ctx.sol_text_color, cs * 0.7, cs);

    let center = new Group();
    center.text = new TextHolder(center, ctx.sol_text_color, cs * 0.3, cs);
    let corner_pos = [];
    let corner_size = cs * 0.25;
    let co = cs * 0.03;
    corner_pos[0] = [co, co];
    corner_pos[1] = [cs - corner_size - co, co];
    corner_pos[2] = [cs - corner_size - co, cs - corner_size - co];
    corner_pos[3] = [co, cs - corner_size - co];
    corner_pos[4] = [(cs - corner_size) / 2, co];
    corner_pos[5] = [cs - corner_size - co, (cs - corner_size) / 2];
    corner_pos[6] = [(cs - corner_size) / 2, cs - corner_size - co];
    corner_pos[7] = [co, (cs - corner_size) / 2];

    let corner = [];
    let boundary = [];
    if (main_grid) {
      corner_pos.forEach((p, i) => {
        let g = new Group({ x: p[0], y: p[1] });
        g.text = new TextHolder(g, ctx.sol_text_color, corner_size, corner_size);
        corner.push(g);
      });
    }

    this.x = x;
    this.y = y;
    this.pos = [xp, yp];
    this.symcont = symcont;
    this.cont = cont;
    this.oocont = ocont;
    this.rect = r;
    this.boundary = boundary;
    this.fill = -1;
    this.color = null;
    this.normal = normal;
    this.center = center;
    this.corner = corner;
    this.corner_pos = corner_pos;
    this.r_color_set = r_color_set;
    this.r_color = r_color;
    this.main_grid = main_grid;
    this.ctx = ctx;

    this.addBoundaries();

    cont.add(r_color_set, r_color, r, r_inner, symcont, normal, center);
    cont.on("mousedown touchstart tap", (event) => mousedown(event, x, y));
    cont.on("mousemove touchmove", (event) => mousemove(event, x, y));
    r_inner.on("mousemove touchmove", (event) => innerMousemove(event, x, y));

    ctx.underlay.add(cont);
    if (main_grid) ocont.add(...corner);
    ocont.add(...boundary);
    ocont.add(...boundary.map(b => b.textcont));
    ctx.overlay.add(ocont);
  }

  drawEdgeCross(i, set) {
    let b = this.boundary[i];
    if (set) {
      if (!b.cross) {
        b.cross = new Group();
        b.add(b.cross);
        DrawSymbol(this.ctx, b.cross, "#44", this.ctx.sol_text_color, [b.bwidth, b.bheight]);
      }
    } else if (b.cross) {
      b.cross.destroy();
      b.cross = null;
    }
  }

  drawEdge(i, set, style, color, lock = false) {
    let b = this.boundary[i];
    let width = this.ctx.getLineWidth(style);
    let eo = this.ctx.cell_size * 0.15;
    if (color === undefined)
      color = this.ctx.sol_text_color;

    if (!set) {
      if (b.edge) {
        b.edge.destroy();
        b.edge = null;
        delete edges[[this.x, this.y, i]];
      }
    }
    else if (!b.edge) {
      let edge;
      let new_edge = (x, y, x1, y1) => {
        edge = new Line({
          x: x,
          y: y,
          points: [0, 0, x1, y1],
          strokeWidth: width,
          stroke: color,
          lineCap: "round",
          listening: false,
        });
      };
      switch (b.btype2) {
      case b_left:
      case b_right:
        new_edge(eo, -eo, 0, this.ctx.cell_size);
        break;
      case b_top:
      case b_bottom:
        new_edge(-eo, eo, this.ctx.cell_size, 0);
        break;
      default:
        break;
      }
      edges[[this.x, this.y, i]] = [style, color];
      b.edge = edge;
      b.lock = lock;
      b.add(edge);
    }
  }


  drawCenterLine(i, set, style, color) {
    const width = this.ctx.getLineWidth(style);
    let b = this.boundary[i];

    if (color === undefined)
      color = this.ctx.sol_text_color;

    if (!set) {
      if (b.centerline) {
        b.centerline.destroy();
        b.centerline = null;
      }
    } else if (!b.centerline) {
      let points;
      let cp = this.ctx.cell_size / 2;
      let bw = b.bwidth / 2;
      let bh = b.bheight / 2;
      if (b.btype2 === b_top || b.btype2 === b_bottom) {
        if (b.btype2 === b_top && this.y <= this.ctx.grid_top) return;
        if (b.btype2 === b_bottom && this.y >= this.ctx.grid_top + this.ctx.grid_h - 1) return;
        points = [0, -cp, 0, cp];
      } else {
        if (b.btype2 === b_left && this.x <= this.ctx.grid_left) return;
        if (b.btype2 === b_right && this.x >= this.ctx.grid_left + this.ctx.grid_w - 1) return;
        points = [-cp, 0, cp, 0];
      }

      let cline = new Line({
        x: bw,
        y: bh,
        points: points,
        strokeWidth: width,
        stroke: color,
        lineCap: "round",
        listening: false,
      });
      b.centerline = cline;
      b.add(cline);
    }
  }

  setMark(cursorVisible) {
    if (!this.mark) {
      this.mark = true;
      this.rect.fill(markColor);
      this.rect.fillEnabled(cursorVisible);
      return true;
    }
    return false;
  }

  saveState() {
    let s = { x: this.x, y: this.y };
    if (this.normal.text.text() !== "") s.normal = this.normal.text.text();
    else {
      if (this.center.text.text() !== "") s.center = this.center.text.text();
      s.corner = this.corner.map((c) => c.text.text());
    }
    if (this.r_color.rect.fill()) {
      s.color = this.r_color.rect.fill();
    }
    if (this.cross) s.cross = true;
    s.edge = [];
    s.centerline = [];
    s.edgecross = [];
    this.boundary.forEach((b, i) => {
      if (b.edge && !b.lock) s.edge.push(i);
      if (b.cross) s.edgecross.push(i);
      if (b.centerline) s.centerline.push(i);
    });
    return s;
  }

  serialize() {
    let out = [];
    let pos = [this.x, this.y];
    if (this.lock_type === lock_normal) {
      if (this.normal.text.text() !== "")
        out.push([pos, this.lock_type, this.normal.text.text(), this.color]);
      if (this.symcont.symboltext !== "" && this.symcont.symboltext !== undefined)
        out.push([
          pos,
          this.lock_type,
          this.symcont.symboltext,
          this.symcont.symbolcolor,
          this.symcont.symbolbg
        ]);
    }
    if (this.fill >= 0) {
      out.push([pos, lock_color, null, this.fill]);
    }
    this.boundary.forEach((b, i) => {
      if (b.symboltext)
        out.push([
          [this.x, this.y, i],
          lock_boundary,
          b.symboltext,
          b.symbolcolor,
          b.symbolbg,
        ]);
        if (b.text.text())
          out.push([
            [this.x, this.y, i],
            lock_boundary,
            b.text.text(),
            b.text.color(),
          ]);
    });
    return out;
  }

  clearBoundary() {
    this.boundary.forEach((b) => {
      if (b.rect) {
        b.rect.destroy();
        b.rect = null;
      }
    });
  }

  markBoundary(i) {
    let b = this.boundary[i];
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
  }

  setBoundary(type) {
    this.boundary.forEach((b, i) => {
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
        b.rect.on("mousedown touchstart tap",
                  (event) => boundaryMousedown(event, this.x, this.y, i)
                 );
      }
    });
  }

  setCell(lock, pos, mode, color, newtext, bg) {
    let b = null;
    if (pos.length === 3) b = this.boundary[pos[2]];

    if (!this.main_grid && mode !== "normal" && !lock && mode !== "reset") {
      return;
    }
    if (this.lock_type === lock_normal && !lock && mode !== "color" && mode !== "reset") {
      return;
    }

    if (mode === "reset") {
      this.center.text.text("");
      if (this.lock_type !== lock_normal || lock)
        this.normal.text.text("");
      this.corner.forEach((c) => c.text.text(""));
      this.r_color.rect.fill(null);
      if (this.cross) {
        this.cross.destroy();
        this.cross = null;
      }
      this.boundary.forEach((b) => {
        if (b.edge && !b.lock) {
          b.edge.destroy();
          b.edge = null;
          delete edges[[this.x, this.y, b.bindex]];
        }
        if (b.centerline) {
          b.centerline.destroy();
          b.centerline = null;
        }
        if (b.cross) {
          b.cross.destroy();
          b.cross = null;
        }
      });
      if (lock) {
        this.r_color_set.rect.fill(null);
        this.fill = -1;
        if (this.symcont.symbol) {
          this.symcont.symbol.destroy();
          this.symcont.symbol = null;
          this.symcont.symboltext = "";
        }
        this.boundary.forEach((b) => {
          if (b.symbol) {
            b.symbol.destroy();
            b.symbol = null;
            b.symboltext = "";
            console.log("reset boundary");
          }
          if (b.rect) {
            b.rect.destroy();
            b.rect = null;
          }
          if (b.edge) {
            b.edge.destroy();
            b.edge = null;
            delete edges[[this.x, this.y, b.bindex]];
          }
          b.text.text("");
        });
      }
    } else if (b) {
      setSymbol(b, newtext, color, 0, bg);
    } else if (mode === "normal") {
      if (!lock) {
        color = this.ctx.sol_text_color;
      } else {
        this.lock_type = newtext !== "" ? lock_normal : 0;
        if (newtext[0] !== "#") {
          this.color = color;
        }
      }
      setSymbol(this, newtext, color);
      if (newtext[0] !== "#") {
        this.center.text.text("");
        this.corner.forEach((c) => c.text.text(""));
      }
    } else if (mode === "center" && this.normal.text.text() === "") {
      let current = this.center.text.text();
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

      this.center.text.text(center);
    } else if (mode === "corner" && this.normal.text.text() === "") {
      let current = "";
      this.corner.forEach((t) => (current += t.text.text()));
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
      this.corner.forEach((c) => c.text.text(text[i++] || ""));
    } else if (mode === "color") {
      // white == clear
      if (!lock) {
        if (color === 2) {
          this.r_color.rect.fill(null);
        } else {
          this.r_color.rect.fill(DrawColors[color]);
        }
      } else {
        if (color === 2) {
          this.r_color_set.rect.fill(null);
          this.fill = null;
        } else {
          this.r_color_set.rect.fill(DrawColors[color]);
          this.fill = color;
        }
      }
    }
  }
}
