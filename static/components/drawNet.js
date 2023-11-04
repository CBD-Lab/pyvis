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
          .style("stroke-width", 1);

    var node = svg.selectAll(".node")
              .data(nodes)
              .enter()
              .append("a")
              .append("circle")
              .attr("class", "node")
              .attr("r", d=>d.weight*2+6)
              .style("fill", (d,i)=>color[i%10])
              .call(drag());

    var texts=svg.selectAll(".forceText")
                     .data(nodes)
                     .enter()
                     .append("text")
                     .attr("class","forceText")
                     .attr("text-anchor","middle")
                     .attr("fill", "#555")
                     //.attr("stroke-family","仿宋")
                     .style("font-size","12px")
                     //.attr("dx","-1.5em")
                     .attr("dy","1.5em")
                     //.text(function(d){return d.name;});
                     .text(function(d){return d.name.substr(d.name.lastIndexOf(".")+1,d.name.length) });

    forceSimulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
        texts.attr("x",function(d){return d.x;});
        texts.attr("y",function(d){return d.y;});
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
        node.attr("r",function(d){
            return Math.floor(scale*d.weight+3);
        })
        texts.attr("font-size",function(d){
            var fontsize=""+Math.floor(scale*d.weight+3)+"px";
            console.log(fontsize);
            return fontsize;
        })
        link.attr("stroke-width",function(d){
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
window.onDrawNetReady = function(data) {
    // 执行绘图逻辑
    drawNet(data);
}