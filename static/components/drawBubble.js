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
        .attr("width", width*0.85)
        .attr("height", height);

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
    					.attr("opacity",0.7)
    					.on("mouseenter", function(event, d) { // "mouseenter" 替代 "mouseover"
								 d3.select(this)
								   .attr("stroke", "#555")
								   .attr("stroke-width", 0.5);
								tooltip.html(d.data.name)
											   .style("left", event.pageX + "px")  // 设置X位置为鼠标事件的X坐标
											   .style("top", event.pageY + "px");  // 设置Y位置为鼠标事件的Y坐标
								})
                        .on("mouseleave", function(event, d) { // "mouseleave" 替代 "mouseout"
                            d3.select(this).attr("stroke", null);
                            tooltip.style("visibility",'false');
                             })
                        .on("click",function(d,i)
                        {
                          console.log(d,i)
                          var fullname = i.data.name.slice(0, -3);;
                          var point=i;
                            while(point.depth>=0&& point.parent)
                            {
                                point=point.parent;
                                fullname = point.data.name +'.'+ fullname; // 使用 + 运算符连接字符串
                            }

                                if(point.data.name=="nn")
                                fullname="torch."+fullname;
                                else
                                fullname=fullname;

                        console.log(d,i,fullname);
                        fetch('http://127.0.0.1:5006/bubbleCode?wanted=' + fullname)
                                .then(response => response.text())
                                .then(data => {
                                 const language = 'python';
                             // 使用 Prism.highlight 方法高亮代码字符串
                                 const highlightedCode = Prism.highlight(data, Prism.languages[language], language);
                                 var tips = d3.select("body")
                                                .append("div")
                                                .attr("class","popup")
                        

                                tips.append("span")
                                    .attr("class","close")
                                    .attr("color","red")
                                    .text("x")
                                    .on("click",function(){
                                    tips.remove();
                                   });

                                tips.append("div")
                                    .attr("class","content")
                                    .html('<pre><code class="language-python">'+highlightedCode+'</code></pre>');

                                    console.log(data);
                                    })
                                .catch(error => {
                                    console.error('Error executing Python script:', error);
                                    // 处理错误
                                });
                        });

    }

 window.onDrawBubbleReady = function(data) {
    // 执行绘图逻辑
    drawBubble(data);
}
