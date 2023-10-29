function drawTree(data){
     let tooltiptree = d3.select('body')
                            .append('div')
                            .attr("id", "tiptree") // 添加ID属性
                            .style('position', 'absolute')
                            .style('z-index', '25')
                            .style('color', 'black')
                            .style('font-size', '12px')
                            .style("background-color","#AAF")
                            .style("opacity",0.8)
                            .style("stroke-width",0.5)
                            .style("border-radius", "2px")
                            .style("width",30)
                            .style("height",100);
    var svg = d3.select("#graph")
            .attr("width", width*0.85)
            .attr("height", height);
       var tree=d3.tree()
               .size([height,width*0.7]);
       console.log(data,typeof(data));
       var hi=d3.hierarchy(data);
       var root=tree(hi);
       var links=root.links();
       var nodes=root.descendants();
       console.log(nodes);
    var gc=svg.append("g")
              .attr("transform","translate(" + (width/40) + "," + (height/100) + ")");
    var lines=gc.selectAll("path")
                .data(links)
                .enter()
                .append("path")
                .attr("fill","none")
                .attr("stroke","#555")
                .attr("stroke-width",0.5)
                .attr("opacity",0.5)
                .attr("d",d3.linkHorizontal()          //d3.linkHorizontal()
                            .x(d=>d.y)
                            .y(d=>d.x)
                );
    var mynode=gc.selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("cx",d=>d.y)
            .attr("cy",d=>d.x)
            //.attr("r",d=>(d.height+2)*2)
            .attr("r",d=>d.value?d.value:5)
            .attr("fill",(d,i)=>color[d.depth])
            .attr("opacity",0.5)
            .attr("stroke","#555");

    var nodetxt=gc.selectAll("text")
            .data(nodes)
            .enter()
            .append("a")
            .append("text")
            .attr("x",d=>d.height==0?parseFloat(d.data.value)/240+d.y:d.y)
            .attr("y",d=>d.x)
            .attr("dx",(d,i)=>d.height==0?"0em":"-1em")
            .attr("dy","0.5em")
            .attr("text-anchor",(d,i)=>d.height==0?"start":"end")
            .attr("font-size","12")
            .attr("fill",(d,i)=>i%2==0?"green":"orange")
            .text(d=>d.data.name)
            .on('mouseover',function(event,d){
                d3.select(this)
                  .attr("fill", "red")
                  .attr("font-weight","bold");
                var point=d;
                var fullname = d.data.name.slice(0, d.data.name.lastIndexOf("."));
                while(point.depth>=0&& point.parent)
                {
                    point=point.parent;
                    fullname = point.data.name +'.'+ fullname; // 使用 + 运算符连接字符串
                }
                fullname="torch."+fullname;
                fetch('http://127.0.0.1:5006/treeLeaf?wanted=' + fullname)
                    .then(response => response.json())
                    .then(data => {
                    if(data !== "null"){
                    var datain=data.jsoninside;
                    var dataout=data.jsonoutside;
                    console.log(data,dataout);
//                    draw outside class
                    const jsontree = toJson(fullname,dataout);
                    console.log(jsontree);
                    drawOutTree(jsontree,event.pageX,event.pageY);
//                    draw inside class
                    var formattedData = datain.replace(/"/g, '').replace(/\\n/g, '<br>').replace(/\\/g, '');
                    tooltiptree.html(formattedData)
					   .style("left", event.pageX + "px")  // 设置X位置为鼠标事件的X坐标
					   .style("top", event.pageY + "px");  // 设置Y位置为鼠标事件的Y坐标
                   } })
                    .catch(error => {
                        console.error('Error executing Python script:', error);
                        // 处理错误
                    });
            })
            .on('mouseout',function(d,i){
                d3.select(this)
                  .attr("fill", (d,i)=>i%2==0?"green":"orange")
                  .attr("font-weight","none");
                tooltiptree.style("visibility",'false');

                d3.select("#miniTree")
                .remove();
            })

    var rect=gc.selectAll("rect")
            .data(nodes)
            .join("rect")
            .attr("x",d=>d.y)
            .attr("y",d=>d.x)
            .attr("width",d=>d.height==0?parseFloat(d.data.value)/240:0)
            .attr("height",0.5)
            .attr("opacity",0.5)
            .attr("fill",(d,i)=>i%2==0?"green":"orange");

function buildJsonTree(fullname, data) {
  const tree = { name: fullname, children: [] };
  console.log(data,fullname)
  for (const entry of data) {
    const parts = entry.split('.');
    let current = tree.children;

    for (const part of parts) {
      let node = current.find(item => item.name === part);

      if (!node) {
        node = { name: part, children: [] };
        current.push(node);
      }

      current = node.children;
    }
  }

  return tree;
}


function toJson(fullname,data) {
  const treeStructure = buildJsonTree(fullname,data);
  return treeStructure;
}

function drawOutTree(data,locX,locY)
{
    var treemini=d3.tree()
           .size([360, 100]);
    console.log(locX,locY);
    var hiout=d3.hierarchy(data);
    var rootout=treemini(hiout);
    var linksout=rootout.links();
    var nodesout=rootout.descendants();
    var miniTree = d3.select('#graph')
        .append("g")
        .attr("id", "miniTree")
        .attr("transform", "translate(" + locX + "," + locY + ")");
    var gc = d3.select("#miniTree")
               .style("background-color","#E4F1FF")
    gc.append("rect")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("fill", "#E4F1FF");
    var lines=gc.selectAll("path")
                .data(linksout)
                .enter()
                .append("path")
                .attr("stroke","#555")
                .attr("stroke-width",0.5)
                .attr("opacity",0.5)
                .attr("d",d3.linkHorizontal()          //d3.linkHorizontal()
                            .x(d=>d.x)
                            .y(d=>d.y)
                );
    var mynode=gc.selectAll("circle")
            .data(nodesout)
            .join("circle")
            .attr("cx",d=>d.x)
            .attr("cy",d=>d.y)
            .attr("r",5)
            .attr("opacity",0.5)
            .attr("stroke","#555");

    var nodetxt=gc.selectAll("text")
            .data(nodesout)
            .enter()
            .append("text")
            .attr("x",d=>d.x)
            .attr("y",d=>d.y)
            .attr("dx",(d,i)=>d.height==0?"0em":"-1em")
            .attr("dy","0.5em")
            .attr("text-anchor",(d,i)=>d.height==0?"start":"end")
            .attr("font-size","12px")
            .text(d=>d.data.name)
}
}

window.onDrawTreeReady = function(data) {
    drawTree(data);
}

