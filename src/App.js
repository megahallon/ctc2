import React from 'react';
import './App.css';
import { DrawRender, DrawSetMode, DrawUndo, DrawAddGrid,
         DrawGenerateUrl, DrawSetNumber, DrawSetColor } from './draw';
import { Box, Button, ButtonGroup, Dialog, DialogTitle, DialogContent,
         DialogContentText, DialogActions, Slider, Typography, Select,
         MenuItem, FormControl, InputLabel, Grid } from '@material-ui/core';

const query = window.location.search;
const url_params = new URLSearchParams(query);
const code = url_params.get("p");

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
    super(props)
    this.defaultLeft = 0;
    this.defaultRight = 0;
    this.defaultTop = 0;
    this.defaultBottom = 0;
    this.defaultCellSize = 64;
    this.defaultWidth = 9;
    this.defaultHeight = 9;
    this.state = {
      solveMode: false,
      color: "",
      cellSize: this.defaultCellSize,
      width: this.defaultWidth,
      height: this.defaultHeight,
      left: this.defaultLeft,
      right: this.defaultRight,
      top: this.defaultTop,
      bottom: this.defaultBottom,
      mode: "number",
      numberStyle: "normal",
      cageStyle: "dash",
      thermoStyle: "bulb",
      dialogOpen: false,
      dialogText: ""
    };
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

    DrawRender(code, document.getElementById('canvas'),
      this.state.cellSize, size, margins);
  }

  setMode = (mode) => {
    this.setState({mode: mode}, () => DrawSetMode(this.state));
  }

  setStyle = (style, value) => {
    this.setState({[style]: value}, () => DrawSetMode(this.state));
  }

  setColor = (color_index) => {
    DrawSetColor(color_index);
  }

  setNumber = (number) => {
    DrawSetNumber(number);
  }

  generateUrl = (event) => {
    let url = DrawGenerateUrl();
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
          <Select labelId="thermostyle-label" fullWidth={true} value={this.state.thermoStyle} onChange={(event) => this.setStyle("thermoStyle", event.target.value)}>
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

    let colors = [
      "rgba(0, 0, 0, 1)",
      "rgba(207, 207, 207, 0.5)",
      "rgba(255, 255, 255, 0)",
      "rgba(163, 224, 72, 0.5)",
      "rgba(210, 59, 231, 0.5)",
      "rgba(235, 117, 50, 0.5)",
      "rgba(226, 38, 31, 0.5)",
      "rgba(247, 208, 56, 0.5)",
      "rgba(52, 187, 230, 0.5)"
    ];

    return (
      <Box display="flex" flexDirection="row" bgcolor="background.paper">
        <UrlDialog text={this.state.dialogText} open={this.state.dialogOpen} onClose={() => this.setState({dialogOpen: false})}/>
        {!this.state.solveMode &&
        <Box width="250px">
          <Box margin="30px">
            <Select fullWidth={true} value={this.state.mode} onChange={(event) => this.setMode(event.target.value)}>
              <MenuItem value="number">Number</MenuItem>
              <MenuItem value="cage">Cage</MenuItem>
              <MenuItem value="thermo">Thermo</MenuItem>
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
        </Box>
      }
        <Box display="flex">
          <div id="canvas"></div>
        </Box>
        <Box width="250px">
          <Box margin="30px">
            <ButtonGroup fullWidth={true} size="large" variant="contained" orientation="vertical">
              {buttons.map((b) => (
                <Button key={b[0]} color={this.state.mode === b[0] ? "primary" : "default"} onClick={(e) => this.setMode(b[0])}>{b[1]}</Button>
              ))}
            </ButtonGroup>
          </Box>
          <Box margin="30px">
            <ButtonGroup fullWidth={true} size="large" variant="contained" orientation="vertical">
              <Button onClick={DrawUndo}>Undo</Button>
            </ButtonGroup>
          </Box>
          <Box margin="30px">
          <Grid container>
          {this.state.mode === "color" && colors.map((color, index) =>
            <Grid key={index} item xs={4}>
              <Button variant="outlined" onClick={(e) => DrawSetColor(index)}>
                <div style={{border: "1px solid black", background: color, width: "30px", height: "30px"}}/>
              </Button>
            </Grid>
          )}
          {this.state.mode !== "color" && [...Array(9).keys()].map((index) =>
            <Grid key={index} item xs={4}>
              <Button variant="outlined" onClick={(e) => DrawSetNumber(index + 1)}>
              <div style={{fontSize: "20px"}}>
                {index + 1}
              </div>
              </Button>
            </Grid>
          )}
          </Grid>
          </Box>
        </Box>
      </Box>
    );
  }
}

export default App;
