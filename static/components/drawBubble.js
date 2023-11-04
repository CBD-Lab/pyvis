function drawBubble(data) {
      let tooltip = d3.select('body')
        .append('div')
        .attr("id", "tip")
        .attr("class", "tooltips");

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
        .on("mouseenter", (event, d) => {
          d3.select(this.d)
            .attr("stroke", "#555")
            .attr("stroke-width", 0.5);
          tooltip.html(d.data.name)
                 .style("left", event.pageX + "px")
                 .style("top", event.pageY + "px");
        })
        .on("mouseleave", (event, d) => {
          d3.select(this.d).attr("stroke", null);
          tooltip.style("visibility", 'false');
        })
        .on("click", (d, i) => {
          console.log(d, i);
          var fullname = i.data.name.slice(0, -3);
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
          fetch('http://127.0.0.1:5006/bubbleCode?wanted=' + fullname)
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

              console.log(data);
            })
            .catch(error => {
              console.error('Error executing Python script:', error);
            });
        });
}

window.onDrawBubbleReady = data => {
  // 执行绘图逻辑
  drawBubble(data);
};
