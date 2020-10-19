import React from "react";
import "./App.css";
import {
  DrawRender,
  DrawSymbol,
  DrawSetMode,
  DrawUndo,
  DrawDelete,
  DrawGenerateUrl,
  DrawSetNumber,
  DrawSetColor,
  DrawColors,
  DrawGetDescription,
  DrawReset,
  DrawCheck,
  DrawSetSymbolPage,
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
import { ConfirmProvider, useConfirm } from 'material-ui-confirm';
import { PlayArrow, Pause, SkipPrevious } from "@material-ui/icons";

//const confirm = useConfirm();
const query = window.location.search;
const url_params = new URLSearchParams(query);
const code = url_params.get("p");
const solve_mode = url_params.get("s") === "1";

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
      solveMode: solve_mode,
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
      mode: solve_mode ? "normal" : "number",
      numberStyle: "normal",
      multiDigit: false,
      numberBackground: false,
      cageStyle: "dash",
      pathStyle: "arrow",
      dialogOpen: false,
      dialogText: "",
      seconds: 0,
      timeStatus: true,
      symbolPage: "0",
    };
  }

  handleKeyDown = (event) => {
    if (event.target.tagName === "TEXTAREA") return;

    if (this.state.solveMode) {
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
      DrawSetMode(this.state);
    });

    document.addEventListener("keydown", this.handleKeyDown);

    this.interval = setInterval(() => {
      if (this.state.timeStatus) {
        this.setState({ seconds: this.state.seconds + 1 });
      }
    }, 1000);
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
            <MenuItem value="edge">Edge</MenuItem>
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
            <MenuItem value="closed">Closed</MenuItem>
          </Select>
        </FormControl>
      </Box>
    );
  }

  timerBox() {
    return (
      <Box minWidth="250px">
        <Box margin="20px" padding="10px" boxShadow={3}>
          <Typography align="center" variant="h4">
            {new Date(this.state.seconds * 1000).toISOString().substr(11, 8)}
          </Typography>
          <ButtonGroup fullWidth={true} size="large">
            <Button onClick={() => this.setState({ timeStatus: true })}>
              <PlayArrow />
            </Button>
            <Button onClick={() => this.setState({ timeStatus: false })}>
              <Pause />
            </Button>
            <Button
              onClick={() => this.setState({ seconds: 0, timeStatus: false })}
            >
              <SkipPrevious />
            </Button>
          </ButtonGroup>
        </Box>
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
        </Box>
        <Box margin="30px">
          <ButtonGroup
            fullWidth={true}
            size="large"
            variant="contained"
            orientation="vertical"
          >
            <Button onClick={this.generateUrl}>Generate URL</Button>
          </ButtonGroup>
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
            {this.sizeSlider("cellSize", "Cell size", 32, 96, 5, true)}
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

  handleChange = (event, newValue) => {
    this.setState({ [event.target.parentNode.id]: newValue });
  };

  setGrid = () => {
    DrawRender(code, this.canvasRef.current, this.state);
    DrawSetMode(this.state);
  };

  setSymbolPage = (event) => {
    this.setState({ symbolPage: event.target.value }, () => {
      if (+this.state.symbolPage > 0)
        for (let i = 0; i < 9; ++i) {
          DrawSymbol(
            this.symbolRef[i].current,
            this.state.symbolPage,
            i + 1,
            30
          );
        }
    });
    DrawSetSymbolPage(+event.target.value);
  };

  setGridState = (state, value) => {
    this.setState({ [state]: value }, () => {
      DrawRender(code, this.canvasRef.current, this.state);
      DrawSetMode(this.state);
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
          onChange={this.handleChange}
          onChangeCommitted={this.setGrid}
        />
      </Box>
    );
  }

  colorGrid(num) {
    return DrawColors.slice(0, num).map((color, index) => (
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


  reset = () => {
    /*
    confirm({ description: "ASDASD" })
      .then(() => DrawReset());
      */
    DrawReset()
  }

  check = () => {
    let r = DrawCheck();
    let status = r[0];
    let msg = r[1];
    if (status)
      this.setState({ timeStatus: false });
    alert(msg);
  }

  renderSolveMode() {
    let solvemode = 0;
    let buttons;
    switch (solvemode) {
      case 0:
        buttons = [
          ["normal", "Normal"],
          ["center", "Center"],
          ["corner", "Corner"],
          ["color", "Color"],
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
              <Button onClick={this.reset}>Reset</Button>
              <Button onClick={this.check}>Check</Button>
              <Button onClick={DrawUndo}>Undo</Button>
              <Button onClick={DrawDelete}>Delete</Button>
            </ButtonGroup>
          </Box>
          <Box margin="30px">
            <Grid container>
              {this.state.mode === "color" && this.colorGrid(9)}
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

  colorSelect() {
    return DrawColors.map((color, index) => (
      <Grid key={index} item xs={4}>
        <Button
          variant={this.state.color === index ? "contained" : "outlined"}
          onClick={() => {
            this.setState({ color: index });
            DrawSetColor(index);
          }}
        >
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

  pageSelect() {
    const pages = ["Numbers", "Circles", "Arrows", "Arrows 2", "Misc"];

    return (
      <FormControl fullWidth={true}>
        <Select
          fullWidth={true}
          value={this.state.symbolPage}
          onChange={this.setSymbolPage}
        >
          {pages.map((p, i) => (
            <MenuItem key={p} value={i}>
              {p}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  symbolGrid() {
    return [...Array(9).keys()].map((index) => (
      <Grid key={index} item xs={4}>
        <Button variant="outlined" onClick={() => DrawSetNumber(index + 1)}>
          {+this.state.symbolPage === 0 && (
            <div style={{ fontSize: "20px" }}>{index + 1}</div>
          )}
          {+this.state.symbolPage > 0 && <div ref={this.symbolRef[index]} />}
        </Button>
      </Grid>
    ));
  }

  settingRight() {
    return (
      <Grid container>
        {this.state.mode !== "color" && this.colorSelect()}
        {this.state.mode === "color" && this.colorGrid()}
        {this.state.mode === "number" && this.pageSelect()}
        {this.state.mode === "number" && this.symbolGrid()}
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
              <Button onClick={DrawReset}>Reset</Button>
              <Button onClick={DrawUndo}>Undo</Button>
              <Button onClick={DrawDelete}>Delete</Button>
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
        {this.state.solveMode ? this.renderSolveMode() : this.renderSetMode()}
      </ConfirmProvider>
    );
  }
}

export default App;
