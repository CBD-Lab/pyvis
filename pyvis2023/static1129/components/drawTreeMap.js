function drawTreeMap(data, flag, pdf, mapCount) {
    
    var width  = (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) * 0.83;
    var height = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) * 0.98;
    var color = d3.scaleOrdinal(d3.schemeCategory10);

    var pdfs = new Map();
    var gits = new Map();
    var pdfchange = 0;
    var gitchange = 0;

    var svg = d3.select("#graph")
        .attr("width", width)
        .attr("height", height);

    var treemap = d3.treemap()
        .size([width, height]);

    //console.log("data:",data);
    var hidata = d3.hierarchy(data)
        .sum(d => Math.sqrt(Math.sqrt(d.value)))
        .sort((a, b) => b.value - a.value);
    //console.log("hidata",hidata);
    var treedata = treemap(hidata);
    //console.log("treedata:",treedata);

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
    if(d.data.linkAll && typeof( d.data.linkAll['pdfClass']) !== "undefined" && Object.keys(d.data.linkAll['pdfClass']).length > 0)
            {
                for (key in d.data.linkAll['pdfClass']){
                    pdfs.set(key,d.data.linkAll['pdfClass'][key]);
                }
            }
            if(d.data.linkAll && typeof( d.data.linkAll['gitClass']) !== "undefined" && Object.keys(d.data.linkAll['gitClass']).length > 0)
            {
                for (key in d.data.linkAll['gitClass']){
                    gits.set(key,d.data.linkAll['gitClass'][key]);
                }
            }
            if (d.data.linkAll && typeof(d.data.linkAll["pdfModule"]) !== "undefined" && d.data.linkAll["pdfModule"].length > 0)
            {
                var fullname = d.data.name.split('.', 1)[0]; 
                var point = d;
                while (point.depth >= 0 && point.parent) {
                    point = point.parent;
                    fullname = point.data.name + '.' + fullname;
                }
                fullname = fullname;
                pdfs.set(fullname,d.data.linkAll['pdfModule'][0])
            }
});

    d3.select("input[id=length]").on("change", function () { //修改width和height以实现对矩形块进行缩放
		var newScale = +this.value; // 获取输入框的值并转换为数字
        var width1 = width * newScale * 0.01;
        var height1 = height * newScale * 0.01;
        svg.attr("width", width1)
            .attr("height", height1);
        // 更新矩形块的宽度和高度
        
        rect.attr("transform", function (d) { return "translate(" + d.x0 * newScale * 0.01 + "," + d.y0 * newScale * 0.01 + ")"; })
        rect.attr("width", d => (d.x1 - d.x0) * newScale * 0.01)
            .attr("height", d => (d.y1 - d.y0) * newScale * 0.01)
        text.attr("x", d => (d.x1 - d.x0) / 2 * newScale * 0.01)
            .attr("y", d => (d.y1 - d.y0) / 2 * newScale * 0.01) 
            .attr("transform", function (d) { return "translate(" + d.x0 * newScale * 0.01 + "," + d.y0 * newScale * 0.01 + ")"; })
    });

    d3.select("input[id=showPdf4]").on("change", function () {
        console.log('showpdf',gits);
        if (pdfchange == 0)
			pdfchange = 1;
		else
			pdfchange = 0;
	    if(pdfchange==1){
            var pdfinfo = d3.select('#svgbox').append("div")
                        .attr("class", "tooltip")
                        .attr('id','pdfshow4')
                        .style("left", (width * 0.2) + "px")
                        .style("top", (height * 0.15) + "px")
                        .style("background-color", "white")
                        .style("border-radius", "5px")
                        .style("padding", "5px")
                        .style("box-shadow", "0px 2px 4px rgba(0, 0, 0, 0.1)")
                        .style('list-style','none');

            pdfinfo.append("foreignObject")
                    .attr("height", "12px")
                    .append("xhtml:div")
                    .style("display", "flex")
                    .style("align-items", "center")
                    .style("margin", 0)
                    .style("padding", 0)
                    .html('<img src="http://127.0.0.1:5006/get_svg/pdf.svg" style="width: 8px; height: 15px; margin-right: 5px;"/>')
                    .append("span")
                    .attr("class", "close")
                    .attr("color", "red")
                    .text("x")
                    .style("position", "absolute")
                    .style('right',"0")
                    .on("click", () => {
                      pdfinfo.remove();
                      d3.select("input#showPdf4").property("checked", false);
                      pdfchange = 0;
                    });
            if (pdfs.size == 0){
                pdfinfo.append('text')
                    .attr("stroke-family", "仿宋")
                    .attr("font-size", "10px")
                    .text("no PDF!");
            }
            else{
                pdfs.forEach((value, key) => {
                    console.log('vk', value, key);
                    pdfinfo.append('text')
                        .attr("stroke-family", "仿宋")
                        .attr("font-size", "10px")
                        .text(key)
                        .on("click",function()
                        {
    //                        console.log(d);
                            pdfgitclick(key);
                        });
                    pdfinfo.append('br');
                });
            }
        }
        else{
            d3.select('#pdfshow4').remove();
        }
    });
    d3.select("input[id=showGit4]").on("change", function () {
        console.log('sp',gits);
        if (gitchange == 0)
			gitchange = 1;
		else
			gitchange = 0;
	    if(gitchange==1){
            var gitinfo = d3.select('#svgbox').append("div")
                        .attr("class", "tooltip")
                        .attr('id','gitshow4')
                        .style("left", (width * 0.2) + "px")
                        .style("top", (height * 0.15) + "px")
                        .style("background-color", "white")
                        .style("border-radius", "5px")
                        .style("padding", "5px")
                        .style("box-shadow", "0px 2px 4px rgba(0, 0, 0, 0.1)")
                        .style('list-style','none');
            gitinfo.append("foreignObject")
                    .attr("height", "12px")
                    .append("xhtml:div")
                    .style("display", "flex")
                    .style("align-items", "center")
                    .style("margin", 0)
                    .style("padding", 0)
                    .html('<img src="http://127.0.0.1:5006/get_svg/github.svg" style="width: 10px; height: 10px; margin-right: 5px;"/>')
                    .append("span")
                    .attr("class", "close")
                    .attr("color", "red")
                    .text("x")
                    .style("position", "absolute")
                    .style('right',"0")
                    .on("click", () => {
                      gitinfo.remove();
                      d3.select("input#showGit4").property("checked", false);
                      gitchange = 0;
                    });
            if (gits.size == 0){
                gitinfo.append('text')
                    .attr("stroke-family", "仿宋")
                    .attr("font-size", "10px")
                    .text("no GitHub files !");
            }
            else{
                gits.forEach((value, key) => {
                    console.log('vk', value, key);
                    gitinfo.append('text')
                        .attr("stroke-family", "仿宋")
                        .attr("font-size", "10px")
                        .text(key)
                        .on("click",function()
                        {
    //                        console.log(d);
                            pdfgitclick(key);
                        });
                    gitinfo.append('br');
                });
            }
        }
        else{
            d3.select('#gitshow4').remove();
        }
	});


	function pdfgitclick(classname){
        console.log('pgc',classname);
        fetch('http://127.0.0.1:5006/classVariable?wanted=' + classname)
        .then(response => response.json())
        .then(data => {
            var tips = d3.select("body")
                        .append("div")
                        .attr("class","popup")
                        .style("width", "500px")
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

            // 将拖拽行为绑定到要拖拽的元素上
            tips.call(drag);
            var closeButton=tips.append("span")
                      .attr("class","close")
                      .attr("color","red")
                      .text("x")
                      .on("click",function(){
                      d3.select(".popup").remove();
                      });
            // 设置关闭按钮位置
            closeButton.style("position", "fixed")
                      .style("top", "0")
                      .style("left", "0");
            var contentContainer = tips.append("div").attr("class", "content-container");
            var tableContainer = contentContainer.append("table").attr("class", "var-fun-container var-fun-container table-style");
            var tableHeader = tableContainer.append("thead").append("tr");
            tableHeader.append("th").text("Variable"); // 表头列1
            tableHeader.append("th").text("Function"); // 表头列2

            var tableBody = tableContainer.append("tbody"); // 创建表格主体部分
            var row = tableBody.append("tr"); // 创建一行
            row.append("td").attr("class", "contentVar").style("color", "green").html(data['var'].join("<br>")); // 第一列
            row.append("td").attr("class", "contentFun").style("color", "blue").html(data['fun'].join("<br>")); // 第二列
            var docContainer = tips.append("div").attr("class", "contentDoc-container");
            var textWithLinks = data['doc'];
            var linkRegex = /(\bhttps?:\/\/\S+\b)/g;// \b匹配单词边界，\s查找空白字符
            //                    var linkRegex = /(\bhttps?:\/\/\S+?(?=\s|<|\|$))/g

            var textWithFormattedLinks = linkRegex?textWithLinks.replace(linkRegex, '<a href="$1" target="_blank">$1</a>'):'';

            docContainer.append("div")
                .attr("class", "contentDoc")
                .style("white-space", "pre-line")
                .html(textWithFormattedLinks);
            tips.append("div")
                .attr("class","contentPdf")
                .html(data['pdf']+"<br>")
        })
        .catch(error => {
            console.error('Error executing Python script:', error);
        // 处理错误
        });
    }

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