import React from 'react';
import './App.css';
import { DrawRender, DrawSetMode, DrawUndo, DrawAddGrid, DrawGenerateUrl } from './draw';
import { Box, Button, ButtonGroup, Dialog, DialogTitle, DialogContent,
         DialogContentText, DialogActions, Slider, Typography, Select, MenuItem, FormControl, InputLabel } from '@material-ui/core';

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
    this.state = {
      cellSize: 64,
      width: 9,
      height: 9,
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
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

  setLeftMargin = (event, value) => this.setGridSize('left', value);
  setRightMargin = (event, value) => this.setGridSize('right', value);
  setTopMargin = (event, value) => this.setGridSize('top', value);
  setBottomMargin = (event, value) => this.setGridSize('bottom', value);
  setWidth = (event, value) => this.setGridSize('width', value);
  setHeight = (event, value) => this.setGridSize('height', value);
  setCellSize = (event, value) => this.setGridSize('cellSize', value);

  render() {
    let set_buttons = [
      ["set", "Set"],
      ["set_corner", "Set corner"],
    ];

    let buttons = [
      ["normal", "Normal"],
      ["center", "Center"],
      ["corner", "Corner"]
    ];

    return (
      <div>
      <Box display="flex" flexDirection="row" bgcolor="background.paper">
        <UrlDialog text={this.state.dialogText} open={this.state.dialogOpen} onClose={() => this.setState({dialogOpen: false})}/>
        <Box width="250px">
          <Box margin="30px">
            <Select fullWidth={true} value={this.state.mode} onChange={(event) => this.setMode(event.target.value)}>
              <MenuItem value="number">Number</MenuItem>
              <MenuItem value="cage">Cage</MenuItem>
              <MenuItem value="thermo">Thermo</MenuItem>
            </Select>
            { this.state.mode === "number" &&
            <Box margin="10px">
              <FormControl fullWidth={true}>
                <InputLabel shrink id="numberstyle-label">
                  Style
                </InputLabel>
                <Select labelId="numberstyle-label" fullWidth={true} value={this.state.numberStyle} onChange={(event) => this.setStyle("numberStyle", event.target.value)}>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="corner">Corner</MenuItem>
                </Select>
                </FormControl>
              </Box>
            }
            { this.state.mode === "cage" &&
            <Box margin="10px">
              <FormControl fullWidth={true}>
                <InputLabel shrink id="cagestyle-label">
                  Style
                </InputLabel>
                <Select labelId="cagestyle-label" fullWidth={true} value={this.state.cageStyle} onChange={(event) => this.setStyle("cageStyle", event.target.value)}>
                  <MenuItem value="dash">Dashed</MenuItem>
                  <MenuItem value="edge">Edge</MenuItem>
                </Select>
                </FormControl>
              </Box>
            }
            { this.state.mode === "thermo" &&
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
            }
          </Box>
          <Box margin="30px">
            <ButtonGroup fullWidth={true} size="large" variant="contained" orientation="vertical">
              <Button onClick={this.generateUrl}>Generate URL</Button>
              <Button onClick={DrawAddGrid}>Add grid</Button>
            </ButtonGroup>
          </Box>
          <Box margin="30px" padding="10px" boxShadow={3}>
            <Typography>Cell size: {this.state.cellSize}</Typography>
            <Slider defaultValue={this.state.cellSize} valueLabelDisplay="auto" min={32} max={96} step={4} marks onChangeCommitted={this.setCellSize}/>
            <Typography>Width: {this.state.width}</Typography>
            <Slider defaultValue={this.state.width} valueLabelDisplay="auto" min={3} max={30} onChangeCommitted={this.setWidth}/>
            <Typography>Height: {this.state.height}</Typography>
            <Slider defaultValue={this.state.height} valueLabelDisplay="auto" min={3} max={30} onChangeCommitted={this.setHeight}/>
            <Typography>Left margin: {this.state.left}</Typography>
            <Slider defaultValue={this.state.left} valueLabelDisplay="auto" min={0} max={10} onChangeCommitted={this.setLeftMargin}/>
            <Typography>Right margin: {this.state.right}</Typography>
            <Slider defaultValue={this.state.right} valueLabelDisplay="auto" min={0} max={10} onChangeCommitted={this.setRightMargin}/>
            <Typography>Top margin: {this.state.top}</Typography>
            <Slider defaultValue={this.state.top} valueLabelDisplay="auto" min={0} max={10} onChangeCommitted={this.setTopMargin}/>
            <Typography>Bottom margin: {this.state.bottom}</Typography>
            <Slider defaultValue={this.state.bottom} valueLabelDisplay="auto" min={0} max={10} onChangeCommitted={this.setBottomMargin}/>
          </Box>
        </Box>
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
        </Box>
      </Box>
      </div>
    );
  }
}

export default App;
