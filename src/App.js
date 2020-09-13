import React from 'react';
import './App.css';
import { DrawRender, DrawSetMode, DrawUndo, DrawDelete, DrawAddGrid,
         DrawGenerateUrl, DrawSetNumber, DrawSetColor, DrawColors,
         DrawGetDescription, DrawReset } from './draw';
import { Box, Button, ButtonGroup, Dialog, DialogTitle, DialogContent,
         DialogContentText, DialogActions, Slider, Typography, Select,
         MenuItem, FormControl, InputLabel, Grid, TextField } from '@material-ui/core';
import { PlayArrow, Pause, SkipPrevious } from '@material-ui/icons';

const query = window.location.search;
const url_params = new URLSearchParams(query);
const code = url_params.get("p");
const solve_mode = url_params.get("s") === "1";

function UrlDialog(props) {
  let openInTab = () => {
    props.onClose();
    let w = window.open(props.text, '_blank');
    w.focus();
  };

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle>URL</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {props.text}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={openInTab}>Open in tab</Button>
        <Button color="primary" onClick={props.onClose}>OK</Button>
      </DialogActions>
    </Dialog>
  );
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();

    this.defaultLeft = 0;
    this.defaultRight = 0;
    this.defaultTop = 0;
    this.defaultBottom = 0;
    this.defaultCellSize = 64;
    this.defaultWidth = 9;
    this.defaultHeight = 9;
    this.state = {
      solveMode: solve_mode,
      settingsMode: "size",
      color: 0,
      description: "",
      cellSize: this.defaultCellSize,
      width: this.defaultWidth,
      height: this.defaultHeight,
      left: this.defaultLeft,
      right: this.defaultRight,
      top: this.defaultTop,
      bottom: this.defaultBottom,
      mode: solve_mode ? "normal" : "number",
      numberStyle: "normal",
      cageStyle: "dash",
      thermoStyle: "bulb",
      dialogOpen: false,
      dialogText: "",
      seconds: 0,
      timeStatus: false,
    };
  }

  handleKeyDown = (event) => {
    if (this.state.solveMode) {
      if (event.key === "q") {
        this.setMode("normal");
      }
      if (event.key === "w") {
        this.setMode("center");
      }
      if (event.key === "e") {
        this.setMode("corner");
      }
      if (event.key === "r") {
        this.setMode("color");
      }
      if (event.key === " ") {
        let cycle_modes = ["normal", "center", "corner", "color"];
        let i = cycle_modes.indexOf(this.state.mode);
        if (i !== -1) {
          i = (i + 1) % cycle_modes.length;
          this.setMode(cycle_modes[i]);
        }
        else {
          this.setMode("normal");
        }
      }
    }
  }

  componentDidMount() {
    let margins = {
      left: this.state.left,
      right: this.state.right,
      top: this.state.top,
      bottom: this.state.bottom
    };
    let size = {
      width: this.state.width,
      height: this.state.height
    }

    DrawRender(code, this.canvasRef.current, this.state.cellSize, size, margins);
    this.setState({description: DrawGetDescription()});

    DrawSetMode(this.state);

    document.addEventListener("keydown", this.handleKeyDown);

    this.interval = setInterval(() => {
      if (this.state.timeStatus) {
        this.setState({seconds: this.state.seconds + 1});
      }
    }, 1000);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyDown);
    clearInterval(this.interval);
  }

  setMode = (mode) => {
    this.setState({mode: mode}, () => DrawSetMode(this.state));
  }

  setStyle = (style, value) => {
    this.setState({[style]: value}, () => DrawSetMode(this.state));
  }

  generateUrl = () => {
    let url = DrawGenerateUrl(this.state.description);
    this.setState({dialogText: url, dialogOpen: true});
  }

  setGridSize(id, value) {
    this.setState({[id]: value});
    let margins = {
      left: this.state.left,
      right: this.state.right,
      top: this.state.top,
      bottom: this.state.bottom
    };
    let size = {
      width: this.state.width,
      height: this.state.height
    }
    // Can't use ref as element is replaced
    DrawRender(code, document.getElementById('canvas'),
      this.state.cellSize, size, margins);
  }

  numberStyleBox() {
    return (
      <Box margin="10px">
        <FormControl fullWidth={true}>
          <InputLabel shrink id="numberstyle-label">
            Style
          </InputLabel>
          <Select labelId="numberstyle-label" fullWidth={true} value={this.state.numberStyle}
                  onChange={(event) => this.setStyle("numberStyle", event.target.value)}>
            <MenuItem value="normal">Normal</MenuItem>
            <MenuItem value="corner">Corner</MenuItem>
          </Select>
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
          <Select labelId="cagestyle-label" fullWidth={true} value={this.state.cageStyle}
                  onChange={(event) => this.setStyle("cageStyle", event.target.value)}>
            <MenuItem value="dash">Dashed</MenuItem>
            <MenuItem value="edge">Edge</MenuItem>
          </Select>
        </FormControl>
      </Box>
    );
  }

  thermoStyleBox() {
    return (
      <Box margin="10px">
        <FormControl fullWidth={true}>
          <InputLabel shrink id="thermostyle-label">
            Style
          </InputLabel>
          <Select labelId="thermostyle-label" fullWidth={true} value={this.state.thermoStyle}
                  onChange={(event) => this.setStyle("thermoStyle", event.target.value)}>
            <MenuItem value="bulb">With bulb</MenuItem>
            <MenuItem value="nobulb">No bulb</MenuItem>
          </Select>
        </FormControl>
      </Box>
    );
  }

  setLeftMargin = (event, value) => this.setGridSize('left', value);
  setRightMargin = (event, value) => this.setGridSize('right', value);
  setTopMargin = (event, value) => this.setGridSize('top', value);
  setBottomMargin = (event, value) => this.setGridSize('bottom', value);
  setWidth = (event, value) => this.setGridSize('width', value);
  setHeight = (event, value) => this.setGridSize('height', value);
  setCellSize = (event, value) => this.setGridSize('cellSize', value);

  render() {
    let buttons = [
      ["normal", "Normal"],
      ["center", "Center"],
      ["corner", "Corner"],
      ["color", "Color"]
    ];

    return (
      <Box display="flex" flexDirection="row">
        <UrlDialog text={this.state.dialogText} open={this.state.dialogOpen} onClose={() => this.setState({dialogOpen: false})}/>
        {this.state.solveMode && this.state.description !== "" &&
          <Box width="250px">
            <Box margin="10px">
              <TextField label="Description" multiline variant="outlined"
                InputProps={{readOnly: true}}
                value={this.state.description}/>
            </Box>
          </Box>
        }
        {!this.state.solveMode &&
          <Box width="250px">
            <Box margin="30px">
              <Select fullWidth={true} value={this.state.mode} onChange={(event) => this.setMode(event.target.value)}>
                <MenuItem value="number">Number</MenuItem>
                <MenuItem value="cage">Cage</MenuItem>
                <MenuItem value="thermo">Thermo</MenuItem>
                <MenuItem value="color">Color</MenuItem>
              </Select>
              { this.state.mode === "number" && this.numberStyleBox() }
              { this.state.mode === "cage" && this.cageStyleBox() }
              { this.state.mode === "thermo" && this.thermoStyleBox() }
            </Box>
            <Box margin="30px">
              <ButtonGroup fullWidth={true} size="large" variant="contained" orientation="vertical">
                <Button onClick={this.generateUrl}>Generate URL</Button>
                <Button onClick={DrawAddGrid}>Add grid</Button>
              </ButtonGroup>
            </Box>
            <Box margin="30px">
              <Select fullWidth={true} value={this.state.settingsMode} onChange={(event) => this.setState({settingsMode: event.target.value})}>
                <MenuItem value="size">Size</MenuItem>
                <MenuItem value="description">Description</MenuItem>
              </Select>
            </Box>
            { this.state.settingsMode === "size" &&
            <Box margin="30px" padding="10px" boxShadow={3}>
              <Typography>Cell size: {this.state.cellSize}</Typography>
              <Slider defaultValue={this.defaultCellSize} valueLabelDisplay="auto"
                min={32} max={96} step={4} marks onChangeCommitted={this.setCellSize}/>
              <Typography>Width: {this.state.width}</Typography>
              <Slider defaultValue={this.defaultWidth} valueLabelDisplay="auto"
                min={3} max={30} onChangeCommitted={this.setWidth}/>
              <Typography>Height: {this.state.height}</Typography>
              <Slider defaultValue={this.defaultHeight} valueLabelDisplay="auto"
                min={3} max={30} onChangeCommitted={this.setHeight}/>
              <Typography>Left margin: {this.state.left}</Typography>
              <Slider defaultValue={this.defaultLeft} valueLabelDisplay="auto"
                min={0} max={10} onChangeCommitted={this.setLeftMargin}/>
              <Typography>Right margin: {this.state.right}</Typography>
              <Slider defaultValue={this.defaultRight} valueLabelDisplay="auto"
                min={0} max={10} onChangeCommitted={this.setRightMargin}/>
              <Typography>Top margin: {this.state.top}</Typography>
              <Slider defaultValue={this.defaultTop} valueLabelDisplay="auto"
                min={0} max={10} onChangeCommitted={this.setTopMargin}/>
              <Typography>Bottom margin: {this.state.bottom}</Typography>
              <Slider defaultValue={this.defaultBottom} valueLabelDisplay="auto"
                min={0} max={10} onChangeCommitted={this.setBottomMargin}/>
            </Box>
            }
            { this.state.settingsMode === "description" &&
            <Box margin="30px" padding="10px" boxShadow={3}>
              <TextField multiline rows={8}
                defaultValue="" value={this.state.description} onChange={(e) => this.setState({description: e.target.value})}/>
            </Box>
            }
          </Box>
        }
        <Box display="flex">
          <div id="canvas" ref={this.canvasRef}></div>
        </Box>
        <Box width="250px">
          {this.state.solveMode &&
            <Box margin="30px">
              <ButtonGroup fullWidth={true} size="large" variant="contained" orientation="vertical">
                {buttons.map((b) => (
                  <Button key={b[0]} color={this.state.mode === b[0] ? "primary" : "default"} onClick={(e) => this.setMode(b[0])}>{b[1]}</Button>
                ))}
              </ButtonGroup>
            </Box>
          }
          <Box margin="30px">
            <ButtonGroup fullWidth={true} size="large" variant="contained" orientation="vertical">
              <Button onClick={DrawReset}>Reset</Button>
              <Button onClick={DrawUndo}>Undo</Button>
              <Button onClick={DrawDelete}>Delete</Button>
            </ButtonGroup>
          </Box>
          <Box margin="30px">
            <Grid container>
            {(!this.state.solveMode && this.state.mode !== "color") && DrawColors.map((color, index) =>
              <Grid key={index} item xs={4}>
                <Button variant={this.state.color === index ? "contained" : "outlined"} onClick={() => {console.log(index, this.state.color); this.setState({color: index}); DrawSetColor(index)}}>
                  <div style={{border: "1px solid black", background: color, width: "30px", height: "30px"}}/>
                </Button>
              </Grid>
            )}
            {this.state.mode === "color" && DrawColors.map((color, index) =>
              <Grid key={index} item xs={4}>
                <Button variant="outlined" onClick={() => DrawSetColor(index)}>
                  <div style={{border: "1px solid black", background: color, width: "30px", height: "30px"}}/>
                </Button>
              </Grid>
            )}
            {this.state.mode !== "color" && [...Array(9).keys()].map(index =>
              <Grid key={index} item xs={4}>
                <Button variant="outlined" onClick={() => DrawSetNumber(index + 1)}>
                <div style={{fontSize: "20px"}}>
                  {index + 1}
                </div>
                </Button>
              </Grid>
            )}
            </Grid>
          </Box>
          {this.state.solveMode &&
            <Box margin="30px" padding="10px" boxShadow={3}>
              <Typography align="center" variant="h4">{new Date(this.state.seconds * 1000).toISOString().substr(11, 8)}</Typography>
              <ButtonGroup fullWidth={true} size="large">
                <Button onClick={() => this.setState({timeStatus: true})}><PlayArrow/></Button>
                <Button onClick={() => this.setState({timeStatus: false})}><Pause/></Button>
                <Button onClick={() => this.setState({seconds: 0, timeStatus: false})}><SkipPrevious/></Button>
              </ButtonGroup>
            </Box>
          }
        </Box>
      </Box>
    );
  }
}

export default App;
