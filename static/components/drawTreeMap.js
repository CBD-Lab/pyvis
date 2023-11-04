function drawTreeMap(data) {
    console.log("drawTreeMap");
    var color = d3.scaleOrdinal(d3.schemeCategory10);
    var svg = d3.select("#graph")
        .append("svg")
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

    var rect = gc.append("rect")
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("fill", function (d) {
            while (d.depth > 1) d = d.parent;
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
        .text(d => (d.data.name + "-" + d.data.value));

}


window.onDrawTreeMapReady = function (data) {
    // 执行绘图逻辑
    drawTreeMap(data);
}