
function drawHiCircle(data){
    d3.select('svg').selectAll('*').remove();
    var svg = d3.select("#graph")
                .append("svg")
                .attr("width", width)
                .attr("height", height);
                

  
    console.log(width)
    console.log(height)
    // 获取具有ID属性的div元素
    var tooltip = document.getElementById("tip");
    if (tooltip) {
        tooltip.parentNode.removeChild(tooltip);
    }

    console.log(width)
    console.log(height)
    // 获取具有ID属性的div元素
   
    var colorrec=svg.selectAll('rect')
                .data(color) 
                
                .enter()
                .append("rect")
                .attr("x",(d,i)=>(i*16+width*0.65))
                .attr("y",20)
                .attr("width",14)
                .attr("height",14)
                .attr("fill",(d,i)=>color[i])
                .attr("opacity",0.7);

    var radius = width /4.8
    var tree= d3.cluster().size([2*Math.PI, radius - 100]);
    console.log(data);
    //var root=tree(d3.hierarchy(data).sort((a, b) => d3.ascending(a.data.name, b.data.name)));
    var root=tree(d3.hierarchy(data));
    console.log(root);
    var links=root.links();
    console.log(links);
    var nodes=root.descendants()
    console.log(nodes);

    svg.append("g")
          .attr("fill", "none")
          .attr("stroke", "#555")
          .attr("stroke-width", 0.5)
        .selectAll("path")
        .data(links)
        .join("path")
        .attr("d", d3.linkRadial()
          .angle(d => d.x)
          .radius(d => d.y));

    svg.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("transform", d => `
        rotate(${d.x * 180 / Math.PI - 90})
        translate(${d.y},0)
      `)
      .attr("fill",d=>color[d.depth])
      .attr("r", d=>(d.height*3+3))
      .attr("opacity",0.7);

      svg.append("g")
              .attr("font-family", "Consolas")
            .attr("stroke-width", 0)
        .selectAll("text")
        .data(root.descendants())
        .join("text")
        .attr("stroke-family","仿宋")
        .attr("font-size", d=>d.height*2+18)
        .attr("font-weight","bold")
        .attr("transform", d => `
            rotate(${d.x * 180 / Math.PI - 90})
            translate(${d.y},0)
            rotate(${d.x >= Math.PI ? 180 : 0})
          `)
        .attr("dy", "0.31em")
        .attr("x", d => d.x < Math.PI === !d.children ? 6 : -6)
        .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
        // .attr("fill", d=>color[d.depth])
        .attr("opacity",0.7)
        .attr("stroke", d=>color[d.depth])
        .text((d,i) =>((d.deep<3)||(i%5==0))?d.data.name:"")
        .clone(true).lower();

      svg.selectAll("g")
      .attr("transform", "translate(" + (width/2) + "," + (height/2) + ")");

}


window.onDrawHiCircleReady = function(data) {
  // 执行绘图逻辑
  drawHiCircle(data);
}