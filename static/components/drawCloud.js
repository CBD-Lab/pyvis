function drawCloud(data,search){

      var arraycolor = new Array(10);
      for (var i = 0; i < 10; i++) {
        arraycolor[i] = color[i];
      }
      var hidata = d3.hierarchy(data);
//      var worddata = hidata.descendants();
      var tree=d3.tree()
               .size([height,width*0.7]);
      var hiwords = new Array(hidata.length);
      var root=tree(hidata);
      var links=root.links();
      var worddata=root.descendants();
      console.log(worddata);
      for (var i = 0; i < worddata.length; i++) {
//          hiwords[i] = { text: worddata[i].data.name, size:(worddata[i].height+1)*6 };
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
          //   if(d.leaf=="True")
            //    {
              //  return "black";
               // }
             //else
                return color[worddata[i].depth]; })
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
			    console.log('over',d,i);
                d3.select(this)
                    .attr("font-weight", "bold");
                 var fullname = i.text;
              var point = i;
              while (point.depth >= 0 && point.parent) {
                point = point.parent;
                fullname = point.data.name + '.' + fullname;
              }

              if(fullname.substring(0,2)=='nn')
                {
                fullname="torch."+fullname;
                }

                var [x, y] = d3.pointer(event);
                var text = d3.select('#svgbox').append("tooltip")
                            .html(fullname)
                            .style("left", (width*0.2) + "px")
                            .style("top", (height*0.2) + "px")
                            .style("position", "absolute");
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

              if(fullname.substring(0,2)=='nn')
                {
                fullname="torch."+fullname;
                }
              console.log(d, i, fullname);
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

          var colorrec = d3.select("svg").selectAll('rect')
            .data(arraycolor)
            .enter()
            .append("rect")
            .attr("x", (d, i) => (i * 20 + width * 0.8))
            .attr("y", 20)
            .attr("width", 18)
            .attr("height", 18)
            .attr("opacity", 0.8)
            .attr("fill", (d, i) => arraycolor[i]);

          var info = d3.select("svg").append("text")
            .attr("x", width * 0.7)
            .attr("y", 85)
            .attr("font-size", "20px")
            .attr("font-weight", "bold")
            .attr("fill", color[2])
            .text("Totally " + worddata.length+" Nodes")

        }
}

window.onDrawCloudReady = function(data,search) {
    console.log('drawTree.js is ready');
    // 执行绘图逻辑
    drawCloud(data,search);
}
