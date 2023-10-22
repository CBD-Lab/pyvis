function drawCloud(data){
    d3.select('svg').selectAll('*').remove();
    // 获取具有ID属性的div元素
    var tooltip = document.getElementById("tip");
    if (tooltip) {
        tooltip.parentNode.removeChild(tooltip);
    }
      var arraycolor = new Array(10);
      for (var i = 0; i < 10; i++) {
        arraycolor[i] = color[i];
      }
      var hidata = d3.hierarchy(data);
      console.log(hidata);
      var worddata = hidata.descendants();
      console.log(worddata.length);
      var hiwords = new Array(worddata.length);
      for (var i = 0; i < worddata.length; i++) {
          hiwords[i] = { text: worddata[i].data.name, size: Math.sqrt(worddata[i].value / 400) };
          console.log(hiwords[i]);
        }

      var wc = d3.layout.cloud()
          .size([width, height])
          .words(hiwords)
          .padding(0)
          .rotate(0)
          .font("Impact")
          .fontSize(function (d) {
            return d.size > 12 ? d.size : 12;
          })
          .on("end", draw)
          .start();

       function draw(words) {
          d3.select("#graph").append("svg")
            .attr("id", "mysvg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
            .selectAll("text")
            .data(hiwords)
            .enter()
            .append("a")
            .append("text")
            .style("font-size", d => d.size)
            .style("font-family", "Impact")
            .style("fill", function (d, i) { return color[worddata[i].depth]; })
            .attr("text-anchor", "middle")
            .attr("transform", function (d) {
              return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .attr("opacity", 0.8)
            .text(function (d) { return d.text; });

          var colorrec = d3.select("svg").selectAll('rect')
            .data(arraycolor)
            .enter()
            .append("rect")
            .attr("x", (d, i) => (i * 20 + width * 0.86))
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
            .text("Totally " + worddata.length+" Nodes");
        }
}
            //end drawWordCloud

window.onDrawCloudReady = function(data) {
    console.log('drawTree.js is ready');
    // 执行绘图逻辑
    drawCloud(data);
}
