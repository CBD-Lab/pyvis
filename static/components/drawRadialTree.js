function drawRadialTree(data, radialTreeCount,kdoc) {
  var padding = { left: 80, right: 50, top: 20, bottom: 20 };
  var svg = d3.select("#graph")
    .attr("width", width + padding.left + padding.right)
    .attr("height", height + padding.top + padding.bottom)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  var pdfs = new Map();
  var gits = new Map();
  var pdfchange = 0;
  var gitchange = 0;

  // Tree diagram layout
  var tree = d3.tree()
    .size([2 * Math.PI, radius])
    .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth)

  var radius = width / 9;

  // Add initial coordinates x0 and y0 to the first node
  data.x0 = 0;
  data.y0 = 0;

  var data0 = data;

  // Redraw with the first node as the starting node.
  redraw(data);

  function redraw(source) {

    // (1) Calculate the position of nodes and connecting lines
    var root = tree(d3.hierarchy(source).sort((a, b) => d3.ascending(a.data.name, b.data.name)));
    // Application Layout, Calculation Nodes and Connectivity
    var nodes = root.descendants();
    var links = root.links();

    radialTreeCount.node = nodes.length;
    // Recalculate the y-coordinate of the node
    nodes.forEach(function (d) { d.y = d.depth * 120; });

    // (2) Handling of nodes

    // Get the update part of the node, the number is the same.
    var nodeUpdate = svg.selectAll(".node")
      .data(nodes, d => d.name);

    // Get the enter part of the node
    var nodeEnter = nodeUpdate.enter();

    // Get the exit part of the node
    var nodeExit = nodeUpdate.exit();

    // 1. Treatment of the Enter portion of a node
    var enterNodes = nodeEnter.append("g")
      .attr("class", "node")
      .attr("transform", d => `
                      rotate(${d.x * 180 / Math.PI - 90})
                      translate(${d.y},0)
                      `)
      .on("click", function (event, d) {
        if (d.data.name == 'd3') {
          toggle(data0);
          redraw(data0);
        }
        else {
          // Interactive processing: 1-equal and no true sums hide child nodes 2-equal 3-unequal, look further at child nodes
          for (var i = 0; i < data.children.length; i++) {
            if ((!data.children[i].children) && (!data.children[i]._children)) {
              if (data.children[i].name == d.data.name) {
                break;
              }
              else {
                continue;
              }
            }
            else {
              if (data.children[i].name == d.data.name) {
                toggle(data.children[i]);
                redraw(data);
                break;
              } else {
                if ((data.children[i]._children) && (!data.children[i].children)) continue;
                else
                  for (var j = 0; j < data.children[i].children.length; j++) {
                    if (data.children[i].children[j].name == d.data.name) {
                      toggle(data.children[i].children[j]);
                      redraw(data);
                      break;
                    }
                  }
              }
            }
          }
        }
      });

    enterNodes.append("circle")
      .attr("r", d => d.height * 4 + 3)
      .attr("fill", d => d.height != 0 ? "green" : "#fff")
      .on("mouseenter", (event, d) => {
        d3.select(this.d)
          .attr("stroke", "#555")
          .attr("stroke-width", 0.5);
        tooltip.html("1")
          .style("left", event.pageX + "px")
          .style("top", event.pageY + "px")
      })
      .on("mouseleave", (event, d) => {
        d3.select(this.d).attr("stroke", null);
        tooltip.style("visibility", 'false');
      });

    enterNodes.append("text")
      .attr("x", d => d.x < Math.PI === !d.children ? 14 : -14)
      .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
      .attr("stroke-width", 0.5)
      .attr("stroke", "#555")
      .attr("font-size", 12)
      .text(d => d.data.name)
      .attr("font-family", "Consolas")
      .attr("transform", d => `
            rotate(${d.x >= Math.PI ? 180 : 0})
          `)
      .attr("font-weight", "bold")
      .attr("cursor", "pointer");

    svg.selectAll("text")
      .on("click", (d, i) => {
        var fullname = i.data.name.split('.', 1)[0];
        var point = i;
          while (point.depth >= 0 && point.parent) {
            point = point.parent;
            console.log("point:",point.data.name);
            fullname = point.data.name + '.' + fullname;
          }
            kdoc.moduledir=fullname;
            kdoc.classname='';
            var keyword = {
                classname: '',
                moduledir: fullname
                };
            var keywordJson = JSON.stringify(keyword);
        fetch('http://127.0.0.1:5006/codeDoc?wanted=' + keywordJson)
          .then(response => response.json())
          .then(data => {
            const language = 'python';
            const highlightedCode = Prism.highlight(data.code, Prism.languages[language], language);
            var tips = d3.select("body")
              .append("div")
              .attr("class", "popup");

            tips.append("span")
              .attr("class", "close")
              .attr("color", "red")
              .text("x")
              .on("click", () => {
                tips.remove();
              });

            tips.append("div")
              .attr("class", "content")
              .html('<pre><code class="language-python">' + highlightedCode + '</code></pre>');
          })
          .catch(error => {
            console.error('Error executing Python script:', error);
          });
      })
      .on("mouseover", function (event, d) {
        var fullname = d.data.name.split('.', 1)[0];
        var point = d;
        while (point.depth >= 0 && point.parent) {
          point = point.parent;
          console.log("point:",point.data.name);
          fullname = point.data.name + '.' + fullname;
        }
        if(fullname.substring(0,2)=='nn')
        {
          fullname="torch."+fullname;
        }
        fullname = fullname + ".py";
        d3.select(this)
          .transition()
          .duration(300)
          .text(d => fullname)

      })
      .on("mouseout", function (event, d) {
        d3.select(this)
          .text(d => d.data.name)
      });

enterNodes
.each(function(d) {
  if(d.data.linkAll && typeof( d.data.linkAll['pdfClass']) !== "undefined" && Object.keys(d.data.linkAll['pdfClass']).length > 0)
  {
      for (key in d.data.linkAll['pdfClass']){
          pdfs.set(key,d.data.linkAll['pdfClass'][key]);
      }
  }
  if(d.data.linkAll && typeof( d.data.linkAll['gitClass']) !== "undefined" && Object.keys(d.data.linkAll['gitClass']).length > 0)
  {
      for (key in d.data.linkAll['gitClass']){
          gits.set(key,d.data.linkAll['gitClass'][key]);
      }
  }
  if (d.data.linkAll && typeof(d.data.linkAll["pdfModule"]) !== "undefined" && d.data.linkAll["pdfModule"].length > 0)
  {
      var fullname = d.data.name.split('.', 1)[0];
      var point = d;
      while (point.depth >= 0 && point.parent) {
          point = point.parent;
          fullname = point.data.name + '.' + fullname;
      }
      fullname = fullname;
      pdfs.set(fullname,d.data.linkAll['pdfModule'][0])
  }

});

d3.select("input[id=showPdf5]").on("change", function () {
  console.log('showpdf',gits);
  if (pdfchange == 0)
    pdfchange = 1;
  else
    pdfchange = 0;
    if(pdfchange==1){
          var pdfinfo = d3.select('#svgbox').append("div")
                      .attr("class", "tooltip")
                      .attr('id','pdfshow5')
                      .style("left", (width * 0.2) + "px")
                      .style("top", (height * 0.15) + "px")
                      .style("background-color", "white")
                      .style("border-radius", "5px")
                      .style("padding", "5px")
                      .style("box-shadow", "0px 2px 4px rgba(0, 0, 0, 0.1)")
                      .style('list-style','none');

          pdfinfo.append("foreignObject")
                  .attr("height", "12px")
                  .append("xhtml:div")
                  .style("display", "flex")
                  .style("align-items", "center")
                  .style("margin", 0)
                  .style("padding", 0)
                  .html('<img src="http://127.0.0.1:5006/get_svg/pdf.svg" style="width: 8px; height: 15px; margin-right: 5px;"/>')
                  .append("span")
                  .attr("class", "close")
                  .attr("color", "red")
                  .text("x")
                  .style("position", "absolute")
                  .style('right',"0")
                  .on("click", () => {
                    pdfinfo.remove();
                    d3.select("input#showPdf5").property("checked", false);
                    pdfchange = 0;
                  });
          if (pdfs.size == 0){
              pdfinfo.append('text')
                  .attr("stroke-family", "FangSong")
                  .attr("font-size", "10px")
                  .text("no PDF!");
          }
          else{
              pdfs.forEach((value, key) => {
                  console.log('vk', value, key);
                  pdfinfo.append('text')
                      .attr("stroke-family", "FangSong")
                      .attr("font-size", "10px")
                      .text(key)
                      .on("click",function()
                      {
                          pdfgitclick(key);
                      });
                  pdfinfo.append('br');
              });
          }
      }
      else{
          d3.select('#pdfshow5').remove();
      }
});
d3.select("input[id=showGit5]").on("change", function () {
  console.log('sp',gits);
  if (gitchange == 0)
    gitchange = 1;
  else
    gitchange = 0;
    if(gitchange==1){
          var gitinfo = d3.select('#svgbox').append("div")
                      .attr("class", "tooltip")
                      .attr('id','gitshow5')
                      .style("left", (width * 0.2) + "px")
                      .style("top", (height * 0.15) + "px")
                      .style("background-color", "white")
                      .style("border-radius", "5px")
                      .style("padding", "5px")
                      .style("box-shadow", "0px 2px 4px rgba(0, 0, 0, 0.1)")
                      .style('list-style','none');
          gitinfo.append("foreignObject")
                  .attr("height", "12px")
                  .append("xhtml:div")
                  .style("display", "flex")
                  .style("align-items", "center")
                  .style("margin", 0)
                  .style("padding", 0)
                  .html('<img src="http://127.0.0.1:5006/get_svg/github.svg" style="width: 10px; height: 10px; margin-right: 5px;"/>')
                  .append("span")
                  .attr("class", "close")
                  .attr("color", "red")
                  .text("x")
                  .style("position", "absolute")
                  .style('right',"0")
                  .on("click", () => {
                    gitinfo.remove();
                    d3.select("input#showGit5").property("checked", false);
                    gitchange = 0;
                  });
          if (gits.size == 0){
              gitinfo.append('text')
                  .attr("stroke-family", "FangSong")
                  .attr("font-size", "10px")
                  .text("no GitHub files !");
          }
          else{
              gits.forEach((value, key) => {
                  console.log('vk', value, key);
                  gitinfo.append('text')
                      .attr("stroke-family", "FangSong")
                      .attr("font-size", "10px")
                      .text(key)
                      .on("click",function()
                      {
                          pdfgitclick(key);
                      });
                  gitinfo.append('br');
              });
          }
      }
      else{
          d3.select('#gitshow5').remove();
      }
});

function pdfgitclick(classname){
  console.log('pgc',classname);
  fetch('http://127.0.0.1:5006/classVariable?wanted=' + classname)
  .then(response => response.json())
  .then(data => {
      var tips = d3.select("body")
                  .append("div")
                  .attr("class","popup")
                  .style("width", "500px")
      var drag=d3.drag()
                  .on("start", function (event) {
                      // Record the position at the start of the drag
                      var startX = event.x;
                      var startY = event.y;

                      // Get the position of the current cue box
                      var currentLeft = parseFloat(tips.style("left"));
                      var currentTop = parseFloat(tips.style("top"));

                      // Calculate the mouse offset relative to the upper-left corner of the cue box
                      offsetX = startX - currentLeft;
                      offsetY = startY - currentTop;
                  })
                  .on("drag", function (event) {
                  // Update cue box position with mouse movement
                      tips.style("left", (event.x - offsetX) + "px")
                          .style("top", (event.y - offsetY) + "px");
                  });

      // Bind the drag behavior to the element to be dragged
      tips.call(drag);
      var closeButton=tips.append("span")
                .attr("class","close")
                .attr("color","red")
                .text("x")
                .on("click",function(){
                d3.select(".popup").remove();
                });
      // Setting the Close Button Position
      closeButton.style("position", "fixed")
                .style("top", "0")
                .style("left", "0");
      var contentContainer = tips.append("div").attr("class", "content-container");
      var tableContainer = contentContainer.append("table").attr("class", "var-fun-container var-fun-container table-style");
      var tableHeader = tableContainer.append("thead").append("tr");
      tableHeader.append("th").text("Variable");  // Table header column 1
      tableHeader.append("th").text("Function");  // Table header column 2

      var tableBody = tableContainer.append("tbody"); // Creating the main part of the form
      var row = tableBody.append("tr");  // Create a line
      row.append("td").attr("class", "contentVar").style("color", "green").html(data['var'].join("<br>"));  // first column
      row.append("td").attr("class", "contentFun").style("color", "blue").html(data['fun'].join("<br>"));  // second column
      var docContainer = tips.append("div").attr("class", "contentDoc-container");
      var textWithLinks = data['doc'];
      var linkRegex = /(\bhttps?:\/\/\S+\b)/g;  // \b matches word boundaries, \s looks for blank characters
      //                    var linkRegex = /(\bhttps?:\/\/\S+?(?=\s|<|\|$))/g

      var textWithFormattedLinks = linkRegex?textWithLinks.replace(linkRegex, '<a href="$1" target="_blank">$1</a>'):'';

      docContainer.append("div")
          .attr("class", "contentDoc")
          .style("white-space", "pre-line")
          .html(textWithFormattedLinks);
      tips.append("div")
          .attr("class","contentPdf")
          .html(data['pdf']+"<br>")
  })
  .catch(error => {
      console.error('Error executing Python script:', error);
  });
}
    // 2. Handling of the Update portion of a node
    var updateNodes = nodeUpdate.transition()
      .duration(2)
      .attr("transform", d => `
                rotate(${d.x * 180 / Math.PI - 90})
                translate(${d.y},0)
                `)

    updateNodes.select("circle")
      .attr("r", 6)
      .attr("fill", d => d._children ? "orange" : "#fff");

    // 3. Treatment of the Exit portion of a node
    var exitNodes = nodeExit.transition()
      .duration(2)
      .attr("transform", d => `
                    rotate(${d.x * 180 / Math.PI - 90})
                    translate(${d.y},0)
                    `)
      .remove();

    exitNodes.select("circle")
      .attr("r", 0);
    /*
    (3) Handling of linkages
    */
    // Get the update part of the link
    var linkUpdate = svg.selectAll(".link")
      .data(links, d => d.target.name);

    // Get the enter part of the link
    var linkEnter = linkUpdate.enter();

    // Get the exit part of the link
    var linkExit = linkUpdate.exit();

    // 1. Treatment of the Enter part of the link
    linkEnter.insert("path", ".node")
      .attr("class", "link")
      .attr("d",
        d3.linkRadial()
          .angle(d => d.x)
          .radius(d => d.y))
      .transition()
      .duration(2)
      .attr("d", d3.linkRadial()
        .angle(d => d.x)
        .radius(d => d.y))
      .attr("fill", "none");

    // 2. Treatment of the Update part of the link
    linkUpdate.transition()
      .duration(2)
      .attr("d", d3.linkRadial()
        .angle(d => d.x)
        .radius(d => d.y));

    // 3. Treatment of the Exit portion of the linkage
    linkExit.transition()
      .duration(2)
      .attr("d",
        d3.linkRadial()
          .angle(d => d.x)
          .radius(d => d.y))
      .remove();

    /*
    (4) Save the current node coordinates in the variables x0, y0 for updates
    */
    nodes.forEach(function (d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });
    // Update the text color of a node
    updateTextColors();
  }
  function updateTextColors() {
    // Select all text elements and set the text color according to whether they have child nodes or not
    svg.selectAll("text")
      .style("fill",
        d => (d.children || d._children) ? "green" : "#000" // 具有子节点的文本颜色设置为绿色，否则为黑色
      );
  }

  // Toggle switch, d is the clicked node
  function toggle(dd) {
    if (dd.children) {  // If there are child nodes
      dd._children = dd.children;  // Save this child node to _children
      dd.children = null;  // Set child node to null

    } else {  // If there are no child nodes
      dd.children = dd._children;  // Retrieve the original child node from _children
      dd._children = null;  // Set _children to null
    }
  }

}

window.onDrawRadialTreeReady = function (data, radialTreeCount,kdoc) {
  // Execution of drawing logic
  drawRadialTree(data, radialTreeCount,kdoc);
}function drawRadialTree(data, radialTreeCount,kdoc) {
  var padding = { left: 80, right: 50, top: 20, bottom: 20 };
  var svg = d3.select("#graph")
    .attr("width", width + padding.left + padding.right)
    .attr("height", height + padding.top + padding.bottom)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  var pdfs = new Map();
  var gits = new Map();
  var pdfchange = 0;
  var gitchange = 0;

  // Tree diagram layout
  var tree = d3.tree()
    .size([2 * Math.PI, radius])
    .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth)

  var radius = width / 9;

  // Add initial coordinates x0 and y0 to the first node
  data.x0 = 0;
  data.y0 = 0;

  var data0 = data;

  // Redraw with the first node as the starting node.
  redraw(data);

  function redraw(source) {

    // (1) Calculate the position of nodes and connecting lines
    var root = tree(d3.hierarchy(source).sort((a, b) => d3.ascending(a.data.name, b.data.name)));
    // Application Layout, Calculation Nodes and Connectivity
    var nodes = root.descendants();
    var links = root.links();

    radialTreeCount.node = nodes.length;
    // Recalculate the y-coordinate of the node
    nodes.forEach(function (d) { d.y = d.depth * 120; });

    // (2) Handling of nodes

    // Get the update part of the node, the number is the same.
    var nodeUpdate = svg.selectAll(".node")
      .data(nodes, d => d.name);

    // Get the enter part of the node
    var nodeEnter = nodeUpdate.enter();

    // Get the exit part of the node
    var nodeExit = nodeUpdate.exit();

    // 1. Treatment of the Enter portion of a node
    var enterNodes = nodeEnter.append("g")
      .attr("class", "node")
      .attr("transform", d => `
                      rotate(${d.x * 180 / Math.PI - 90})
                      translate(${d.y},0)
                      `)
      .on("click", function (event, d) {
        if (d.data.name == 'd3') {
          toggle(data0);
          redraw(data0);
        }
        else {
          // Interactive processing: 1-equal and no true sums hide child nodes 2-equal 3-unequal, look further at child nodes
          for (var i = 0; i < data.children.length; i++) {
            if ((!data.children[i].children) && (!data.children[i]._children)) {
              if (data.children[i].name == d.data.name) {
                break;
              }
              else {
                continue;
              }
            }
            else {
              if (data.children[i].name == d.data.name) {
                toggle(data.children[i]);
                redraw(data);
                break;
              } else {
                if ((data.children[i]._children) && (!data.children[i].children)) continue;
                else
                  for (var j = 0; j < data.children[i].children.length; j++) {
                    if (data.children[i].children[j].name == d.data.name) {
                      toggle(data.children[i].children[j]);
                      redraw(data);
                      break;
                    }
                  }
              }
            }
          }
        }
      });

    enterNodes.append("circle")
      .attr("r", d => d.height * 4 + 3)
      .attr("fill", d => d.height != 0 ? "green" : "#fff")
      .on("mouseenter", (event, d) => {
        d3.select(this.d)
          .attr("stroke", "#555")
          .attr("stroke-width", 0.5);
        tooltip.html("1")
          .style("left", event.pageX + "px")
          .style("top", event.pageY + "px")
      })
      .on("mouseleave", (event, d) => {
        d3.select(this.d).attr("stroke", null);
        tooltip.style("visibility", 'false');
      });

    enterNodes.append("text")
      .attr("x", d => d.x < Math.PI === !d.children ? 14 : -14)
      .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
      .attr("stroke-width", 0.5)
      .attr("stroke", "#555")
      .attr("font-size", 12)
      .text(d => d.data.name)
      .attr("font-family", "Consolas")
      .attr("transform", d => `
            rotate(${d.x >= Math.PI ? 180 : 0})
          `)
      .attr("font-weight", "bold")
      .attr("cursor", "pointer");

    svg.selectAll("text")
      .on("click", (d, i) => {
        var fullname = i.data.name.split('.', 1)[0];
        var point = i;
          while (point.depth >= 0 && point.parent) {
            point = point.parent;
            console.log("point:",point.data.name);
            fullname = point.data.name + '.' + fullname;
          }
            kdoc.moduledir=fullname;
            kdoc.classname='';
            var keyword = {
                classname: '',
                moduledir: fullname
                };
            var keywordJson = JSON.stringify(keyword);
        fetch('http://127.0.0.1:5006/codeDoc?wanted=' + keywordJson)
          .then(response => response.json())
          .then(data => {
            const language = 'python';
            const highlightedCode = Prism.highlight(data.code, Prism.languages[language], language);
            var tips = d3.select("body")
              .append("div")
              .attr("class", "popup");

            tips.append("span")
              .attr("class", "close")
              .attr("color", "red")
              .text("x")
              .on("click", () => {
                tips.remove();
              });

            tips.append("div")
              .attr("class", "content")
              .html('<pre><code class="language-python">' + highlightedCode + '</code></pre>');
          })
          .catch(error => {
            console.error('Error executing Python script:', error);
          });
      })
      .on("mouseover", function (event, d) {
        var fullname = d.data.name.split('.', 1)[0];
        var point = d;
        while (point.depth >= 0 && point.parent) {
          point = point.parent;
          console.log("point:",point.data.name);
          fullname = point.data.name + '.' + fullname;
        }
        if(fullname.substring(0,2)=='nn')
        {
          fullname="torch."+fullname;
        }
        fullname = fullname + ".py";
        d3.select(this)
          .transition()
          .duration(300)
          .text(d => fullname)

      })
      .on("mouseout", function (event, d) {
        d3.select(this)
          .text(d => d.data.name)
      });

enterNodes
.each(function(d) {
  if(d.data.linkAll && typeof( d.data.linkAll['pdfClass']) !== "undefined" && Object.keys(d.data.linkAll['pdfClass']).length > 0)
  {
      for (key in d.data.linkAll['pdfClass']){
          pdfs.set(key,d.data.linkAll['pdfClass'][key]);
      }
  }
  if(d.data.linkAll && typeof( d.data.linkAll['gitClass']) !== "undefined" && Object.keys(d.data.linkAll['gitClass']).length > 0)
  {
      for (key in d.data.linkAll['gitClass']){
          gits.set(key,d.data.linkAll['gitClass'][key]);
      }
  }
  if (d.data.linkAll && typeof(d.data.linkAll["pdfModule"]) !== "undefined" && d.data.linkAll["pdfModule"].length > 0)
  {
      var fullname = d.data.name.split('.', 1)[0];
      var point = d;
      while (point.depth >= 0 && point.parent) {
          point = point.parent;
          fullname = point.data.name + '.' + fullname;
      }
      fullname = fullname;
      pdfs.set(fullname,d.data.linkAll['pdfModule'][0])
  }

});

d3.select("input[id=showPdf5]").on("change", function () {
  console.log('showpdf',gits);
  if (pdfchange == 0)
    pdfchange = 1;
  else
    pdfchange = 0;
    if(pdfchange==1){
          var pdfinfo = d3.select('#svgbox').append("div")
                      .attr("class", "tooltip")
                      .attr('id','pdfshow5')
                      .style("left", (width * 0.2) + "px")
                      .style("top", (height * 0.15) + "px")
                      .style("background-color", "white")
                      .style("border-radius", "5px")
                      .style("padding", "5px")
                      .style("box-shadow", "0px 2px 4px rgba(0, 0, 0, 0.1)")
                      .style('list-style','none');

          pdfinfo.append("foreignObject")
                  .attr("height", "12px")
                  .append("xhtml:div")
                  .style("display", "flex")
                  .style("align-items", "center")
                  .style("margin", 0)
                  .style("padding", 0)
                  .html('<img src="http://127.0.0.1:5006/get_svg/pdf.svg" style="width: 8px; height: 15px; margin-right: 5px;"/>')
                  .append("span")
                  .attr("class", "close")
                  .attr("color", "red")
                  .text("x")
                  .style("position", "absolute")
                  .style('right',"0")
                  .on("click", () => {
                    pdfinfo.remove();
                    d3.select("input#showPdf5").property("checked", false);
                    pdfchange = 0;
                  });
          if (pdfs.size == 0){
              pdfinfo.append('text')
                  .attr("stroke-family", "FangSong")
                  .attr("font-size", "10px")
                  .text("no PDF!");
          }
          else{
              pdfs.forEach((value, key) => {
                  console.log('vk', value, key);
                  pdfinfo.append('text')
                      .attr("stroke-family", "FangSong")
                      .attr("font-size", "10px")
                      .text(key)
                      .on("click",function()
                      {
                          pdfgitclick(key);
                      });
                  pdfinfo.append('br');
              });
          }
      }
      else{
          d3.select('#pdfshow5').remove();
      }
});
d3.select("input[id=showGit5]").on("change", function () {
  console.log('sp',gits);
  if (gitchange == 0)
    gitchange = 1;
  else
    gitchange = 0;
    if(gitchange==1){
          var gitinfo = d3.select('#svgbox').append("div")
                      .attr("class", "tooltip")
                      .attr('id','gitshow5')
                      .style("left", (width * 0.2) + "px")
                      .style("top", (height * 0.15) + "px")
                      .style("background-color", "white")
                      .style("border-radius", "5px")
                      .style("padding", "5px")
                      .style("box-shadow", "0px 2px 4px rgba(0, 0, 0, 0.1)")
                      .style('list-style','none');
          gitinfo.append("foreignObject")
                  .attr("height", "12px")
                  .append("xhtml:div")
                  .style("display", "flex")
                  .style("align-items", "center")
                  .style("margin", 0)
                  .style("padding", 0)
                  .html('<img src="http://127.0.0.1:5006/get_svg/github.svg" style="width: 10px; height: 10px; margin-right: 5px;"/>')
                  .append("span")
                  .attr("class", "close")
                  .attr("color", "red")
                  .text("x")
                  .style("position", "absolute")
                  .style('right',"0")
                  .on("click", () => {
                    gitinfo.remove();
                    d3.select("input#showGit5").property("checked", false);
                    gitchange = 0;
                  });
          if (gits.size == 0){
              gitinfo.append('text')
                  .attr("stroke-family", "FangSong")
                  .attr("font-size", "10px")
                  .text("no GitHub files !");
          }
          else{
              gits.forEach((value, key) => {
                  console.log('vk', value, key);
                  gitinfo.append('text')
                      .attr("stroke-family", "FangSong")
                      .attr("font-size", "10px")
                      .text(key)
                      .on("click",function()
                      {
                          pdfgitclick(key);
                      });
                  gitinfo.append('br');
              });
          }
      }
      else{
          d3.select('#gitshow5').remove();
      }
});

function pdfgitclick(classname){
  console.log('pgc',classname);
  fetch('http://127.0.0.1:5006/classVariable?wanted=' + classname)
  .then(response => response.json())
  .then(data => {
      var tips = d3.select("body")
                  .append("div")
                  .attr("class","popup")
                  .style("width", "500px")
      var drag=d3.drag()
                  .on("start", function (event) {
                      // Record the position at the start of the drag
                      var startX = event.x;
                      var startY = event.y;

                      // Get the position of the current cue box
                      var currentLeft = parseFloat(tips.style("left"));
                      var currentTop = parseFloat(tips.style("top"));

                      // Calculate the mouse offset relative to the upper-left corner of the cue box
                      offsetX = startX - currentLeft;
                      offsetY = startY - currentTop;
                  })
                  .on("drag", function (event) {
                  // Update cue box position with mouse movement
                      tips.style("left", (event.x - offsetX) + "px")
                          .style("top", (event.y - offsetY) + "px");
                  });

      // Bind the drag behavior to the element to be dragged
      tips.call(drag);
      var closeButton=tips.append("span")
                .attr("class","close")
                .attr("color","red")
                .text("x")
                .on("click",function(){
                d3.select(".popup").remove();
                });
      // Setting the Close Button Position
      closeButton.style("position", "fixed")
                .style("top", "0")
                .style("left", "0");
      var contentContainer = tips.append("div").attr("class", "content-container");
      var tableContainer = contentContainer.append("table").attr("class", "var-fun-container var-fun-container table-style");
      var tableHeader = tableContainer.append("thead").append("tr");
      tableHeader.append("th").text("Variable");  // Table header column 1
      tableHeader.append("th").text("Function");  // Table header column 2

      var tableBody = tableContainer.append("tbody"); // Creating the main part of the form
      var row = tableBody.append("tr");  // Create a line
      row.append("td").attr("class", "contentVar").style("color", "green").html(data['var'].join("<br>"));  // first column
      row.append("td").attr("class", "contentFun").style("color", "blue").html(data['fun'].join("<br>"));  // second column
      var docContainer = tips.append("div").attr("class", "contentDoc-container");
      var textWithLinks = data['doc'];
      var linkRegex = /(\bhttps?:\/\/\S+\b)/g;  // \b matches word boundaries, \s looks for blank characters
      //                    var linkRegex = /(\bhttps?:\/\/\S+?(?=\s|<|\|$))/g

      var textWithFormattedLinks = linkRegex?textWithLinks.replace(linkRegex, '<a href="$1" target="_blank">$1</a>'):'';

      docContainer.append("div")
          .attr("class", "contentDoc")
          .style("white-space", "pre-line")
          .html(textWithFormattedLinks);
      tips.append("div")
          .attr("class","contentPdf")
          .html(data['pdf']+"<br>")
  })
  .catch(error => {
      console.error('Error executing Python script:', error);
  });
}
    // 2. Handling of the Update portion of a node
    var updateNodes = nodeUpdate.transition()
      .duration(2)
      .attr("transform", d => `
                rotate(${d.x * 180 / Math.PI - 90})
                translate(${d.y},0)
                `)

    updateNodes.select("circle")
      .attr("r", 6)
      .attr("fill", d => d._children ? "orange" : "#fff");

    // 3. Treatment of the Exit portion of a node
    var exitNodes = nodeExit.transition()
      .duration(2)
      .attr("transform", d => `
                    rotate(${d.x * 180 / Math.PI - 90})
                    translate(${d.y},0)
                    `)
      .remove();

    exitNodes.select("circle")
      .attr("r", 0);
    /*
    (3) Handling of linkages
    */
    // Get the update part of the link
    var linkUpdate = svg.selectAll(".link")
      .data(links, d => d.target.name);

    // Get the enter part of the link
    var linkEnter = linkUpdate.enter();

    // Get the exit part of the link
    var linkExit = linkUpdate.exit();

    // 1. Treatment of the Enter part of the link
    linkEnter.insert("path", ".node")
      .attr("class", "link")
      .attr("d",
        d3.linkRadial()
          .angle(d => d.x)
          .radius(d => d.y))
      .transition()
      .duration(2)
      .attr("d", d3.linkRadial()
        .angle(d => d.x)
        .radius(d => d.y))
      .attr("fill", "none");

    // 2. Treatment of the Update part of the link
    linkUpdate.transition()
      .duration(2)
      .attr("d", d3.linkRadial()
        .angle(d => d.x)
        .radius(d => d.y));

    // 3. Treatment of the Exit portion of the linkage
    linkExit.transition()
      .duration(2)
      .attr("d",
        d3.linkRadial()
          .angle(d => d.x)
          .radius(d => d.y))
      .remove();

    /*
    (4) Save the current node coordinates in the variables x0, y0 for updates
    */
    nodes.forEach(function (d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });
    // Update the text color of a node
    updateTextColors();
  }
  function updateTextColors() {
    // Select all text elements and set the text color according to whether they have child nodes or not
    svg.selectAll("text")
      .style("fill",
        d => (d.children || d._children) ? "green" : "#000" // 具有子节点的文本颜色设置为绿色，否则为黑色
      );
  }

  // Toggle switch, d is the clicked node
  function toggle(dd) {
    if (dd.children) {  // If there are child nodes
      dd._children = dd.children;  // Save this child node to _children
      dd.children = null;  // Set child node to null

    } else {  // If there are no child nodes
      dd.children = dd._children;  // Retrieve the original child node from _children
      dd._children = null;  // Set _children to null
    }
  }

}

window.onDrawRadialTreeReady = function (data, radialTreeCount,kdoc) {
  // Execution of drawing logic
  drawRadialTree(data, radialTreeCount,kdoc);
}