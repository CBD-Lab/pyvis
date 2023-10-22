function drawBubble(data){
    let tooltip = d3.select('body')
                        .append('div')
                        .attr("id", "tip") // 添加ID属性
                        .style('position', 'absolute')
                        .style('z-index', '25')
                        .style('color', 'black')
                        .style('font-size', '20px')
                        .style("background-color","white")
                        .style("opacity",1.0)
                        .style("stroke-width",2)
                        .style("border-radius", "10px");
    var svg = d3.select("#graph")
        .attr("width", width)
        .attr("height", height);
    d3.select('svg').selectAll('*').remove();
//       var tooltip = document.getElementById("tip");
//    if (tooltip) {
//        tooltip.parentNode.removeChild(tooltip);
//    }
    var colorrec = svg.selectAll('rect')
        .data(color)
        .enter()
        .append("rect")
        .attr("x", (d, i) => (i * 16 + width * 0.8))
        .attr("y", 20)
        .attr("width", 14)
        .attr("height", 14)
        .attr("fill", (d, i) => color[i]);

    var pack = d3.pack()
        .size([width, height]);
        var hidata = d3.hierarchy(data, function (d) { return d.children})
            .sum(function (d) { return d.value});
        var packdata = pack(hidata);
        var nodes = packdata.descendants();
        var gc = svg.selectAll("g")
            .data(nodes)
            .enter()
            .append("g")
            .attr("transform", function (d) { return "translate(" + d.x + "," +d.y + ")"; });
        var circles = gc.append("circle")
    					.attr("cx", 0)
    					.attr("cy", 0)
   						.attr("r", d => d.r)
    					.attr("fill", d => color[d.depth])
    					.on("mouseenter", function(event, d) { // "mouseenter" 替代 "mouseover"
								 d3.select(this)
								   .attr("stroke", "#000")
								   .attr("stroke-width", 2);
								tooltip.html(d.data.name)
											   .style("left", event.pageX + "px")  // 设置X位置为鼠标事件的X坐标
											   .style("top", event.pageY + "px");  // 设置Y位置为鼠标事件的Y坐标
								})
                        .on("mouseleave", function(event, d) { // "mouseleave" 替代 "mouseout"
                            d3.select(this).attr("stroke", null);
                            tooltip.style("visibility",'false');
                             });

//       var text = gc.append("text")
//            .attr("font-size", "12px")
//            .attr("text-anchor", "middle")
//            .attr("dy", "0.5em")
//            .attr("class", "txt")
//            .attr("id", function (d, i) { return `t${i}`; })// 移除 "#" 符号
//            .attr("fill", "black")
//            .text(function (d) {
//                if (d.depth == 0)
//                    return d.r > 20 ? d.data.name : "";
//                else
//                    return "";
//            });
    }

 window.onDrawBubbleReady = function(data) {
    // 执行绘图逻辑
    drawBubble(data);
}