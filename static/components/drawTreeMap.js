function drawTreeMap(data, flag, pdf, mapCount) {
    
    var width  = (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) * 0.83;
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
    nodes = treedata.leaves();

    mapCount.node = nodes.length;

    var gc = svg.selectAll("g")
        .data(nodes)
        .enter()
        .append("g")
        .attr("id", function (d, i) { 
            return i; 
        });
    var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

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
        .attr("transform", function (d) { return "translate(" + d.x0 + "," + d.y0 + ")"; })
        .attr("opacity", 0.7)
        .attr("stroke", "white")
        .attr("cursor", "pointer")
        .on("mouseover", function (event, d) {
            d3.select(this)
                .attr("opacity", 1.0) // 鼠标悬停时矩形透明度为1

            // 选择相应的文本元素并添加过渡动画
            d3.select(this.parentNode).select(".txt").raise()
                .transition()
                .duration(300) // 过渡时间
                .attr("font-size", "16") // 变化后的字体大小
                .text(d => (d.data.name + "-" + d.data.value));
        })
        .on("mouseout", function (event, d) {
            d3.select(this)
                .attr("opacity", 0.7) // 鼠标离开时矩形透明度为0.7

            // 选择相应的文本元素并添加过渡动画
            d3.select(this.parentNode).select(".txt")
                .transition()
                .duration(300) // 过渡时间
                .attr("font-size", "12") // 恢复原始字体大小
                .text(d => (d.data.name))
        })
        .on("click", (d, i) => {
            
            var fullname = i.data.name.split('.', 1)[0];
            console.log("treemap fullname:",fullname);
            var point = i;
              while (point.depth >= 0 && point.parent) {
                point = point.parent;
                fullname = point.data.name + '.' + fullname;
              }
              if(fullname.substring(0,2)=='nn')
              {
              fullname="torch."+fullname;
              }
            console.log("treemap fullname:",fullname);

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
                })
                .catch(error => {
                    console.error('Error executing Python script:', error);
                });
        });
    var pdfFiles = [];
    // 获取第一个矩形块的左上角位置
    var firstRect = rect.filter((d, i) => i === 0);
    var rectLeft = firstRect.attr("x");
    var rectTop = firstRect.attr("y");
        
    firstRect.on("mouseover", function (event, d) {
        tooltip.transition()
            .duration(300)
            .style("opacity", .9);
        tooltip.html("PDF Files: " + pdfFiles.join(", "))
            .style("left", rectLeft + 230 + "px")
            .style("top", rectTop + 100 + "px");
        d3.select(this)
            .attr("opacity", 1.0) // 鼠标悬停时矩形透明度为1

        // 选择相应的文本元素并添加过渡动画
        d3.select(this.parentNode).select(".txt").raise()
            .transition()
            .duration(300) // 过渡时间
            .attr("font-size", "16") // 变化后的字体大小
            .text(d => (d.data.name + "-" + d.data.value));
    })
    .on("mouseout", function (d) {
        tooltip.transition()
            .duration(300)
            .style("opacity", 0);
        d3.select(this)
            .attr("opacity", 0.7) // 鼠标离开时矩形透明度为0.7

        // 选择相应的文本元素并添加过渡动画
        d3.select(this.parentNode).select(".txt")
            .transition()
            .duration(300) // 过渡时间
            .attr("font-size", "12") // 恢复原始字体大小
            .text(d => (d.data.name))
    });

    rect.each(function(d) {
        
        if(d.data.linkAll
        &&
        ((typeof( d.data.linkAll['pdfClass']) !== "undefined" && Object.keys(d.data.linkAll['pdfClass']).length > 0)||(typeof( d.data.linkAll['gitClass']) !== "undefined" && Object.keys(d.data.linkAll['gitClass']).length > 0)))
            {
                
                pdfFiles.push(d.data.name);
                if(pdf){
                    console.log("带有pdf的文件为：",d.data.name);
                    d3.select(this)
                    .append("foreignObject")
                    .attr("width", "8px")
                    .attr("height", "15px")
                    .attr("fill","black")
                    .attr("x", function(event,d) {
                        return d.children || d._children ? -30 : 10+100;
                    })
                    .attr("y",-10)
                    .append("xhtml:div")
                    .style("margin", 0)
                    .style("padding", 0)
                    .html('<img src="http://127.0.0.1:5006/get_svg/fileBox.svg" width="100%" height="100%" />')
                    .on("click",function(event,d)
                    {
                        textclick(event,d);
                    })
                }
            }
        
        if (d.data.linkAll && typeof(d.data.linkAll["pdfModule"]) !== "undefined" && d.data.linkAll["pdfModule"].length > 0) {
        d3.select(this)
            .append("foreignObject")
            .attr("width", "8px")
            .attr("height", "15px")
            .attr("x", function(event,d) {
                return d.children || d._children ? -30 : 20+100;
            })
            .attr("y",-10)
                .append("xhtml:div")
                .style("margin", 0)
                .style("padding", 0)
                .html('<img src="http://127.0.0.1:5006/get_svg/pdf.svg" width="100%" height="100%" />')
                .on("click",function()
                {
                var link = d.data.linkAll['pdfModule'];
                window.open(link, '_blank');
                })

        }
    });
        
    function textclick(event,d){
            var pdfClass=d.data.linkAll&&d.data.linkAll['pdfClass']?d.data.linkAll['pdfClass']:'';
            var gitClass=d.data.linkAll&&d.data.linkAll['gitClass']?d.data.linkAll['gitClass']:'';

            d3.select("#miniTree")
                .remove();
            d3.select(".rectout").remove();
            if(d.height==0){
                var point=d;
                var fullname = d.data.name.slice(0, d.data.name.lastIndexOf("."));
                while(point.depth>=0&& point.parent)
                    {
                        point=point.parent;
                        fullname = point.data.name +'.'+ fullname;
                    }
                fetch('http://127.0.0.1:5006/treeLeaf?wanted=' + fullname)
                    .then(response => response.json())
                    .then(data => {
                    if(data !== "null"){
                    var datain=data.jsoninside;
                    var dataout=data.jsonoutside;
                    const jsontree = toJson(fullname,dataout);

                    drawOutTree(nodes,links,datain,jsontree,event.pageX,event.pageY,pdfClass,gitClass);
                    } })
                    .catch(error => {
                        console.error('Error executing Python script:', error);
                    });
            }
    }

    d3.select("input[id=length]").on("change", function () { //修改width和height以实现对矩形块进行缩放
		var newScale = +this.value; // 获取输入框的值并转换为数字
        width = width * newScale * 0.01;
        height = height * newScale * 0.01;
        svg.attr("width", width)
            .attr("height", height);
        // 更新矩形块的宽度和高度
        
        rect.attr("transform", function (d) { return "translate(" + d.x0 * newScale * 0.01 + "," + d.y0 * newScale * 0.01 + ")"; })
        rect.attr("width", d => (d.x1 - d.x0) * newScale * 0.01)
            .attr("height", d => (d.y1 - d.y0) * newScale * 0.01)
        text.attr("x", d => (d.x1 - d.x0) / 2 * newScale * 0.01)
            .attr("y", d => (d.y1 - d.y0) / 2 * newScale * 0.01) 
            .attr("transform", function (d) { return "translate(" + d.x0 * newScale * 0.01 + "," + d.y0 * newScale * 0.01 + ")"; })
    });

    var text = gc.append("text")
        .attr("font-size", "12")
        .attr("text-anchor", "middle")
        .attr("x", d => (d.x1 - d.x0) / 2)
        .attr("y", d => (d.y1 - d.y0) / 2)
        .attr("transform", function (d) { return "translate(" + d.x0 + "," + d.y0 + ")"; })
        .attr("class", "txt")
        .attr("fill", "white")
        .text(d => (d.data.name));


}


window.onDrawTreeMapReady = function (data, flag, pdf, mapCount) {
    // 执行绘图逻辑
    drawTreeMap(data, flag, pdf, mapCount);
}