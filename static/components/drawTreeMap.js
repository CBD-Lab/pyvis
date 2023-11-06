function drawTreeMap(data,flag) {
    console.log("drawTreeMap");
    var width=(window.innerWidth||document.documentElement.clientWidth||document.body.clientWidth)*0.83;
	var height=(window.innerHeight||document.documentElement.clientHeight||document.body.clientHeight)*0.89;
    var color = d3.scaleOrdinal(d3.schemeCategory10);
    var svg = d3.select("#graph")
        .attr("width", width)
        .attr("height", height);

    var treemap = d3.treemap()
        .size([width, height]);


    console.log(data);
    var hidata = d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);
    console.log(hidata);
    var treedata = treemap(hidata);
    console.log(treedata);
    nodes = treedata.leaves()       //��Flare.jsonΪ��,��252���ڵ�
    console.log(nodes);

    var gc = svg.selectAll("g")
        .data(nodes)
        .enter()
        .append("g")
        .attr("transform", function (d) { return "translate(" + d.x0 + "," + d.y0 + ")"; })
        .attr("id", function (d, i) { return i; });

    console.log("js文件中的flag为：");
    console.log(flag);
    var rect = gc.append("rect")
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("fill", function (d) {
            while (d.depth > 1) {
                if(flag){
                    d = d.parent;
                }
                else{
                    break;
                }
            }
            return color(d.data.name)
        })
        //return color(d.data.name)})
        .attr("opacity", 0.7)
        .attr("stroke", "white");

    var text = gc.append("text")
        .attr("font-size", "12")
        .attr("text-anchor", "middle")
        .attr("x", d => (d.x1 - d.x0) / 2)
        .attr("y", d => (d.y1 - d.y0) / 2)
        .attr("class", "txt")
        .attr("fill", "white")
        .text(d => (d.data.name.substr(d.data.name.lastIndexOf(".")+1,d.data.name.length) + "-" + d.data.value));
    

}


window.onDrawTreeMapReady = function (data,flag) {
    // 执行绘图逻辑
    drawTreeMap(data,flag);
}