console.log('drawTree.js is loaded');
function drawTree(data){
    var svg = d3.select("#graph")
            .attr("width", width*0.85)
            .attr("height", height);
    d3.select('svg').selectAll('*').remove();
    // 获取具有ID属性的div元素
    var tooltip = document.getElementById("tip");
    if (tooltip) {
        tooltip.parentNode.removeChild(tooltip);
    }
    var tree=d3.tree()
           .size([height,width*0.7]);
       var hi=d3.hierarchy(data);
       var root=tree(hi);
       var links=root.links();
       var nodes=root.descendants();

    var gc=svg.append("g")
              .attr("transform","translate(" + (width/40) + "," + (height/100) + ")");
    var lines=gc.selectAll("path")
                .data(links)
                .enter()
                .append("path")
                .attr("fill","none")
                .attr("stroke","#555")
                .attr("stroke-width",0.5)
                .attr("opacity",0.5)
                .attr("d",d3.linkHorizontal()          //d3.linkHorizontal()
                            .x(d=>d.y)
                            .y(d=>d.x)
                );
    var mynode=gc.selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("cx",d=>d.y)
            .attr("cy",d=>d.x)
            //.attr("r",d=>(d.height+2)*2)
            .attr("r",d=>d.value?d.value:5)
            .attr("fill",(d,i)=>color[d.depth])
            .attr("opacity",0.5)
            .attr("stroke","#555");

var nodetxt=gc.selectAll("text")
            .data(nodes)
            .enter()
            .append("a")
            .attr("xlint:href",function(d){
                        return "http://127.0.0.1:5006/moduletxt?wanted="+d.data.name;
            })
            .append("text")
            .attr("x",d=>d.height==0?parseFloat(d.data.value)/240+d.y:d.y)
            .attr("y",d=>d.x)
            .attr("dx",(d,i)=>d.height==0?"0em":"-1em")
            .attr("dy","0.5em")
            .attr("text-anchor",(d,i)=>d.height==0?"start":"end")
            .attr("font-size","12")
            .attr("fill",(d,i)=>i%2==0?"green":"orange")
            .text(d=>d.data.name)
            .on('mouseover',function(d,i){
                d3.select(this)
                  .attr("fill", "red")
                  .attr("font-weight","bold");
            })
            .on('mouseout',function(d,i){
                d3.select(this)
                  .attr("fill", (d,i)=>i%2==0?"green":"orange")
                  .attr("font-weight","none");
            })

var rect=gc.selectAll("rect")
            .data(nodes)
            .join("rect")
            .attr("x",d=>d.y)
            .attr("y",d=>d.x)
            .attr("width",d=>d.height==0?parseFloat(d.data.value)/240:0)
            .attr("height",0.5)
            .attr("opacity",0.5)
            .attr("fill",(d,i)=>i%2==0?"green":"orange");
}

window.onDrawTreeReady = function(data) {
    console.log('drawTree.js is ready');
    // 执行绘图逻辑
    drawTree(data);
}

