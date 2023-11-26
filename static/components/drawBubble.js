function drawBubble(data,bubbleCount) {
      let tooltip = d3.select('body')
        .append('div')
        .attr("id", "tip")
        .attr("class", "tooltips");

      var pdfs = new Map();
      var gits = new Map();
      var pdfchange = 0;
      var gitchange = 0;

      var svg = d3.select("#graph")
        .attr("width", width * 0.85)
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
      var hidata = d3.hierarchy(data, d => d.children)
        .sum(d => d.value);
      var packdata = pack(hidata);
      var nodes = packdata.descendants();
      var gc = svg.selectAll("g")
        .data(nodes)
        .enter()
        .append("g")
        .attr("transform", d => `translate(${d.x},${d.y})`);
     var circles = gc.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", d => d.r)
        .attr("fill", d => color[d.depth])
        .attr("opacity", 0.7)
        .style("cursor", "pointer")
        .on("mouseenter", (event, d) => {
          d3.select(this.d)
            .attr("stroke", "#555")
            .attr("stroke-width", 0.5);
          var fullname = d.data.name;
          var point = d;
          while (point.depth >= 0 && point.parent) {
            point = point.parent;
            fullname = point.data.name + '.' + fullname;
          }
          fullname = fullname;
          tooltip.html(fullname)
                 .style("left", event.pageX + "px")
                 .style("top", event.pageY + "px")
                 .style("background-color", "white")
                .style("border-radius", "5px")
                .style("padding", "5px")
                .style("box-shadow", "0px 2px 4px rgba(0, 0, 0, 0.1)");
        })
        .on("mouseleave", (event, d) => {
          d3.select(this.d).attr("stroke", null);
          tooltip.style("visibility", 'false');
        })
        .on("click", (d, i) => {
          console.log(d, i);
          var fullname = i.data.name.split('.', 1)[0];
          var point = i;
          while (point.depth >= 0 && point.parent) {
            point = point.parent;
            fullname = point.data.name + '.' + fullname;
          }

          if (point.data.name == "nn")
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
        .on("contextmenu", (d,i)=> {
            d.preventDefault();
            var pdfinfo = d3.select('#svgbox').append("div")
                        .attr("class", "tooltip")
                        .style("left", (width * 0.2) + "px")
                        .style("top", (height * 0.15) + "px")
            pdfinfo.append("span")
                  .attr("class", "close")
                  .attr("color", "red")
                  .text("x")
                  .on("click", () => {
                         pdfinfo.remove();
                });
            console.log('c',i);
            if (i.height>0){
                traverseTree(i);
            }
            else{
                getpdfgit(i);
            }
//            traverseTree(i);
            function traverseTree(node) {
//                console.log(node.value); // 打印当前节点的值
                node.children.forEach(function(child) {
                console.log('mc',child);
                if (child.height>0){
                    traverseTree(child);
                }
                else{
                    getpdfgit(child);
                }
            })}
            function getpdfgit(i){
                console.log('diaoyong',i);
                if(i.data.linkAll && typeof( i.data.linkAll['pdfClass']) !== "undefined" && Object.keys(i.data.linkAll['pdfClass']).length > 0)
                {
                    for (key in i.data.linkAll['pdfClass']){
                        pdfinfo.append("foreignObject")
                            .attr("height", "12px")
                            .append("xhtml:div")
                            .style("display", "flex")
                            .style("align-items", "center")
                            .style("margin", 0)
                            .style("padding", 0)
                            .html('<img src="http://127.0.0.1:5006/get_svg/pdf.svg" style="width: 8px; height: 15px; margin-right: 5px;"/>')
                            .append('text')
                            .attr("stroke-family", "仿宋")
                            .attr("font-size", "10px")
                            .text(key)
                            .on('click',d =>{pdfgitclick(key);});
//                        pdfinfo.append('br');
                    };
                }
                if(i.data.linkAll && typeof(i.data.linkAll['gitClass']) !== "undefined" && Object.keys(i.data.linkAll['gitClass']).length > 0)
                {
    //                console.log("带有pdf的文件为：",d.data.name);
                    for (key in i.data.linkAll['gitClass']){
                        pdfinfo.append("foreignObject")
                            .attr("height", "12px")
                            .append("xhtml:div")
                            .style("display", "flex")
                            .style("align-items", "center")
                            .style("margin", 0)
                            .style("padding", 0)
                            .style("line-height", "1")
                            .html('<img src="http://127.0.0.1:5006/get_svg/github.svg" style="width: 8px; height: 15px; margin-right: 5px;"/>')
                            .append('text')
                            .attr("stroke-family", "仿宋")
                            .attr("font-size", "10px")
                            .text(key)
                            .on('click',d =>{pdfgitclick(key);});
//                        pdfinfo.append('br').style("margin", "0");
                    }
                }
                if (i.data.linkAll && typeof(i.data.linkAll["pdfModule"]) !== "undefined" && i.data.linkAll["pdfModule"].length > 0)
                {
                    pdfinfo.append("foreignObject")
                            .attr("height", "12px")
                            .append("xhtml:div")
                            .style("display", "flex")
                            .style("align-items", "center")
                            .style("margin", 0)
                            .style("padding", 0)
                            .html('<img src="http://127.0.0.1:5006/get_svg/pdf.svg" style="width: 8px; height: 15px; margin-right: 5px;"/>')
                            .append('text')
                            .attr("stroke-family", "仿宋")
                            .attr("font-size", "10px")
                            .text(i.data.name);
//                    pdfinfo.append('br');
                }
            }

        })
        .each(function(d) {
            if(d.data.linkAll && typeof( d.data.linkAll['pdfClass']) !== "undefined" && Object.keys(d.data.linkAll['pdfClass']).length > 0)
            {
                for (key in d.data.linkAll['pdfClass']){
                    pdfs.set(key,d.data.linkAll['pdfClass'][key]);
                }
                console.log('d',d);
            }
            if(d.data.linkAll && typeof( d.data.linkAll['gitClass']) !== "undefined" && Object.keys(d.data.linkAll['gitClass']).length > 0)
            {
                for (key in d.data.linkAll['gitClass']){
                    gits.set(key,d.data.linkAll['gitClass'][key]);
                }
                console.log('e',d);
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
                console.log('pm',fullname);
                pdfs.set(fullname,d.data.linkAll['pdfModule'][0])
            }
            });
    console.log(circles)
    circles.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .attr("dy", ".35em")
        .style("text-anchor", "middle")
        .style("fill", "black")
        .text(d => {
            return d.data.name;
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
     bubbleCount = nodes.length;
     d3.select("input[id=showPdf]").on("change", function () {
        console.log('sp',gits);
        if (pdfchange == 0)
			pdfchange = 1;
		else
			pdfchange = 0;
	    if(pdfchange==1){
            var pdfinfo = d3.select('#svgbox').append("div")
                        .attr("class", "tooltip")
                        .attr('id','pdfshow')
                        .style("left", (width * 0.2) + "px")
                        .style("top", (height * 0.15) + "px")
                        .style("background-color", "white")
                        .style("border-radius", "5px")
                        .style("padding", "5px")
                        .style("box-shadow", "0px 2px 4px rgba(0, 0, 0, 0.1)")
                        .style('list-style','none');

            pdfs.forEach((value, key) => {
                console.log('vk', value, key);
                pdfinfo.append('text')
                    .attr("stroke-family", "仿宋")
                    .attr("font-size", "10px")
                    .text(key)
                    .on("click",function()
                    {
//                        console.log(d);
                        window.open(value, '_blank');
                    });
                pdfinfo.append('br');
            });
        }
        else{
            d3.select('#pdfshow').remove();
        }
//         d3.select('#svgbox').append("div")
//            .attr("class", "tooltip")
//
//            .data(Object.entries(gits)) // 将Map的键值对转换为数组
//            .enter()
//            .append("p") // 添加p元素用于显示键值对
//            .text(function(d) {
//                console.log(d);
//                return d[0] + ": " + d[1]; // 设置p元素的文本内容为键值对
////                return 'ceshi';
//            });
	});
	d3.select("input[id=showGit]").on("change", function () {
//        console.log('sp',gits);
        if (gitchange == 0)
			gitchange = 1;
		else
			gitchange = 0;
	    if(gitchange==1){
            var gitinfo = d3.select('#svgbox').append("div")
                        .attr("class", "tooltip")
                        .attr('id','gitshow')
                        .style("left", (width * 0.2) + "px")
                        .style("top", (height * 0.15) + "px")
                        .style("background-color", "white")
                        .style("border-radius", "5px")
                        .style("padding", "5px")
                        .style("box-shadow", "0px 2px 4px rgba(0, 0, 0, 0.1)")
                        .style('list-style','none');

            gits.forEach((value, key) => {
                console.log('vk', value, key);
                gitinfo.append('text')
                    .attr("stroke-family", "仿宋")
                    .attr("font-size", "10px")
                    .text(key)
                    .on("click",function()
                    {
//                        console.log(d);
                        window.open(value, '_blank');
                    });
                gitinfo.append('br');
            });
        }
        else{
            d3.select('#gitshow').remove();
        }
	});
}

window.onDrawBubbleReady = function(data,bubbleCount) {
  // 执行绘图逻辑
  drawBubble(data,bubbleCount);
};
