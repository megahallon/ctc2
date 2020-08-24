import React from 'react';
import './App.css';
import { DrawRender, DrawSetMode, DrawUndo, DrawAddGrid, DrawGenerateUrl } from './draw.js';
import { Box, Grid, Button, ButtonGroup, Dialog, DialogTitle, DialogContent,
         DialogContentText, DialogActions, Slider, Typography } from '@material-ui/core';

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
    this.cellSize = 64;
    this.size = {width: 9, height: 9};
    this.margins = {left: 0, right: 0, top: 0, bottom: 0};
    this.state = {value: "normal", dialogOpen: false, dialogText: ''};
  }

  componentDidMount() {
    const query = window.location.search;
    const url_params = new URLSearchParams(query);
    const code = url_params.get("p");
    DrawRender(code, document.getElementById('canvas'), this.cellSize, this.size, this.margins);
  }

  click = (event) => {
    this.setState({value: event});
    DrawSetMode(event);
  }

  getColor = (event) => {
    console.log("getcolor", event);
    if (this.state.value === "normal") {
      return "primary";
    }
    return "secondary";
  }

  generateUrl = (event) => {
    let url = DrawGenerateUrl();
    this.setState({dialogText: url, dialogOpen: true});
  }

  setGridSize(id, value) {
    this.width = value;
    const query = window.location.search;
    const url_params = new URLSearchParams(query);
    const code = url_params.get("p");
    console.log(value);
    if (id === 'width')
      this.size.width = value;
    if (id === 'height')
      this.size.height = value;
    if (id === 'left')
      this.margins.left = value;
    if (id === 'right')
      this.margins.right = value;
    if (id === 'top')
      this.margins.top = value;
    if (id === 'bottom')
      this.margins.bottom = value;
    if (id === 'cellSize')
      this.cellSize = value;
    DrawRender(code, document.getElementById('canvas'), this.cellSize, this.size, this.margins);
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
      ["cage", "Cage"],
      ["edge_cage", "Edge cage"],
      ["thermo", "Thermo"]
    ];

    return (
      <Box>
      <UrlDialog text={this.state.dialogText} open={this.state.dialogOpen} onClose={() => this.setState({dialogOpen: false})}/>
      <Grid container spacing={3}>
        <Grid item xs={2}>
          <Box margin="10px">
          <ButtonGroup fullWidth="true" size="large" variant="contained" orientation="vertical">
            {set_buttons.map((b) => (
              <Button color={this.state.value === b[0] ? "primary" : "default"} onClick={(e) => this.click(b[0])}>{b[1]}</Button>
            ))}
          </ButtonGroup>
          </Box>
          <Box margin="10px">
            <ButtonGroup fullWidth="true" size="large" variant="contained" orientation="vertical">
              <Button onClick={this.generateUrl}>Generate URL</Button>
              <Button onClick={DrawAddGrid}>Add grid</Button>
            </ButtonGroup>
          </Box>
          <Box margin="10px" padding="10px" boxShadow={3}>
            <Typography gutterBottom>Cell size</Typography>
            <Slider defaultValue={this.cellSize} valueLabelDisplay="auto" min={32} max={96} step={4} marks onChangeCommitted={this.setCellSize}/>
            <Typography gutterBottom>Width</Typography>
            <Slider defaultValue={this.size.width} valueLabelDisplay="auto" min={3} max={30} onChangeCommitted={this.setWidth}/>
            <Typography gutterBottom>Height</Typography>
            <Slider defaultValue={this.size.height} valueLabelDisplay="auto" min={3} max={30} onChangeCommitted={this.setHeight}/>
            <Typography gutterBottom>Left margin</Typography>
            <Slider defaultValue={this.margins.left} valueLabelDisplay="auto" min={0} max={10} onChangeCommitted={this.setLeftMargin}/>
            <Typography gutterBottom>Right margin</Typography>
            <Slider defaultValue={this.margins.right} valueLabelDisplay="auto" min={0} max={10} onChangeCommitted={this.setRightMargin}/>
            <Typography gutterBottom>Top margin</Typography>
            <Slider defaultValue={this.margins.top} valueLabelDisplay="auto" min={0} max={10} onChangeCommitted={this.setTopMargin}/>
            <Typography gutterBottom>Bottom margin</Typography>
            <Slider defaultValue={this.margins.bottom} valueLabelDisplay="auto" min={0} max={10} onChangeCommitted={this.setBottomMargin}/>
          </Box>
        </Grid>
        <Grid item xs={8}>
          <div id="canvas" style={{height: '1000px'}}></div>
        </Grid>
        <Grid item xs={2}>
          <ButtonGroup size="large" variant="contained" orientation="vertical">
            <Button color={this.state.value === "normal" ? "primary" : "default"} onClick={(e) => this.click("normal")}>Normal</Button>
            <Button color={this.state.value === "center" ? "primary" : "default"} onClick={(e) => this.click("center")}>Center</Button>
            <Button color={this.state.value === "corner" ? "primary" : "default"} onClick={(e) => this.click("corner")}>Corner</Button>
            <Button onClick={DrawUndo}>Undo</Button>
          </ButtonGroup>
        </Grid>
      </Grid>
      </Box>
    );
  }
}

export default App;
