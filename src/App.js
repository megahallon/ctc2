import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import {
  DrawRender,
  DrawSymbol,
  DrawSetMode,
  DrawUndo,
  DrawRedo,
  DrawDelete,
  DrawGenerateUrl,
  DrawSetNumber,
  DrawSetColor,
  DrawColors,
  DrawGetDescription,
  DrawReset,
  DrawCheck,
  DrawSetSymbolPage,
  DrawUpdateGrid,
} from "./draw";
import {
  Box,
  Button,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Slider,
  Typography,
  Select,
  MenuItem,
  FormControl,
  FormGroup,
  FormLabel,
  FormControlLabel,
  InputLabel,
  Grid,
  TextField,
  Switch,
} from "@material-ui/core";
import { ConfirmProvider, useConfirm } from "material-ui-confirm";
import { PlayArrow, Pause, SkipPrevious } from "@material-ui/icons";

const query = window.location.search;
const urlParams = new URLSearchParams(query);
const code = urlParams.get("p");
const solveMode = urlParams.get("s") === "1";

function ColorGrid(props) {
  return DrawColors.slice(0, props.num).map((color, index) => (
    <Grid key={index} item xs={4}>
      <Button variant="outlined" onClick={() => DrawSetColor(index)}>
        <div
          style={{
            border: "1px solid black",
            background: color,
            width: "30px",
            height: "30px",
          }}
        />
      </Button>
    </Grid>
  ));
}

function Timer(props) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      if (props.active) {
        setSeconds((s) => s + 1);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [props.active]);

  const restart = () => {
    props.onStop();
    setSeconds(0);
  };

  return (
    <Box margin="20px" padding="10px" boxShadow={3}>
      <Typography align="center" variant="h4">
        {new Date(seconds * 1000).toISOString().substr(11, 8)}
      </Typography>
      <ButtonGroup fullWidth={true} size="large">
        <Button onClick={props.onStart}>
          <PlayArrow />
        </Button>
        <Button onClick={props.onStop}>
          <Pause />
        </Button>
        <Button onClick={restart}>
          <SkipPrevious />
        </Button>
      </ButtonGroup>
    </Box>
  );
}

function ResetButton() {
  const confirm = useConfirm();

  const onClick = () => {
    confirm({ description: "Remove all changes in grid?" })
      .then(() => {
        DrawReset();
        this.setState({ timeStatus: true });
      })
      .catch(() => null);
  };

  return (
    <Button fullWidth={true} variant="contained" size="large" onClick={onClick}>
      Reset
    </Button>
  );
}

function SymbolSelect() {
  let [page, setPage] = useState("0");
  let symbolRef = [];
  symbolRef[0] = useRef(null);
  symbolRef[1] = useRef(null);
  symbolRef[2] = useRef(null);
  symbolRef[3] = useRef(null);
  symbolRef[4] = useRef(null);
  symbolRef[5] = useRef(null);
  symbolRef[6] = useRef(null);
  symbolRef[7] = useRef(null);
  symbolRef[8] = useRef(null);
  symbolRef[9] = useRef(null);

  const pages = ["Numbers", "Circles", "Arrows", "Arrows 2", "Misc"];
  const setSymbolPage = (e) => setPage(e.target.value);

  useEffect(() => {
    if (+page > 0) {
      for (let i = 0; i < 9; ++i) {
        DrawSymbol(symbolRef[i].current, page, i + 1, 30);
      }
    }
    DrawSetSymbolPage(+page);
  });

  return (
    <Box>
      <FormControl fullWidth={true}>
        <Select fullWidth={true} value={page} onChange={setSymbolPage}>
          {pages.map((p, i) => (
            <MenuItem key={p} value={i}>
              {p}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Grid container>
        {[...Array(9).keys()].map((index) => (
          <Grid key={index} item xs={4}>
            <Button variant="outlined" onClick={() => DrawSetNumber(index + 1)}>
              {+page === 0 && (
                <div style={{ fontSize: "20px" }}>{index + 1}</div>
              )}
              {+page > 0 && <div ref={symbolRef[index]} />}
            </Button>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

function ColorSelect() {
  let [color, setColor] = useState(0);

  return DrawColors.map((c, index) => (
    <Grid key={index} item xs={4}>
      <Button
        variant={color === index ? "contained" : "outlined"}
        onClick={() => {
          setColor(index);
          DrawSetColor(index);
        }}
      >
        <div
          style={{
            border: "1px solid black",
            background: c,
            width: "30px",
            height: "30px",
          }}
        />
      </Button>
    </Grid>
  ));
}

function UrlDialog(props) {
  let openInTab = () => {
    props.onClose();
    let w = window.open(props.text, "_blank");
    w.focus();
  };

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle>URL</DialogTitle>
      <DialogContent>
        <DialogContentText>{props.text}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={openInTab}>Open in tab</Button>
        <Button color="primary" onClick={props.onClose}>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.symbolRef = [];
    for (let i = 0; i < 9; ++i) this.symbolRef.push(React.createRef());

    this.state = {
      solveMode: solveMode,
      settingsMode: "size",
      color: 0,
      description: "",
      cellSize: 64,
      width: 9,
      height: 9,
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      gridDivWidth: 3,
      gridDivHeight: 3,
      gridStyle: "lines",
      gridLeftDiagonal: false,
      gridRightDiagonal: false,
      mode: solveMode ? "normal" : "number",
      numberStyle: "normal",
      multiDigit: false,
      numberBackground: false,
      edgeStyle: "fat",
      cageStyle: "dash",
      pathStyle: "arrow",
      dialogOpen: false,
      dialogText: "",
      timeStatus: true,
      symbolPage: "0",
    };
  }

  handleKeyDown = (event) => {
    if (event.target.tagName === "TEXTAREA") return;

    if (solveMode) {
      const cycle_modes = ["normal", "center", "corner", "color"];
      let i = "qwer".indexOf(event.key);
      if (event.key.length === 1 && i !== -1) this.setMode(cycle_modes[i]);
      else if (event.key === " ") {
        let i = cycle_modes.indexOf(this.state.mode);
        i = (i + 1) % cycle_modes.length;
        this.setMode(cycle_modes[i]);
      }
    }
  };

  componentDidMount() {
    let desc = "";
    if (code) {
      desc = DrawGetDescription(code);
    }
    this.setState({ description: desc }, () => {
      DrawRender(code, this.canvasRef.current, this.state);
    });

    document.addEventListener("keydown", this.handleKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyDown);
    clearInterval(this.interval);
  }

  setMode = (mode) => {
    let b = document.getElementById("button" + mode);
    if (b) b.focus();
    this.setState({ mode: mode }, () => {
      DrawSetMode(this.state);
    });
  };

  setStyle = (style, value) => {
    this.setState({ [style]: value }, () => DrawSetMode(this.state));
  };

  generateUrl = () => {
    let url = DrawGenerateUrl(this.state.description);
    this.setState({ dialogText: url, dialogOpen: true });
  };

  numberStyleBox() {
    return (
      <Box margin="10px">
        <FormControl fullWidth={true}>
          <InputLabel shrink id="numberstyle-label">
            Style
          </InputLabel>
          <Select
            labelId="numberstyle-label"
            fullWidth={true}
            value={this.state.numberStyle}
            onChange={(event) =>
              this.setStyle("numberStyle", event.target.value)
            }
          >
            <MenuItem value="normal">Normal</MenuItem>
            <MenuItem value="corner">Corner</MenuItem>
            <MenuItem value="side">Side</MenuItem>
            <MenuItem value="quarter">Quarter</MenuItem>
            <MenuItem value="boundary">Boundary</MenuItem>
          </Select>
          <FormControlLabel
            control={
              <Switch
                checked={this.state.numberBackground}
                onChange={(e) => {
                  this.setStyle("numberBackground", e.target.checked);
                }}
              />
            }
            label="Background"
          />
          <FormControlLabel
            control={
              <Switch
                checked={this.state.multiDigit}
                onChange={(e) => {
                  this.setStyle("multiDigit", e.target.checked);
                }}
              />
            }
            label="Multi digit"
          />
        </FormControl>
      </Box>
    );
  }

  cageStyleBox() {
    return (
      <Box margin="10px">
        <FormControl fullWidth={true}>
          <InputLabel shrink id="cagestyle-label">
            Style
          </InputLabel>
          <Select
            labelId="cagestyle-label"
            fullWidth={true}
            value={this.state.cageStyle}
            onChange={(event) => this.setStyle("cageStyle", event.target.value)}
          >
            <MenuItem value="dash">Dashed</MenuItem>
            <MenuItem value="edge:thin">Edge thin</MenuItem>
            <MenuItem value="edge:medium">Edge medium </MenuItem>
            <MenuItem value="edge:fat">Edge fat</MenuItem>
          </Select>
        </FormControl>
      </Box>
    );
  }

  edgeStyleBox() {
    return (
      <Box margin="10px">
        <FormControl fullWidth={true}>
          <InputLabel shrink id="edgestyle-label">
            Style
          </InputLabel>
          <Select
            labelId="cagestyle-label"
            fullWidth={true}
            value={this.state.edgeStyle}
            onChange={(event) => this.setStyle("edgeStyle", event.target.value)}
          >
            <MenuItem value="thin">Thin</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="fat">Fat</MenuItem>
          </Select>
        </FormControl>
      </Box>
    );
  }

  pathStyleBox() {
    return (
      <Box margin="10px">
        <FormControl fullWidth={true}>
          <InputLabel shrink id="pathstyle-label">
            Style
          </InputLabel>
          <Select
            labelId="pathstyle-label"
            fullWidth={true}
            value={this.state.pathStyle}
            onChange={(event) => this.setStyle("pathStyle", event.target.value)}
          >
            <MenuItem value="thin">Line</MenuItem>
            <MenuItem value="medium">Medium line</MenuItem>
            <MenuItem value="fat">Fat Line</MenuItem>
            <MenuItem value="thermo">Thermo</MenuItem>
            <MenuItem value="arrow">Arrow</MenuItem>
            <MenuItem value="arrowcircle">Arrow with circle</MenuItem>
            <MenuItem value="roundborder">Round border</MenuItem>
            <MenuItem value="border">Border</MenuItem>
            <MenuItem value="roundfill">Round fill</MenuItem>
            <MenuItem value="squarefill">Square fill</MenuItem>
            <MenuItem value="polygon">Polygon</MenuItem>
            <MenuItem value="polygonfill">Polygon fill</MenuItem>
          </Select>
        </FormControl>
      </Box>
    );
  }

  timerBox() {
    return (
      <Box minWidth="250px">
        <Timer
          active={this.state.timeStatus}
          onStart={() => this.setState({ timeStatus: true })}
          onStop={() => this.setState({ timeStatus: false })}
        />
        {this.state.description !== "" && (
          <Box margin="20px">
            <TextField
              multiline
              variant="outlined"
              InputProps={{ readOnly: true }}
              value={this.state.description}
            />
          </Box>
        )}
        <Box margin="20px">
          <TextField multiline variant="outlined" />
        </Box>
      </Box>
    );
  }

  settingLeftBox() {
    return (
      <Box minWidth="250px">
        <Box margin="30px">
          <Select
            fullWidth={true}
            value={this.state.mode}
            onChange={(event) => this.setMode(event.target.value)}
          >
            <MenuItem value="number">Number</MenuItem>
            <MenuItem value="cage">Cage</MenuItem>
            <MenuItem value="path">Path</MenuItem>
            <MenuItem value="color">Color</MenuItem>
            <MenuItem value="edge">Edge</MenuItem>
          </Select>
          {this.state.mode === "number" && this.numberStyleBox()}
          {this.state.mode === "cage" && this.cageStyleBox()}
          {this.state.mode === "path" && this.pathStyleBox()}
          {this.state.mode === "edge" && this.edgeStyleBox()}
        </Box>
        <Box margin="30px">
          <Select
            fullWidth={true}
            value={this.state.settingsMode}
            onChange={(event) =>
              this.setState({ settingsMode: event.target.value })
            }
          >
            <MenuItem value="size">Size</MenuItem>
            <MenuItem value="margins">Margins</MenuItem>
            <MenuItem value="grid">Grid</MenuItem>
            <MenuItem value="description">Description</MenuItem>
          </Select>
        </Box>
        {this.state.settingsMode === "size" && (
          <Box margin="30px" padding="10px" boxShadow={3}>
            {this.sizeSlider("cellSize", "Cell size", 32, 96, 4, true)}
            {this.sizeSlider("width", "Width", 3, 30)}
            {this.sizeSlider("height", "Height", 3, 30)}
          </Box>
        )}
        {this.state.settingsMode === "margins" && (
          <Box margin="30px" padding="10px" boxShadow={3}>
            {this.sizeSlider("left", "Left")}
            {this.sizeSlider("right", "Right")}
            {this.sizeSlider("top", "Top")}
            {this.sizeSlider("bottom", "Bottom")}
          </Box>
        )}
        {this.state.settingsMode === "grid" && (
          <Box margin="30px" padding="10px" boxShadow={3}>
            {this.sizeSlider("gridDivWidth", "Grid divider width")}
            {this.sizeSlider("gridDivHeight", "Grid divider height")}
            <FormControl fullWidth={true}>
              <InputLabel id="gridstyle-label">Style</InputLabel>
              <Select
                labelId="gridstyle-label"
                fullWidth={true}
                value={this.state.gridStyle}
                onChange={(event) =>
                  this.setGridState("gridStyle", event.target.value)
                }
              >
                <MenuItem value="lines">Lines</MenuItem>
                <MenuItem value="dash">Dashed</MenuItem>
                <MenuItem value="dots">Dots</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth={true}>
              <FormLabel>Diagonals</FormLabel>
              <FormGroup>
                <FormControlLabel
                  fullWidth={true}
                  control={
                    <Switch
                      checked={this.state.gridLeftDiagonal}
                      onChange={(e) => {
                        this.setGridState("gridLeftDiagonal", e.target.checked);
                      }}
                    />
                  }
                  label="Left"
                />
                <FormControlLabel
                  control={
                    <Switch
                      labelId="rightdiagonal-label"
                      fullWidth={true}
                      checked={this.state.gridRightDiagonal}
                      onChange={(e) => {
                        this.setGridState(
                          "gridRightDiagonal",
                          e.target.checked
                        );
                      }}
                    />
                  }
                  label="Right"
                />
              </FormGroup>
            </FormControl>
          </Box>
        )}
        {this.state.settingsMode === "description" && (
          <Box margin="30px" padding="10px" boxShadow={3}>
            <TextField
              multiline
              rows={8}
              value={this.state.description}
              onChange={(e) => this.setState({ description: e.target.value })}
            />
          </Box>
        )}
      </Box>
    );
  }

  handleChange(newValue, type) {
    this.setState({ [type]: newValue });
  }

  setGrid(type) {
    if (
      [
        "cellSize",
        "gridDivWidth",
        "gridDivHeight",
        "gridStyle",
        "gridLeftDiagonal",
        "gridRightDiagonal",
      ].includes(type)
    )
      DrawUpdateGrid(this.canvasRef.current, this.state);
    else DrawRender(code, this.canvasRef.current, this.state);
  };

  setGridState = (state, value) => {
    this.setState({ [state]: value }, () => {
      this.setGrid(state);
    });
  };

  sizeSlider(type, label, min = 0, max = 10, step = 1, marks = false) {
    return (
      <Box>
        <Typography>
          {label}: {this.state[type]}
        </Typography>
        <Slider
          value={this.state[type]}
          min={min}
          max={max}
          step={step}
          marks={marks}
          id={type}
          onChange={(e, newValue) => this.handleChange(newValue, type)}
          onChangeCommitted={() => this.setGrid(type)}
        />
      </Box>
    );
  }

  check = () => {
    let r = DrawCheck();
    let status = r[0];
    let msg = r[1];
    if (status) this.setState({ timeStatus: false });
    alert(msg);
  };

  renderSolveMode() {
    let solveStyle = 0;
    let buttons;
    switch (solveStyle) {
      case 0:
        buttons = [
          ["normal", "Normal"],
          ["center", "Center"],
          ["corner", "Corner"],
          ["color", "Color"],
          ["edgecross", "Edge+cross"],
        ];
        break;
      case 1:
        buttons = [
          ["edgecross", "Edge+cross"],
          ["centerline", "Center line"],
          ["color", "Color"],
        ];
        break;
      default:
        break;
    }

    return (
      <Box display="flex" flexDirection="row">
        {this.timerBox()}
        <Box display="flex">
          <div id="canvas" ref={this.canvasRef}></div>
        </Box>
        <Box minWidth="250px" maxWidth="250px">
          <Box margin="30px">
            <ButtonGroup
              fullWidth={true}
              size="large"
              variant="contained"
              orientation="vertical"
            >
              {buttons.map((b) => (
                <Button
                  id={"button" + b[0]}
                  key={b[0]}
                  color={this.state.mode === b[0] ? "primary" : "default"}
                  onClick={() => this.setMode(b[0])}
                >
                  {b[1]}
                </Button>
              ))}
            </ButtonGroup>
          </Box>
          <Box margin="30px">
            <ButtonGroup
              fullWidth={true}
              size="large"
              variant="contained"
              orientation="vertical"
            >
              <Button onClick={DrawUndo}>Undo</Button>
              <Button onClick={DrawRedo}>Redo</Button>
              <Button onClick={DrawDelete}>Delete</Button>
              <Button onClick={this.check}>Check</Button>
            </ButtonGroup>
          </Box>
          <Box margin="30px">
            <ButtonGroup
              fullWidth={true}
              size="large"
              variant="contained"
              orientation="vertical"
            >
              <ResetButton />
            </ButtonGroup>
          </Box>
          <Box margin="30px">
            <Grid container>
              {this.state.mode === "color" && <ColorGrid num={9} />}
              {this.state.mode !== "color" &&
                [...Array(9).keys()].map((index) => (
                  <Grid key={index} item xs={4}>
                    <Button
                      variant="outlined"
                      onClick={() => DrawSetNumber(index + 1)}
                    >
                      <div style={{ fontSize: "20px" }}>{index + 1}</div>
                    </Button>
                  </Grid>
                ))}
            </Grid>
          </Box>
        </Box>
      </Box>
    );
  }

  settingRight() {
    return (
      <Grid container>
        {this.state.mode !== "color" && <ColorSelect />}
        {this.state.mode === "color" && <ColorGrid />}
        {this.state.mode === "number" && <SymbolSelect />}
      </Grid>
    );
  }

  renderSetMode() {
    return (
      <Box display="flex" flexDirection="row">
        <UrlDialog
          text={this.state.dialogText}
          open={this.state.dialogOpen}
          onClose={() => this.setState({ dialogOpen: false })}
        />
        {this.settingLeftBox()}
        <Box display="flex">
          <div id="canvas" ref={this.canvasRef}></div>
        </Box>
        <Box minWidth="250px" maxWidth="250px">
          <Box margin="30px">
            <ButtonGroup
              fullWidth={true}
              size="large"
              variant="contained"
              orientation="vertical"
            >
              <ResetButton />
            </ButtonGroup>
          </Box>
          <Box margin="30px">
            <ButtonGroup
              fullWidth={true}
              size="large"
              variant="contained"
              orientation="vertical"
            >
              <Button onClick={DrawDelete}>Delete</Button>
              <Button onClick={this.generateUrl}>Generate URL</Button>
            </ButtonGroup>
          </Box>
          <Box margin="30px">{this.settingRight()}</Box>
        </Box>
      </Box>
    );
  }

  render() {
    return (
      <ConfirmProvider>
        {solveMode ? this.renderSolveMode() : this.renderSetMode()}
      </ConfirmProvider>
    );
  }
}

export default App;
