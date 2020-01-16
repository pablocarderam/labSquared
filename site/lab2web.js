// *** //
// lab2web builds webs (mental maps) presenting current research.
// Read more at lab-squared.github.io
// Made by Pablo Cardenas, pablo-cardenas.com
//
// Based on JSNetworkX (http://jsnetworkx.org)
// Colors taken from color blind palette on
// http://www.cookbook-r.com/Graphs/Colors_(ggplot2)/
// which was developed by http://jfly.iam.u-tokyo.ac.jp/color/
// *** //

// Constants
const HYPOTHESIS = '#E69F00';
const METHODOLOGY = '#F0E442';

const SUPPORTED = '#009E73';
const DISPROVEN = '#D55E00';
const UNCLEAR = '#0072B2';

const ARCHIVED = '#3a3a3a';
const CURRENT = '#898989';
const FUTURE = '#dedede';

const ELLIPSE_PARAMS = {
  'cx':0,
  'cy':0,
  'rx':function(d) {
      return d.data.title.length*6+1;
  },
  'ry':20
};
const RECT_PARAMS = {
  'width':function(d) {
      return d.data.title.length*10+2;
  },
  'height':40,
  'x':function(d) {
      return -(d.data.title.length*10+2)/2;
  },
  'y':-20,
  'rx':20,
  'ry':10
};

// Classes
class ResearchLine {
  // Class defines an object containing information regarding a line of research
  // id: identifier, cannot contain commas
  // title: String-title of line of research
  // type: HYPOTHESIS/METHODOLOGY
  // status: SUPPORTED/DISPROVEN/UNCLEAR
  // activity: ARCHIVED/CURRENT/FUTURE
  // data: String-data and evidence collected
  // methods: String-methods used to collect and analyze data

  constructor(id, title, type, status, activity, data, methods, stylesheet) {
    this.id = id;
    this.title = title;
    this.type = type;
    this.status = status;
    this.activity = activity;
    this.data = data;
    this.methods = methods;
    this.stylesheet = stylesheet;
    if (data.search('OPEN:') == 0) {
      this.onClick = this.onClickExternal;
    }

    this.options = { // used by JSNetworkX
      title: title,
      type: type,
      status: status,
      activity: activity,
      data: data,
      methods: methods,
      onClick: this.onClick,
      stylesheet: this.stylesheet
    }

    this.connections = [];
  }

  connect(otherResearchLineID) {
    // Creates an edge (connection) between two lines of research
    this.connections.push(otherResearchLineID);
  }

  onClickExternal() {
    console.log(this.data);
    var researchLineInfo=window.open(this.data.substr('OPEN:'.length).trim()); // open external page
  }

  onClick() {
    // on click, show research line info
    var researchLineInfo=window.open('');
    researchLineInfo.document.write('<html><head><title>'+this.title+'</title><link rel="stylesheet" type="text/css" href="'+this.stylesheet+'"></head><body>');
    researchLineInfo.document.write("<div id='Research Line Title'><h1>" + this.title + "</h1><div>");
    researchLineInfo.document.write("<div id='Research Line Data'><h2>Data:</h2> " + this.data + "<div>");
    researchLineInfo.document.write("<div id='Research Line Methods'><h2>Methods:</h2> " + this.methods + "<div>");
    researchLineInfo.document.write('</body></html>');
  }
}

class ResearchWeb {
  // Container class for all ResearchLine objects
  constructor(filePath,stylesheet) {
    this.filePath = filePath;
    this.stylesheet = stylesheet;
  }

  load(web_div,node_shape="rect",sticky_drag=true,width=null,height=null,show_legend=true) {
    var this_web = this; // stores reference to this ResearchWeb object to be used inside onreadystatechange funciton
    // Read file
    var allText = '';
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", this.filePath, true);
    rawFile.onreadystatechange = function () {
      if(rawFile.readyState === 4) {
        if(rawFile.status === 200 || rawFile.status == 0) {
            allText = rawFile.responseText;
            this_web.buildFromInfo(allText);
            this_web.draw(web_div,node_shape,sticky_drag,width,height,show_legend);
        }
      }
    }

    rawFile.send(null);
  }

  buildFromInfo(str_input) {
    this.lines = []

    //var str_input = readTextFile(filePath);
    research = str_input.split('ID: ');

    for (var i = 0; i < research.length; i++) {
      if (research[i].search('\nTITLE: ') > 0) {
        var id = research[i].substr(0,research[i].search('\nTITLE: ')); // get property
        var title = research[i].substr( research[i].search('\nTITLE: ')+'\nTITLE: '.length,research[i].search('\nTYPE: ')-(research[i].search('\nTITLE: ')+'\nTITLE: '.length) ); // get property
        // evals used to access constants
        var type = eval( research[i].substr( research[i].search('\nTYPE: ')+'\nTYPE: '.length, research[i].search('\nSTATUS: ')-(research[i].search('\nTYPE: ')+'\nTYPE: '.length) ) );
        var status = eval( research[i].substr( research[i].search('\nSTATUS: ')+'\nSTATUS: '.length, research[i].search('\nACTIVITY')-(research[i].search('\nSTATUS: ')+'\nSTATUS: '.length) ) );
        var activity = eval( research[i].substr( research[i].search('\nACTIVITY: ')+'\nACTIVITY: '.length, research[i].search('\nDATA')-(research[i].search('\nACTIVITY: ')+'\nACTIVITY: '.length) ) );
        var data = research[i].substr( research[i].search('\nDATA: ')+'\nDATA: '.length, research[i].search('\nMETHODS')-(research[i].search('\nDATA: ')+'\nDATA: '.length) ).trim();
        var methods = research[i].substr( research[i].search('\nMETHODS: ')+'\nMETHODS: '.length, research[i].search('\nCONNECTIONS')-(research[i].search('\nMETHODS: ')+'\nMETHODS: '.length) );
        var connections = research[i].substr( research[i].search('\nCONNECTIONS:')+'\nCONNECTIONS:'.length ).trim() // to end of string

        var res = new ResearchLine(id, title, type, status, activity, data, methods, this.stylesheet)

        // connections:
        connections = connections.split(',');
        if (connections.length > 0) {
          for (var j = 0; j < connections.length; j++) {
            if (connections[j].length > 0) {
              res.connect(connections[j]);
            }
          }
        }

        this.lines.push(res)
      }
    }
  }

  draw(web_div,node_shape="rect",sticky_drag=true,width=null,height=null,show_legend=true) {
    // Draws graph using JSNetworkX and D3,
    // needs String argument with div ID reference,
    // node_shape either "ellipse" or "rect"
    // sticky_drag true/false

    var shape_params = ELLIPSE_PARAMS;
    if (node_shape==='rect') {
      shape_params = RECT_PARAMS;
    }

    if (show_legend) {
      document.getElementById(web_div).innerHTML = '<div id="'+web_div+'_canvas"></div><div id="'+web_div+'_legend">' + ["<center><b>Type</b> (text color): <font color=",HYPOTHESIS,">Hypothesis</font>, <font color=",METHODOLOGY,">Technology/Methodology</font>  <br> <b>Evidence</b> (fill color): <font color=",SUPPORTED,">Supports</font>, <font color=",DISPROVEN,">Disproves</font>, <font color=",UNCLEAR,">No evidence</font> <br><b>Activity</b> (edge color): <font color=",ARCHIVED,">Archived</font>, <font color=",CURRENT,">Current</font>, <font color=",FUTURE,">Future</font></center>"].join("") + '</div>'; // create divs with canvas and legend
    }

    var G = new jsnx.DiGraph();
    var edges = []; // used to graph edges
    var nchar = 0; // counts number of characters in titles

    for (var i = 0; i < this.lines.length; i++) {
      var n = this.lines[i]; // research line node
      G.addNode(n.id, n.options);

      nchar = nchar + n.title.length;

      if (n.connections.length > 0) {
        for (var j = 0; j < n.connections.length; j++) {
          edges.push( [ n.id, n.connections[j] ] )
        }
      }
    }

    G.addEdgesFrom(edges);

    jsnx.draw(G, {
      element: '#'+web_div+'_canvas',
      height:height,
      width:width,
      withLabels: true,
      labels: 'title',
      nodeShape: node_shape,
      nodeAttr: shape_params,
      edgeStyle: {
          'stroke-width': 6,
          stroke: '#000000',
          'fill-opacity': 0.6
      },
      nodeStyle: {
          'stroke-width': 5,
          fill: function(d) {
              return d.data.status;
          },
          stroke: function(d) {
              return d.data.activity;
          }
      },
      labelStyle: {
          'fill': function(d) {
              return d.data.type;
          }
      },
      layoutAttr: {
          charge: -2000,
          linkDistance: 75 + 5*nchar/this.lines.length + 5*edges.length
      },
      edgeOffset: 40,
      stickyDrag: sticky_drag
    });
  }
}

function lab2web(input_file,stylesheet,div_id,node_shape='rect',sticky_drag=true,width=null,height=null,show_legend=true) {
  /// Main method building and drawing everything
  var web = new ResearchWeb(input_file,stylesheet);
  web.load(div_id,node_shape,sticky_drag,width,height,show_legend);
}
