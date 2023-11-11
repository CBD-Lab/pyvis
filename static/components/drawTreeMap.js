function drawTreeMap(data, flag) {

    var width = (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) * 0.83;
    var height = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) * 0.89;
    var color = d3.scaleOrdinal(d3.schemeCategory10);
    var svg = d3.select("#graph")
        .attr("width", width)
        .attr("height", height);

    var treemap = d3.treemap()
        .size([width, height]);


    //console.log(data);
    var hidata = d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);
    //console.log(hidata);
    var treedata = treemap(hidata);
    //console.log(treedata);
    nodes = treedata.leaves()       //��Flare.jsonΪ��,��252���ڵ�
    //console.log(nodes);

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
            while (d.depth > 1) {
                if (flag) {
                    d = d.parent;
                }
                else {
                    break;
                }
            }
            return color(d.data.name)
        })
        .attr("opacity", 0.7)
        .attr("stroke", "white")
        .on("mouseover", function (event, d) {

            // 设置其他矩形的pointer-events为"none"
            d3.selectAll("rect").filter(e => e !== d).style("pointer-events", "none");

            d3.select(this)
                .attr("opacity", 1.0) // 鼠标悬停时矩形透明度为1
                .transition()
                .duration(300) // 过渡时间
                .attr("width", d => (d.x1 - d.x0) * 1.2) // 放大矩形
                .attr("height", d => (d.y1 - d.y0) * 1.2)
                .attr("rx", 10) // 圆角半径变为10
                .attr("ry", 10)
                .attr("z-index", 100);
    
            // 选择相应的文本元素并添加过渡动画
            d3.select(this.parentNode).select(".txt").raise()
                .transition()
                .duration(300) // 过渡时间
                .attr("font-size", "16") // 变化后的字体大小
                .attr("x", d => (d.x1 - d.x0) * 1.2 / 2)
                .attr("y", d => (d.y1 - d.y0) * 1.2 / 2)
                .text(d => (d.data.name + "-" + d.data.value));
        })
        .on("mouseout", function (event, d) {
            d3.select(this)
                .attr("opacity", 0.7) // 鼠标离开时矩形透明度为0.7
                .transition()
                .duration(300) // 过渡时间
                .attr("width", d => d.x1 - d.x0) // 恢复原始矩形大小
                .attr("height", d => d.y1 - d.y0)
                .attr("rx", 0) // 圆角半径恢复为0
                .attr("ry", 0);
    
            // 选择相应的文本元素并添加过渡动画
            d3.select(this.parentNode).select(".txt")
                .transition()
                .duration(300) // 过渡时间
                .attr("font-size", "12") // 恢复原始字体大小
                .attr("x", d => (d.x1 - d.x0) / 2)
                .attr("y", d => (d.y1 - d.y0) / 2)
                .text(d => (d.data.name));
            // 恢复其他矩形的pointer-events为默认值
            d3.selectAll("rect").style("pointer-events", "auto");
        })
    

    var text = gc.append("text")
        .attr("font-size", "12")
        .attr("text-anchor", "middle")
        .attr("x", d => (d.x1 - d.x0) / 2)
        .attr("y", d => (d.y1 - d.y0) / 2)
        .attr("class", "txt")
        .attr("fill", "white")
        .text(d => (d.data.name));


}


window.onDrawTreeMapReady = function (data, flag) {
    // 执行绘图逻辑
    drawTreeMap(data, flag);
}