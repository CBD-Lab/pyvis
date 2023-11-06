var nodehasclass;
var nodehasfunction;
var nodeweight;
var nodelayer;


function drawNet(data){
    var forceSimulation = d3.forceSimulation()
                        .force("link",d3.forceLink())
                        .force("charge",d3.forceManyBody().strength(-100))
                        .force("center",d3.forceCenter(width/2,height/2));

    var svg = d3.select("#graph")
            .attr("width", width*0.85)
            .attr("height", height);
    var module="pylibs.json"
    var nodes=data.nodes;
    var links=data.links;

    console.log('check',nodes);
    nodeweight=new Array(nodes.length);
    nodehasclass=new Array(nodes.length);
    nodehasfunction=new Array(nodes.length);
    nodelayer=new Array(nodes.length);

    forceSimulation.nodes(nodes)
                   .on("tick");
      //links
    forceSimulation.force("link")
                     .links(links)
                     .distance(40);

    for (var i=0;i<nodes.length;i++){
            var sum=0;
            for(var j=0;j<links.length;j++){
                if ((links[j].source.index==i)||(links[j].target.index==i))
                    sum=sum+1;
            }
            nodes[i].weight=sum;
    }

    var link = svg.selectAll(".link")
          .data(links)
          .enter()
          .append("line")
          .attr("class", "link")
          .attr("stroke-width", 1);

    var node = svg.selectAll(".node")
              .data(nodes)
              .enter()
              .append("a")
              .append("circle")
              .attr("class", "node")
              .attr("r", (d,i)=>{
//                console.log(d);
                nodehasclass[i] = d.hasclass+5;
                nodehasfunction[i] = d.hasfunction+5;
                nodeweight[i] = d.weight/2+5;
                nodelayer[i] = d.layer;
                return d.weight*2+5;
              })
              .attr("fill", (d,i)=>color[i%10])
                          .on("mouseenter", (event, d) => {
                // 将与圆形相连的线加粗
                link.style("stroke-width", l => l.source == d || l.target == d ? 4 : 1);
            })
              .on("mouseleave", d => link.style("stroke-width", 1))
              .style("cursor", "pointer")
              .on("click", (d, i) => {
          console.log(d, i);
          var fullname = i.name.split('.', 1)[0];
          var point = i;
          while (point.depth >= 0 && point.parent) {
            point = point.parent;
            fullname = point.name + '.' + fullname;
          }

          if (point.name == "nn")
            fullname = "torch." + fullname;
          else
            fullname = fullname;

          console.log(d, i, fullname);
          fetch('http://127.0.0.1:5006/leafCode?wanted=' + fullname)
            .then(response => response.text())
            .then(data => {
              const language = 'python';
              const highlightedCode = Prism.highlight(data, Prism.languages[language], language);
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

              console.log(data);
            })
            .catch(error => {
              console.error('Error executing Python script:', error);
            });
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
                     .text(d=>{return d.name.substr(d.name.lastIndexOf(".")+1,d.name.length) });

    forceSimulation.on("tick", () => {
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
        console.log(this.value)
         forceSimulation.force("charge").strength(-this.value);
         forceSimulation.alpha(1).restart();
    });
    d3.select("input[id=nodescale]").on("change", function() {
        console.log(this.value);
        var scale=this.value;
        node.attr("r",d=>{
            return Math.floor(scale*d.weight+3);
        })
        texts.attr("font-size",d=>{
            var fontsize=""+Math.floor(scale*d.weight+3)+"px";
            console.log(fontsize);
            return fontsize;
        })
        link.attr("stroke-width",d=>{
            var edgesize=""+Math.floor(scale+1)+"px";
            console.log(edgesize);
            return edgesize;
        })
        radius=10*scale;
        //arrowMarker.attr("refX",12+radius/8-2);
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
    var nodes=document.getElementsByClassName("node");
    console.log('获得正确',nodes);
    if(type=="equalr"){
        console.log("equalr");
        r=10;
        for(i=0;i<nodes.length;i++){
            nodes[i].setAttribute("r",r);
        }
    }
    else if(type=="showclass"){
        console.log("show-class");
        for(i=0;i<nodes.length;i++){
            nodes[i].setAttribute("r",nodehasclass[i]);
//            console.log('!',nodehasclass[i]);
        }
    }
    else if(type=="showfunction"){
        console.log("show-function");
        for(i=0;i<nodes.length;i++){
            nodes[i].setAttribute("r",nodehasfunction[i]);
        }
    }
    else{
        console.log("edge-count");
        for(i=0;i<nodes.length;i++){
            nodes[i].setAttribute("r",nodeweight[i]);
        }
    }
    return null;
}
window.onDrawNetReady = function(data) {
    // 执行绘图逻辑
    drawNet(data);
}
window.onNetfunction = function(type) {
    selectit(type);
}
