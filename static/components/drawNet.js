var nodehasclass;
var nodehasfunction;
var nodeweight;
var nodelayer;


function drawNet(data, k, search, netCount, kdoc,isclassnet,showFile){
    var forceSimulation = d3.forceSimulation()
							.force("link",d3.forceLink())
							.force("charge",d3.forceManyBody().strength(-100))
							.force("center",d3.forceCenter(width/2,height/2))
							.force("x", d3.forceX(width / 2))
                            .force("y", d3.forceY(height / 2))
                            .force("collision", d3.forceCollide().radius(20));

    var svg = d3.select("#graph")
				.attr("width", width*0.85)
				.attr("height", height);
    var module = "pylibs.json"
    var nodes = data.nodes;
    var links = data.links;
    netCount.node = nodes.length;
    netCount.link = links.length;
    nodeweight = new Array(nodes.length);
    nodehasclass = new Array(nodes.length);
    nodehasfunction = new Array(nodes.length);
    nodelayer = new Array(nodes.length);

    forceSimulation.nodes(nodes)
                   .on("tick");
    // links
    forceSimulation.force("link")
                   .links(links)
                   .distance(40);

    for (var i=0; i<nodes.length; i++) {
		var sum = 0;
		for(var j=0; j<links.length; j++) {
			if (links[j].source.index==i || links[j].target.index==i)
				sum = sum + 1;
		}
		nodes[i].weight = sum;
    }

    var link = svg.selectAll(".link")
				  .data(links)
				  .enter()
				  .append("line")
				  .attr("class", "link")
				  .attr("stroke-width", 1);

    var img_h = 50;
    var img_w = 50;
    var rad = 23;
    var tooltip = d3.select("body").append("div")
                   .attr("class", "tooltip")
                   .style("left", "20vw")
                   .style("top", "20vh")
                   .style("width", "60vw")
                   .style("background-color", "#E4F1FF")
                   .style("font-family", "Consolas")
                   .style("white-space", "pre-line")
                   .style("display", "none");
    var styleElement = document.createElement('style');
    var cssStyles = '.tooltip:after { content: ""; width: 0; height: 0; border: 12px transparent; }';
    styleElement.appendChild(document.createTextNode(cssStyles));
    document.head.appendChild(styleElement);
    var node = svg.selectAll(".node")
				  .data(nodes)
				  .enter()
				  .append("a")
				  .append("circle")
				  .attr("class", "node")
				  .attr("r", (d,i)=>{
					  nodehasclass[i] = d.hasclass+5;
					  nodehasfunction[i] = d.hasfunction+5;
					  nodeweight[i] = d.weight/2+5;
					  nodelayer[i] = d.layer;
					  return d.weight*2+5;
				  })
				  .attr("fill", (d, i) => {
					  if (k == "pylibsNet" || k== "" || k == "undefined" || k == "None"||typeof(d.myparent)!='undefined') {
					  return color[d.weight%10];
					  }
					  else { return color[d.layer%10]; }
				  })
				  .on("mouseenter", (d,i) => {
					  link.style("stroke-width", l => l.source.name == i.name || l.target.name == i.name ? 3 : 1)
					  if(i.layer){  // It's the net data of the module type
					        link.style("stroke", l => l.source.name == i.name || l.target.name == i.name ?color[i.layer%10]:"grey");}
					  else  // It's pylibsnet data or class data.
					  {
					        link.style("stroke", l => l.source.name == i.name || l.target.name == i.name ?color[i.weight%10]:"grey");}

					  var point = i;
					  fullname = point.name;
					  if(typeof(i.myparent)!='undefined')
					  {
					        const tooltipContent = `<div style="background-color:grey">Name:${i.name}</div>${i.myparent ?`<div>Parent:${i.myparent}</div>`:''}${i.attributes&&i.attributes.length>0 ?`<div>Attributes:${i.attributes}</div>`:''}${i.methods&&i.methods.length>0?`<div>Methods:${i.methods}</div>`:''}`;
					          tooltip.html(tooltipContent).style("display","block")
					            .style("background-color", "#FFDF76");
					  }
					  else if(fullname.lastIndexOf('.') == -1) {  // Displaying Root Node Information
					      fetch(pathUrl+'/info?wanted=' + fullname)
					      .then(response => response.json())  // Use json() method to extract JSON data
					      .then(data => {  // Displaying Root Node Module Information
					          const tooltipContent = `<div style="background-color:grey">Name:${data.Name}</div><div>Version:${data.Version}</div><div>Summary:${data.Summary}</div><div>Author:${data.Author}</div><div>License:${data.License}</div><div>Location:${data.Location}</div>${data.RequiredBy ?`<div>Required by:${data.RequiredBy}</div>`:''}${data.Requires?`<div>Requires:${data.Requires}</div>`:''}<div>Home page:${data.HomePage}</div>`;
					          tooltip.html(tooltipContent).style("display","block")
					            .style("background-color", "#FFDF76");
					      })
					  }

					  else{  // Display non-root module information
					       const tooltipContent=`<div style="background-color:grey">Name:${i.name}</div><div>Location:${i.file}</div><div>Layer:${i.layer}</div>${i.hasfunction ? `<div>Function:${i.myfunction}</div>` : ''}${i.hasclass ? `<div>Class:${i.myclass}</div>` : ''}`;
					       tooltip.html(tooltipContent).style("display","block")
                                .style("background-color", "#FFDF76");
					  }
				  })
				  .on("mouseleave", d => {
				      tooltip.style("display","none");
				      link.style("stroke-width", 1)
				            .style("stroke", "grey");
				  })
				  .style("cursor", "pointer")
				  .on("click", (d, i) => {
					  var point = i;
                      fullname=point.name;
				      if(fullname.lastIndexOf('.')!=-1 && isclassnet==0)  // Load the source code if it's a directory and it is not a class net graph
				      {
				        kdoc.moduledir=fullname;
				        kdoc.classname='';
					    showFile(kdoc);
                      }
                      else if(fullname.lastIndexOf('.')!=-1 && isclassnet==1)//load the  doc file if it's a class net graph
                      {
                        lastIndex=fullname.lastIndexOf('.')
                            kdoc.classname=fullname.substring(lastIndex+1);
                            kdoc.moduledir=fullname.substring(0,lastIndex);

                        showFile(kdoc);
                      }
                  else//search the modulename if it's not a modulename
                  {
                      tooltip.style("display", "none");
                      search(i.name);
                  }
				  })
				  .call(drag());

    var texts=svg.selectAll(".forceText")
				 .data(nodes)
				 .enter()
				 .append("text")
				 .attr("class","forceText")
				 .attr("text-anchor","middle")
				 .attr("fill", "#555")
				 .attr("font-size","12px")
				 .attr("dy","1.5em")
				 .text(d => { return d.name.substr(d.name.lastIndexOf(".")+1,d.name.length) });

    forceSimulation.on("tick", () => {
        node.each(function(d) {
            // Ensure that the node is within the boundary by comparing the new position to the boundary
            d.x = Math.max(20, Math.min(width*0.8, d.x));
            d.y = Math.max(20, Math.min(height*0.95, d.y));
            });
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
        texts.attr("x",d=>{return d.x;});
        texts.attr("y",d=>{return d.y;});
    });

    d3.select("input[id=edgescale]").on("change", function() {
        forceSimulation.force('link').distance(this.value)
        forceSimulation.alpha(1).restart();
    });
    d3.select("input[id=chargescale]").on("change", function() {
        forceSimulation.force("charge").strength(-this.value);
        forceSimulation.alpha(1).restart();
    });
    d3.select("input[id=nodescale]").on("change", function() {
        var scale=this.value;
        node.attr("r",d=>{
            return Math.floor(scale*d.weight+3);
        })
        texts.attr("font-size",d=>{
            var fontsize=""+Math.floor(scale*d.weight+3)+"px";
            return fontsize;
        })
        link.attr("stroke-width",d=>{
            var edgesize=""+Math.floor(scale+1)+"px";
            return edgesize;
        })
        radius=10*scale;
        // arrowMarker.attr("refX",12+radius/8-2);
    });

    function drag(){

        function dragstarted(event, d) {
            if (!event.active) forceSimulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) forceSimulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        return d3.drag()
				 .on("start", dragstarted)
				 .on("drag", dragged)
				 .on("end", dragended);


    }

}

function selectit(type){
    var nodes = document.getElementsByClassName("node");
    if (type == "equalr") {
        r = 10;
        for (i=0; i<nodes.length; i++) {
            nodes[i].setAttribute("r",r);
        }
    }
    else if (type == "showclass") {
        for (i=0; i<nodes.length; i++) {
            nodes[i].setAttribute("r",nodehasclass[i]);
        }
    }
    else if (type == "showfunction") {
        for (i=0; i<nodes.length; i++) {
            nodes[i].setAttribute("r",nodehasfunction[i]);
        }
    }
    else {
        for(i=0; i<nodes.length; i++) {
            nodes[i].setAttribute("r",nodeweight[i]);
        }
    }
    return null;
}

window.onDrawNetReady = function(data, k, search, netCount,kdoc,isclassnet,showFile) {
    // Execution of drawing logic
    drawNet(data, k, search, netCount,kdoc,isclassnet,showFile);
}
window.onNetfunction = function(type) {
    selectit(type);
}
