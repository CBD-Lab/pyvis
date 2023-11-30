var nodehasclass;
var nodehasfunction;
var nodeweight;
var nodelayer;


function drawNet(data, k, search, netCount){
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
    console.log(nodes,links)
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
				   console.log(d,k);
					  if (k == "pylibsNet" || k== "" || k == "undefined" || k == "None"||typeof(d.myparent)!='undefined') {
					  return color[d.weight%10];
					  }
					  else { return color[d.layer%10]; }
				  })
				  .on("mouseenter", (d,i) => {
					  link.style("stroke-width", l => l.source.name == i.name || l.target.name == i.name ? 3 : 1)
					  if(i.layer){//是模块类型的net'数据
					        link.style("stroke", l => l.source.name == i.name || l.target.name == i.name ?color[i.layer%10]:"grey");}
					  else//是pylibsnet数据或者class数据
					  {
					        link.style("stroke", l => l.source.name == i.name || l.target.name == i.name ?color[i.weight%10]:"grey");}

					  var point = i;
					  fullname = point.name;
					  if(typeof(i.myparent)!='undefined')
					  {
					        const tooltipContent = `<div style="background-color:grey">Name:${i.name}</div>${i.myparent ?`<div>Parent:${i.myparent}</div>`:''}${i.attributes&&i.attributes.length>0 ?`<div>Attributes:${i.attributes}</div>`:''}${i.methods&&i.methods.length>0?`<div>Methods:${i.methods}</div>`:''}`;
					          tooltip.html(tooltipContent).style("display","block")
					            .style("background-color", "#E4F1FF");
					  }
					  else if(fullname.lastIndexOf('.') == -1) {//显示根节点信息
					      fetch('http://127.0.0.1:5006/info?wanted=' + fullname)
					      .then(response => response.json())  // 使用json()方法提取JSON数据
					      .then(data => {//显示根节点模块信息
					          const tooltipContent = `<div style="background-color:grey">Name:${data.Name}</div><div>Version:${data.Version}</div><div>Summary:${data.Summary}</div><div>Author:${data.Author}</div><div>License:${data.License}</div><div>Location:${data.Location}</div>${data.RequiredBy ?`<div>Required by:${data.RequiredBy}</div>`:''}${data.Requires?`<div>Requires:${data.Requires}</div>`:''}<div>Home page:${data.HomePage}</div>`;
					          tooltip.html(tooltipContent).style("display","block")
					            .style("background-color", "#E4F1FF");
					      })
					  }

					  else{//显示非根节点模块信息
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
				      if(fullname.lastIndexOf('.')!=-1)//如果是目录的话就加载源代码
				      {
					  fetch('http://127.0.0.1:5006/leafCode?wanted=' + fullname)
						  .then(response => response.text())
						  .then(data => {
							  const language = 'python';
							  const highlightedCode = Prism.highlight(data, Prism.languages[language], language);
							  var tips = d3.select("body")
										   .append("div")
										   .attr("class", "popup");


						      var drag=d3.drag()
                                  .on("start", function (event) {
                                    // 记录拖拽开始时的位置
                                    var startX = event.x;
                                    var startY = event.y;

                                    // 获取当前提示框的位置
                                    var currentLeft = parseFloat(tips.style("left"));
                                    var currentTop = parseFloat(tips.style("top"));

                                    // 计算鼠标相对于提示框左上角的偏移
                                    offsetX = startX - currentLeft;
                                    offsetY = startY - currentTop;
                                  })
                                  .on("drag", function (event) {
                                    // 随鼠标移动，更新提示框位置
                                    tips.style("left", (event.x - offsetX) + "px")
                                      .style("top", (event.y - offsetY) + "px");
                                  });
                              tips.call(drag);

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
						  }

                  else
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
            // 通过比较新位置和边界来确保节点在边界内
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

window.onDrawNetReady = function(data, k, search, netCount) {
    // 执行绘图逻辑
    drawNet(data, k, search, netCount);
}
window.onNetfunction = function(type) {
    selectit(type);
}
