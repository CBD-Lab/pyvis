function drawTree(data,treecount,kdoc,showFile){
     let tooltiptree = d3.select('body')
                            .append('div')
                            .attr("id", "tiptree") // Adding the ID attribute
                            .style('position', 'absolute')
                            .style('z-index', '25')
                            .style('color', 'black')
                            .style('color', 'black')
                            .style('font-size', '12px')
                            .style("background-color","#AAF")
                            .style("opacity",0.8)
                            .style("stroke-width",0.5)
                            .style("border-radius", "2px")
                            .style("width",30)
                            .style("height",100);

     var svg = d3.select("#graph")
//                .style("margin-left", 100 + "px")
                .attr("width", width*0.85)
                .attr("height", height)
                .on("click", function () {
                     d3.select("#miniTree").remove();
                });
     var tree=d3.tree()
               .size([height,width*0.7]);
     var hi=d3.hierarchy(data);
     var root=tree(hi);
     var links=root.links();
     var nodes=root.descendants();
     var i=0, duration=750;
     initData(root);
   /********************* 2. Data initialization binding (including data updates) *********************/
    function initData(root) {
      // Sets the initial position of the first element
      root.x0 = height / 2;
      root.y0 = 100;
      root._children=[];
      // Calculate the total number of nodes
      const totalNodes = countNodes(root);
      var filecount=updateFileCount(root)
      treecount.treeNodeCount=totalNodes;
      if(filecount>0){
          hasFile=1;
          collapseAllNodesByFile(root);}
      else if(filecount<1&&totalNodes>200)
      {
        hasFile=0;
        pretendFileCount(root,totalNodes)
        updateFileCount(root)
        collapseAllNodesByFile(root);
      }
      // 更新节点状态
      updateChart(root);
    }
/********************************* Update the number of node files for the entire tree structure **************************/
function updateFileCount(node)
{
    if(!node.data.fileCount)
        {
            node.data.fileCount=0;
        }
    if(node.children)
    {
        node.children.forEach(function (child) {
        node.data.fileCount=updateFileCount(child)+node.data.fileCount
        })
    }
    return node.data.fileCount
}

/********************* Calculate the total number of nodes in the tree *********************/
function countNodes(node) {
  let count = 1;  // Initially 1, including the current node
  if (node.children) {
    node.children.forEach(function (child) {
      count += countNodes(child);  // Recursively calculate the total number of child nodes
    });
  }
  return count;
}
/********************* When the number of files is 0 and there are too many nodes,
the number of files is simulated according to the probability value. *********************/
function pretendFileCount(node,totalNodes)
{
    if(node.children)
    {
         node.children.forEach(function (child) {
            pretendFileCount(child,totalNodes);  // Recursively process child nodes and pass additional parameters
    });
    }

    else if(Math.random() < 50/totalNodes&node.height==0)
    {
        node.data.fileCount=1;
    }
    else{
        node.data.fileCount=0;
    }
}
/********************* Randomly close nodes based on the number of nodes in the tree *********************/
function collapseAllNodesByProbability(node,totalNodes) {
  if (node.children) {
     node.children.forEach(function (child) {
      collapseAllNodesByProbability(child, totalNodes); // Recursively process child nodes and pass additional parameters
    });
    // Decide whether to put away nodes based on probabilistic properties
    if (Math.random() > 100/totalNodes&node.depth!=0) {
      node._children = node.children;  // Move child nodes into _children
      node._children.forEach(function (child) {
      collapseAllNodesByProbability(child, totalNodes);  // Recursively process child nodes and pass additional parameters
    });
      node.children = null;  // Clear children
    }
  }
}
// Remove in parent node based on node name
function removeNodeByName(parent,nodeName)
{
    parent.children=parent.children.filter(child=>child.data.name!==nodeName);
    parent.data.children=parent.data.children.filter(datachild=>datachild.name!=nodeName);
    // Problem 2 appears here, you can not set the children nodes inside the children as an empty array,
    // must be set to null otherwise you can not use d3.tree()
    if(parent.children.length==0)
    {
        parent.children=null;
        parent.data.children=null;
    }
}

/********************* Depending on whether the nodes of the tree and their children contain file closure nodes *********************/
function collapseAllNodesByFile(node) {
    if (node.children) {
    // Create a copy of the children array
    const childrenCopy = node.children.slice();
    childrenCopy.forEach(function (child) {
      collapseAllNodesByFile(child);  // Recursively process child nodes and pass additional parameters
    });
  }

  if (!node.data.fileCount) {
    node.data.fileCount = 0;
  }

  // Currently the current node is considered as a child node to consider whether or not to put away,
  // the initial setup if the current node tree has no files to put away
  if (node.data.fileCount === 0 && node.parent) {
    // Put away the node
    var parent = node.parent;
    removeNodeByName(parent, node.data.name);

    if (!parent._children) {
      parent._children = [];
    }

    parent._children.push(node);
  }
}

/********************* Updating the height of the tree *********************/
function updateHeight(node)
{
  let height = 0; // The initial value is set to 0
  if(!node.children)// Either all child nodes are hidden or there are no child nodes, display height is 0
  {
//    node._height=0;
    node.height=0
    return 0;
  }
  else  // The current node has children and an expanded node.
  {
     node.children.forEach(function (child) {
     height=Math.max(height,1+updateHeight(child));  // Iterate over all child nodes plus one to get maximum height
    });
//    node._height=height;
    node.height=height;
    return height;
    }
  }
/********************* link interaction and drawing  *********************/
function updateLinks(source, links) {
  // Updated data
  var link = svg.selectAll("path.link").data(links, function (d) {
    return d.id;
  });

  // Add the enter operation to add a path element with the class name link.
  var linkEnter = link
    .enter()
    .insert("path", "g")
    .attr("class", "link")
    .attr("fill","none")
    // The default position is the position of the current parent node
    .attr("d", function (d) {
      var o = {
        x: source.x0,
        y: source.y0
      };
      return diagonal(o, o);
    });

  // Get the update set
  var linkUpdate = linkEnter.merge(link);

  // Updated to add transition animation
  linkUpdate
    .transition()
    .duration(duration)
    .attr("d", function (d) {
      return diagonal(d, d.parent);
    });

  // Getting the exit set
  var linkExit = link
    .exit()
    .transition()
    .duration(duration)
    .attr("d", function (d) {
      var o = {
        x: source.x,
        y: source.y
      };
      return diagonal(o, o);
    })
    .remove();
}

/********************* node interaction and drawing  *********************/
function updateNodes(source, nodes) {
  var mynode = svg.selectAll("g.node").data(nodes, function (d,i) {
      if(d.id)
      {
        return d.id
      }
      else{
        var fullname = d.data.name;
        var point=d;
                    while(point.depth>=0&& point.parent)
                        {
                            point=point.parent;
                            if(!(point.data.name=='package'&&point.depth==0)){//delete the first layer"package." pylibstree
                                fullname = point.data.name + '.' + fullname;
                            }
                        }
        d.id=fullname
        return d.id
        }
  });
  // Add the enter operation to add a group element with class name node.
  var nodeEnter = mynode
    .enter()
    .append("g")
    .attr("class", "node")
    .attr("transform", function (d) {
      return "translate(" + (source.y0+200) + "," + source.x0 + ")";
    });


  // Adds a cycle element to each newly added group element.
    nodeEnter
     .append("path")
     .attr("class","node")
     .attr("d", function(d) {
      var endcase = (d.data.name).split('.')[1];
      if (endcase == 'py'){
          return d3.symbol().type(d3.symbols[0])();
      }
      else if (endcase == 'pyi'){
          return d3.symbol().type(d3.symbols[1])();
      }
      else if (endcase == 'dll'){
          return d3.symbol().type(d3.symbols[2])();
      }
      else if (endcase == 'pxd'){
          return d3.symbol().type(d3.symbols[3])();
      }
//      else if (endcase == 'h'){
//          return d3.symbol().type(d3.symbols[4])();
//      }
      else if (endcase == 'c'){
          return d3.symbol().type(d3.symbols[5])();
      }
      else if ((endcase == 'png' ) || (endcase == 'jpg')){
          return d3.symbol().type(d3.symbols[6])();
      }
      else if(d.children||d._children){
          var pathdata = "M -5 -5 L -5 5 L 5 5 L 5 -2 L -1 -2 L -1 -5 Z";
          return pathdata;
      }
      else//for unknown type of file
      {
          return d3.symbol().type(d3.symbols[4])();
          }
        })

    .style("fill", function (d) {
     return chooseColor(d.data.name,d.children||d._children)
    })
    .attr("opacity",function(d)
    {
        return d._children ? 0.1:0.9;
    })
    .on("click", function(event,d)
    {
        click(d);
    })
    .on("mouseenter", function(event, d) {
        d3.select(this)
          .attr("stroke-width", "2px")  // Increase stroke width on mouse enter
          .attr("transform", "scale(2)")  // Increase size using a scale transform
          .style("fill","red");
      })
    .on("mouseleave", function(event, d) {
        d3.select(this)
          .attr("stroke-width", "1px")  // Revert stroke width on mouse leave
          .attr("transform", null)  // Revert size to the original value
          .style("fill",chooseColor(d.data.name,d.children||d._children));
      });


  // Adds a text description to each newly added group element.
  nodeEnter
    .append("text")
    .attr("x", function (d) {
      return d.children || d._children ? -10 : 10;
    })
    .attr("y",3)
    .attr("text-anchor", function (d) {
      return d.children || d._children ? "end" : "start";
    })
    .text(function (d) {
      return d.data.name;
    })
     .attr("fill", function(d){
        return chooseColor(d.data.name,d.children||d._children);
    })
     .attr("stroke-width","0.3px")
     .on("click",function(event,d)//operate on the main tree nodes
     {
         if(d.height==0){
            textclick(event,d);
            }
     })
     .on("mouseenter",function(event,d)
     {
          d3.select(this)
                .style("fill", "red")
                .style("font-size","16px")
                .style("font-weight","bold");
     })
     .on("mouseleave", function (event, d) {
            d3.select(this)
                .style("fill", chooseColor(d.data.name,d.children||d._children)) // Revert the fill color to the original value on mouse leave
                .style("font-size",null)
                .style("font-weight",null);
        });

      // Description of the number of files to add nodes to each newly added group element
  nodeEnter
    .append("text")
    .attr("x", function (d) {
      return d.children || d._children ? 20 : -20;
    })
    .attr("y",3)
    .attr("text-anchor", function (d) {
      return d.children || d._children ? "end" : "start";
    })
    .text(function (d) {
      return d.data.fileCount==0||!hasFile?'':d.data.fileCount;
    })
     .attr("stroke", function(d){
        return chooseColor(d.data.name,d.children||d._children);
    })
     .attr("stroke-width","0.3px")

    nodeEnter
        .each(function(d) {//
            if(d.data.linkAll
            &&
            ((typeof( d.data.linkAll['pdfClass']) !== "undefined" && Object.keys(d.data.linkAll['pdfClass']).length > 0)||(typeof( d.data.linkAll['gitClass']) !== "undefined" && Object.keys(d.data.linkAll['gitClass']).length > 0)))
            {
              d3.select(this)
                .append("foreignObject")
                .attr("class","fileBox")
                .attr("width", "8px")
                .attr("height", "15px")
                .attr("x", function(event,d) {
                  return d.children || d._children ? -30 : 10+100;
                })
                .attr("y",-10)
                .append("xhtml:div")
                .style("margin", 0)
                .style("padding", 0)
                .html('<img src="/client/static/pic/fileBox.svg" width="100%" height="100%" />')
                .on("click",function(event,d)
                 {
                    textclick(event,d);
                 })

            }
            if (d.data.linkAll && typeof(d.data.linkAll["pdfModule"]) !== "undefined" && d.data.linkAll["pdfModule"].length > 0) {
            d3.select(this)
                .append("foreignObject")
                .attr("width", "8px")
                .attr("height", "15px")
                .attr("x", function(event,d) {
                  return d.children || d._children ? -30 : 20+100;
                })
                .attr("y",-10)
                 .append("xhtml:div")
                 .style("margin", 0)
                 .style("padding", 0)
                 .html('<img src="/client/static/pic/pdf.svg" width="100%" height="100%" />')
                 .on("click",function()
                 {
                    var link = d.data.linkAll['pdfModule'];
                    window.open(link, '_blank');
                 })

            }
      });


  // Get the update set
  var nodeUpdate = nodeEnter.merge(mynode);
  // Set the position of the node to change, add transition animation effects
  nodeUpdate
    .transition()
    .duration(duration)
    .attr("transform", function (d) {
      return "translate(" + d.y + "," + d.x + ")";
    });

  // Updating node properties and styles
  nodeUpdate
    .select("path.node")
    .attr("r", 10)
    .style("fill", function (d) {
        return chooseColor(d.data.name,d.children||d._children);
    })
    .attr("cursor", "pointer");

  // Getting the exit operation
  var nodeExit = mynode
    .exit()
    .transition()
    .duration(duration)
    .attr("transform", function (d) {
      return "translate(" + source.y + "," + source.x + ")";
    })
    .remove();

  nodeExit.select("path").attr("opacity", 1e-6);
  nodeExit.select("text").style("fill-opacity", 1e-6);
}


/********************* 6. Click node event handling  *********************/
// When clicked, expands all leaf nodes of the current node
function click(d) {
      if (d._children&&d._children.length>0) {// If there are hidden nodes, expand them all
         if(!d.children)
           {
            d.children=[];
            d.data.children=[];
          }
          d._children.forEach(function(_child)
          {
            d.children.push(_child);
            d.data.children.push(_child.data)
          })
            d._children = [];
          }
      else {// Shrink back if fully expanded
        const childrenCopy = d.children.slice();  // Create a copy
        childrenCopy.forEach(function(child)
            {
            if(!d._children)
                {
                    d._children=[];
                }
            if(child.data.fileCount<1){
                d._children.push(child)
                removeNodeByName(d,child.data.name)
                }
          })
      }
      updateChart(d);
}

function textclick(event,d){
            var pdfClass=d.data.linkAll&&d.data.linkAll['pdfClass']?d.data.linkAll['pdfClass']:'';
            var gitClass=d.data.linkAll&&d.data.linkAll['gitClass']?d.data.linkAll['gitClass']:'';

            d3.select("#miniTree")
                .remove();
            d3.select(".rectout").remove();
            if(d.height==0){
                var point=d;
                var fullname = d.data.name.slice(0, d.data.name.lastIndexOf("."));
                while(point.depth>=0&& point.parent)
                    {
                        point=point.parent;
                        if(!(point.data.name=='package'&&point.depth==0)){//delete the first layer"package." pylibstree
                        fullname = point.data.name + '.' + fullname;
                    }
                    }
                kdoc.moduledir=fullname;
                kdoc.classname='';
                fetch(pathUrl+'/treeLeaf?wanted=' + fullname)
                    .then(response => response.json())
                    .then(data => {
                    if(data !== "null"){
                    var datain=data.jsoninside;
                    var dataout=data.jsonoutside;
                    const jsontree = toJson(fullname,dataout);

                    drawOutTree(nodes,links,datain,jsontree,event.pageX,event.pageY,pdfClass,gitClass);
                       } })
                    .catch(error => {
                        console.error('Error executing Python script:', error);
                    });
            }
}
  /********************* 3. Data Update Binding  *********************/
function updateChart(source) {
      treecount.treeShowNodeCount=countNodes(root);
      updateHeight(root);
      var treeData = tree(root);
      // Calculate the new Tree hierarchy
      var nodes = treeData.descendants(),
      links = treeData.descendants().slice(1);
      nodes.forEach(function (d) {
        d.y = d.depth * width/(root.height+2)+60;  // Change the horizontal position of the node here
      });

      // node interaction and drawing
      updateNodes(source, nodes);
      // link interaction and drawing
      updateLinks(source, links);

      // Saving old locations for animated transitions
      nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
      });

    }
// Add a path of Bézier curves to the parent and child nodes.
function diagonal(s, d) {
  path =
    `M ${s.y} ${s.x}
          C ${(s.y + d.y) / 2} ${s.x},
            ${(s.y + d.y) / 2} ${d.x},
            ${d.y} ${d.x}`;

  return path;
}
function buildJsonTree(fullname, data) {
  const tree = { name: fullname, children: [] };
  for (const entry of data) {
    const parts = entry.split('.');
    let current = tree.children;

    for (const part of parts) {
      let node = current.find(item => item.name === part);

      if (!node) {
        node = { name: part, children: [] };
        current.push(node);
      }

      current = node.children;
    }
  }

  return tree;
}
function chooseColor(fullname,isFolder)
{
  var endcase = (fullname).split('.')[1];
      if (endcase == 'py'){
          return color[0];
      }
      else if (endcase == 'pyi'){
          return color[1];
      }
      else if (endcase == 'dll'){
          return color[2];
      }
      else if ((endcase == 'png' ) || (endcase == 'jpg')){
          return color[3];
      }
      else if (endcase == 'pxd'){
          return color[4];
      }
//      else if (endcase == 'h'){
//          return color[5];
//      }
      else if (endcase == 'c'){
          return color[6];
      }
      else if(isFolder){
          return color[7];
      }
      else
      {
      return color[8];
      }
}

function toJson(fullname,data) {
  const treeStructure = buildJsonTree(fullname,data);
  return treeStructure;
}
function createSVGElement(data) {
    var dimensions=getArrayDimensions(data);
    console.log(typeof(dimensions),dimensions[0]);
    var w=400;
    var h=600;
    var svg = d3
      .select(".popup") 
        .append("svg")
        .attr("id", "position")
        .attr("width", w)
        .attr("height", h);
    var resultText=svg.append("text")
        .attr("x",10)
        .attr("y",30)
        .text("The output dimension is ("+dimensions[0]+","+dimensions[1]+","+dimensions[2]+")");
    var linear = d3.scaleLinear()  
      .domain([-1,1]) 
      .range(["black", "white"]); 

    for(let i_wei=0;i_wei<dimensions[1];i_wei++){
      var rects = svg
          .selectAll(".rects")
          .data(data[0][i_wei])
          .enter()
          .append("rect")
          .attr("y", (d,i)=>h+50-i*h/dimensions[2])
          .attr("x", (d, i) => 200 + i_wei*(w/dimensions[1]))
          .attr("height", h/dimensions[2])
          .attr("width", w/dimensions[1])
          .attr("fill", function (d) {
          return linear(d);
          });
    }
    return svg;
}
function getArrayDimensions(arr) {
  const dimensions = [];

  function recursiveGetDimensions(subArray) {
        if (Array.isArray(subArray)) {
            dimensions.push(subArray.length);
            if (subArray.length > 0) {
                recursiveGetDimensions(subArray[0]);
            }
        }
    }
  recursiveGetDimensions(arr);
  return dimensions;
}
function drawOutTree(nodes,links,datain,dataout,locX,locY,pdfClass,gitClass)
{
    var treemini=d3.tree()
           .size([300, 250]);
    var hiout=d3.hierarchy(dataout);
    var rootout=treemini(hiout);
    var linksout=rootout.links();
    var nodesout=rootout.descendants();
    // Create an array for storing leaf nodes with overlapping paths
    var overlappingLeafNodes = [];
    var overlappingminiNodes=[]
    for (var i = 0; i < nodesout.length; i++) {
        if(nodesout[i].height==1)
        {
            overlappingminiNodes.push(nodesout[i]);
        }
    }
    for (var t =0;t<overlappingminiNodes.length;t++){
       for (var j = 0; j < nodes.length; j++) {
        if(nodes[j].height==0){
        if (nodes[j].data.name.substring(0, nodes[j].data.name.lastIndexOf(".")) === overlappingminiNodes[t].data.name &&nodes[j].depth-overlappingminiNodes[t].depth==-2) {
        var pointNode=nodes[j];
        var pointminiNode=overlappingminiNodes[t];
        while(pointNode.parent)
        {
        pointNode=pointNode.parent;
        pointminiNode=pointminiNode.parent;
        if(pointminiNode.data.name!=pointNode.data.name)
            {
                break;
            }
        }
                overlappingLeafNodes.push(nodes[j]);
                break;
              }
            }
        }
    }
    var outRect=d3.select("#mainsvg").selectAll(".rectout")
       .data(overlappingLeafNodes)
       .enter()
       .append("rect")
       .attr("class","rectout")
       .attr("x",d=>d.y-5)
       .attr("y",d=>d.x-5)
       .attr("width", 10) // Set the width of the rectangle
       .attr("height", 10) // Set the height of the rectangle
       .attr("stroke", "blue")
       .attr("stroke-width", 2)
       .attr("fill", "none");
    var miniTree = d3.select('#graph')
        .append("g")
        .attr("id", "miniTree")

    var gc = d3.select("#miniTree")
               .attr("transform", "translate(" + locX/4 + "," + locY/2 + ")");

    gc.append("rect")
        .attr("width", "620px")
        .attr("height", "30px")
        .attr("fill", "#3572A5")
//        .attr("opacity","0.9")
    gc.append("rect")
        .attr("width", "620px")
        .attr("height", "270px")
        .attr("y","31px")
        .attr("fill", "#E4F1FF")
//        .attr("opacity","0.8")
    // Adding a Vertical Dividing Line
    gc.append("line")
        .attr("x1", "290px")
        .attr("y1", "0")
        .attr("x2", "290px")
        .attr("y2", "300px")
        .attr("stroke", "#AED2FF");
    gc.append("line")
        .attr("x1", "0")
        .attr("y1", "30px")
        .attr("x2", "620px")
        .attr("y2", "30px")
        .attr("stroke", "#AED2FF");
    gc.append("text")
        .attr("x", "0px")
        .attr("y", "20px")
        .attr("fill","white")
        .attr("font-size", "15px")
        .text("build-in classes");
    gc.append("text")
        .attr("x", "300px")
        .attr("y", "20px")
        .attr("fill","white")
        .attr("font-size", "15px")
        .text("build-out classes");
    var datain=gc.selectAll(".textin")
        .data(datain)
        .enter()
        .append("text")
        .attr("class","textin")
        .attr("x",20)
        .attr("y",function(d,i)
        {
        return (i+1)*15+30;
        })
        .attr("font-size","12px")
        .text(d=>d.split('.').slice(-1))
        .each(function(d,i) {
            var linkPdf=pdfClass[d];
            if(linkPdf)
            {
            var currentY = d3.select(this).attr("y");
            d3.select(this.parentNode)
                .append("foreignObject")
                .attr("class","pdfClass")
                .attr("width", "8px")
                .attr("height", "15px")
                .attr("x", function(event,d) {
                  return 0;
                })
                .attr("y",function()
                {
                    return currentY-15;
                })
                .append("xhtml:div")
                .html('<img src="/client/static/pic/pdf.svg" width="100%" height="100%" />')
                .on("click",function()
                {
                    window.open(linkPdf, '_blank');
                }
                )
                 }
        })
        .each(function(d,i) {
            var linkGit=gitClass[d];
            if(linkGit)
            {
            var currentY = d3.select(this).attr("y");
            d3.select(this.parentNode)
                .append("foreignObject")
                .attr("class","gitClass")
                .attr("width", "8px")
                .attr("height", "15px")
                .attr("x", function(event,d) {
                  return 10;
                })
                .attr("y",function()
                {
                    return currentY-15;
                })
                .append("xhtml:div")
                .html('<img src="/client/static/pic/github.svg" width="100%" height="100%" />')
                .on("click",function()
                {
                    window.open(linkGit, '_blank');
                }
                )
                 }
        })

        .on("mouseover",function(d,i)
            {  d3.select(this)
                .attr("fill", "#28567C")
                .attr("font-weight","bold");
            })
        .on("mouseleave",function(d,i)
            {  d3.select(this)
                .attr("fill", "black")
                .attr("font-weight","none");
            })
        .on("click",function(d,i)
        {
            lastIndex=i.lastIndexOf('.')
            kdoc.moduledir=i.substring(0,lastIndex);
            kdoc.classname=i.substring(lastIndex+1);
            fetch(pathUrl+'/classVariable?wanted=' + i)
                    .then(response => response.json())
                    .then(data => {
                    var tips = d3.select("body")
                                      .append("div")
                                      .attr("class","popup")
                                      .style("width", "1000px")
                                      .style("height", "600px")
                    var drag=d3.drag()
                              .on("start", function (event) {
                            var startX = event.x;
                            var startY = event.y;
                            var currentLeft = parseFloat(tips.style("left"));
                            var currentTop = parseFloat(tips.style("top"));
                            offsetX = startX - currentLeft;
                            offsetY = startY - currentTop;
                        })
                        .on("drag", function (event) {
                            tips.style("left", (event.x - offsetX) + "px")
                                .style("top", (event.y - offsetY) + "px");
                        });
                    tips.call(drag);
                    var closeButton=tips.append("span")
                          .attr("class","close")
                          .attr("color","red")
                          .text("x")
                          .on("click",function(){
                          d3.select(".popup").remove();
                         });
                        // Setting the Off Button Position
                    closeButton.style("position", "fixed")
                          .style("top", "0")
                          .style("left", "0");
                    tips.append("div")
                        .attr("class", "table-title")
                        .attr("font-size","25px")
                        .text(kdoc.moduledir+"/"+kdoc.classname)
                        .style("color","#3572A5");
                    tips.append("hr")
                        .attr("class", "separator");
                    var contentContainer = tips.append("div").attr("class", "content-container");
                    var tableContainer = contentContainer.append("table").attr("class", "var-fun-container var-fun-container table-style");
                    var tableHeader = tableContainer.append("thead").append("tr");
                    tableHeader.append("th").text("Variable"); // Table header column 1
                    tableHeader.append("th").text("Function"); // Table header column 2

                    var tableBody = tableContainer.append("tbody"); // Creating the main part of the form
                    var row = tableBody.append("tr"); // Create a line
                    row.append("td").attr("class", "contentVar").style("color", "green").html(data['var'].join("<br>"));  // first column
                    row.append("td").attr("class", "contentFun").style("color", "blue").html(data['fun'].join("<br>"));  // second column
                    var docContainer = tips.append("div").attr("class", "contentDoc-container");
                    var textWithLinks = data['doc'];
                    var linkRegex = /(\bhttps?:\/\/\S+\b)/g;  // \b matches word boundaries, \s looks for blank characters
//                    var linkRegex = /(\bhttps?:\/\/\S+?(?=\s|<|\|$))/g
                    const exampleLines = [];
                    var textWithFormattedLinks = linkRegex?textWithLinks.replace(linkRegex, '<a href="$1" target="_blank">$1</a>'):'';
                    const lines = textWithFormattedLinks.split('\n');
                    const keyword = 'examples::';
                    for (let i = 0; i < lines.length; i++) {
                        let line = lines[i];
                        if (line.trim().toLowerCase() === keyword) {
                            textWithFormattedLinks = textWithFormattedLinks.replace(lines[i], lines[i] + '   ▶');
                            for(let j=i+1;j<lines.length;j++)
                            {
                              if (lines[j].trim().toLowerCase().startsWith('>>>')) {
                                exampleLines.push(lines[j].replace(/[>]/g,'').trim());
                            }
                            }
                            break;
                        }
                    }
                    completeRequest={
                      "kdoc":kdoc,
                      "code":exampleLines
                    }
                   
                    var linkRegex = /▶/g;
                    var replacedText = textWithFormattedLinks.replace(linkRegex, '<span style="color: red; cursor: pointer;" class="example-link">▶</span>');
                    // 添加点击事件监听器
                    document.addEventListener('click', function(event) {
                        var clickedElement = event.target;
                        if (clickedElement.classList.contains('example-link')) {
                          const jsonExample = JSON.stringify(completeRequest);
                          axios.get(pathUrl+"/codeExample?wanted=" + jsonExample).then(res=>{
                            createSVGElement(res.data.out);  // 创建SVG元素的函数
                            // clickedElement.closest('div').appendChild(svgElement);

                          })
                        }
                    })
                   docContainer.append("div")
                        .attr("class", "contentDoc")
                        .style("white-space", "pre-line")
                        .html(replacedText);
                  //  tips.append("div")
                  //           .attr("class","contentPdf")
                  //           .html(data['pdf']+"<br>")
})
                    .catch(error => {
                        console.error('Error executing Python script:', error);
                    });

                    });
    var lines=gc.selectAll("path")
                .data(linksout)
                .enter()
                .append("path")
                .attr("stroke","#555")
                .attr("stroke-width",0.5)
                .attr("opacity",0.5)
                .attr("d",d3.linkVertical()          // d3.linkHorizontal()
                            .x(d=>d.x+300)
                            .y(d=>d.y+35)
                )
                .attr("fill","none");
    var mynode=gc.selectAll("circle")
            .data(nodesout)
            .join("circle")
            .attr("cx",d=>d.x+300)
            .attr("cy",d=>d.y+35)
            .attr("r",5)
            .attr("opacity",0.5)
            .attr("fill",function(d,i){return color[i%10];});

    var nodetxt=gc.selectAll(".textout")
            .data(nodesout)
            .enter()
            .append("text")
            .attr("class","textout")
            .attr("x",d=>d.x+300)
            .attr("y",function(d,i)
                                {
                                return(i%2==0?d.y+35:d.y+45);
                                })
            .attr("dx",(d,i)=>d.height==0?"0em":"-1em")
            .attr("dy","0.5em")
            .attr("text-anchor",(d,i)=>d.height==0?"start":"end")
            .attr("font-size","12px")
            .text(d=>d.data.name)
            .attr("fill",function(d,i){return color[i%10];})
            .on("mouseover",function(d,i)
            {  d3.select(this)
                .attr("font-weight","bold");
            })
            .on("mouseleave",function(d,i)
            {  d3.select(this)
                .attr("font-weight","none");
            })
            .on("click",function(d,i)
              {
              if(i.height==0){
               var fullname = i.parent.data.name;
               var point=i.parent;
              }
               else
               {
                var fullname = i.data.name;
                var point=i;
               }
              while(point.depth>=2&& point.parent)
                {
                  point=point.parent;
                  if(!(point.data.name=='package'&&point.depth==0)){//delete the first layer"package." pylibstree
                        fullname = point.data.name + '.' + fullname;
                    }
                }
                lastIndex=fullname.lastIndexOf('.')
                kdoc.classname=fullname.lastIndexOf('.')[0];
                kdoc.moduledir=fullname.lastIndexOf('.')[-1];
                showFile(kdoc)
            });
            }
}
var hasFile=1;
window.onDrawTreeReady = function(data,treecount,keyworddoc,showFile) {
    drawTree(data,treecount,keyworddoc,showFile);
}

