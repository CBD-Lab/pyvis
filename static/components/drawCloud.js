function drawCloud(data,search,cloudCount){
      var width = (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) * 0.84;
      var height = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) * 0.89;

      var arraycolor = new Array(10);
      for (var i = 0; i < 10; i++) {
        arraycolor[i] = color[i];
      }
      var hidata = d3.hierarchy(data);
      var tree=d3.tree()
               .size([height,width*0.7]);
      var hiwords = new Array(hidata.length);
      var root=tree(hidata);
      var links=root.links();
      var worddata=root.descendants();

      cloudCount = worddata.length;
      for (var i = 0; i < worddata.length; i++) {
            if(worddata[i].children)
            hiwords[i] = { text:worddata[i].data.name,size:(worddata[i].height+1)*6 ,leaf:"False",parent:worddata[i].parent,depth:worddata[i].depth};
            else
            hiwords[i] = { text: worddata[i].data.name, size:(worddata[i].height+1)*6 ,leaf:"True" ,parent:worddata[i].parent,depth:worddata[i].depth};
        }
      var wc = d3.layout.cloud()
          .size([width*0.85, height])
          .words(hiwords)
          .padding(0)
          .rotate(0)
          .font("Impact")
          .fontSize(function (d) {
            return d.size;
          })
          .on("end", draw)
          .start();

      function draw(words) {
         var svg=d3.select("#graph").append("svg")
            .attr("id", "cloudsvg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")

         svg.selectAll("text")
            .data(hiwords)
            .enter()
            .append("a")
            .append("text")
            .style("font-size", d => d.size)
            .style("font-family", "Impact")
            .style("cursor", "pointer")
            .style("fill", function (d, i) {
                if(worddata[i].data.linkAll &&
                 ((typeof( worddata[i].data.linkAll['pdfClass']) !== "undefined" && Object.keys(worddata[i].data.linkAll['pdfClass']).length > 0)
                 || (typeof( worddata[i].data.linkAll['gitClass']) !== "undefined" && Object.keys(worddata[i].data.linkAll['gitClass']).length > 0)
                 || (typeof( worddata[i].data.linkAll['pdfModule']) !== "undefined" && Object.keys(worddata[i].data.linkAll['pdfModule']).length > 0)))
                 { return 'black';
                 }
                 else{
                    return color[worddata[i].depth]; }})
            .attr("text-anchor", "middle")
            .attr("transform", function (d) {
              return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .attr("opacity", 0.8)
            .attr("background-color",function(d)
            {
                if(d.leaf=="True")
                {
                return "grey";
                }
            })
            .text(function (d) { return d.text; })
            .on("mouseover", function(d,i){
                d3.select(this)
                    .attr("font-weight", "bold");
                 var fullname = i.text;
              var point = i;
              while (point.depth >= 0 && point.parent) {
                point = point.parent;
                fullname = point.data.name + '.' + fullname;
              }

              var [x, y] = d3.pointer(event);
              var text = d3.select('#svgbox').append("tooltip")
                            .html(fullname)
                            .style("left", (width*0.2) + "px")
                            .style("top", (height*0.2) + "px")
                            .style("position", "absolute")
                            .style("background-color", "white")
                            .style("border-radius", "5px")
                            .style("padding", "5px")
                            .style("box-shadow", "0px 4px 6px rgba(0, 0, 0, 0.1)");
            })
           .on("mouseout", function(d) {
                d3.select(this)
                  .attr("font-weight", "normal");
                d3.select('#svgbox').selectAll("tooltip").remove();
              })
            .on("click", (d, i) => {
             var fullname = i.text.split('.', 1)[0];
              var point = i;
              while (point.depth >= 0 && point.parent) {
                point = point.parent;
                fullname = point.data.name + '.' + fullname;
              }

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
                            var startX = event.x;
                            var startY = event.y;

                            var currentLeft = parseFloat(tips.style("left"));
                            var currentTop = parseFloat(tips.style("top"));

                            offsetX = startX - currentLeft;
                            offsetY = startY - currentTop;
                          })
                          .on("drag", function (event) {
                            tips.style("left", (event.x - offsetX) + "px")
                              .style("top", (event.y - offsetY) + "px");
                          });

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
                })
                .catch(error => {
                  console.error('Error executing Python script:', error);
                });
            });

          var colorrec = d3.select("svg").selectAll('rect')
            .data(arraycolor)
            .enter()
            .append("rect")
            .attr("x", 1100)
            .attr("y", (d, i) => (i * 20 + height * 0.1))
            .attr("width", 18)
            .attr("height", 18)
            .attr("opacity", 0.9)
            .attr("fill", (d, i) => arraycolor[i])
            .on("click", function(d, i) {
                var currentOpacity = d3.select(this).attr("opacity");
                let currentLayer=0;
                for(k=0;k<10;k++)
                {
                    if(color[k]==i){
                        currentLayer=k;
                        break;}
                }
            var allLayerOpacities = [];

            svg.selectAll("text").nodes().forEach(function(textNode,i) {
                var opacity = d3.select(textNode).attr("opacity");
                // 仅保存每一层级的第一个 opacity 值
                allLayerOpacities[hiwords[i].depth] = opacity;
            });
                if(currentOpacity!=0.9){//点击显示当前层级词云数据
                    d3.select(this).attr("opacity","0.9");
                    svg.selectAll("text").attr("opacity", function (d,i) {
                            if (d.depth === currentLayer) {
                                return 0.8;
                            }
                            else
                            {
                                return allLayerOpacities[d.depth];
                            }
                        })
                    }
                else//点击隐藏当前词云数据
                    {
                    svg.selectAll("text").attr("opacity", function (d,i) {
                            if (d.depth === currentLayer) {
                                return 0; // 设置透明度为 0，隐藏元素
                            }
                            else
                            {
                                return allLayerOpacities[d.depth];
                            }
                        })
                    d3.select(this).attr("opacity","0.1");
                    }
            });

          var info = d3.select("svg").append("text")
            .attr("x", width * 0.7)
            .attr("y", 85)
            .attr("font-size", "20px")
            .attr("font-weight", "bold")
            .attr("fill", color[2])

        }
}

window.onDrawCloudReady = function(data,search,cloudCount) {
    console.log('drawTree.js is ready');
    // 执行绘图逻辑
    drawCloud(data,search,cloudCount);
}
