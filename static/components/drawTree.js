function drawTree(data,search){
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
       var hi=d3.hierarchy(data);
       var root=tree(hi);
       var links=root.links();
       var nodes=root.descendants();
    var gc=svg.append("g")
              .attr("id","mainsvg")
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
            .datum(function(d, i) {
                return { data: d, index: i };
                })
            .text(d=>d.data.data.name)
            .on('mouseover',function(event,d){
             d3.select("#miniTree")
                .remove();
                d3.select(".rectout").remove();
                d3.select(this)
                  .attr("fill", "red")
                  .attr("font-weight","bold");
                if(!d.data.children){
                var point=d.data;
                var fullname = d.data.data.name.slice(0, d.data.data.name.lastIndexOf("."));
                while(point.depth>=0&& point.parent)
                {
                    point=point.parent;
                    fullname = point.data.name +'.'+ fullname;
                }
                if(fullname.substring(0,2)=='nn')
                {
                fullname="torch."+fullname;
                }
                fetch('http://127.0.0.1:5006/treeLeaf?wanted=' + fullname)
                    .then(response => response.json())
                    .then(data => {
                    if(data !== "null"){
                    var datain=data.jsoninside;
                    var dataout=data.jsonoutside;

                    const jsontree = toJson(fullname,dataout);

                    drawOutTree(nodes,links,datain,jsontree,event.pageX,event.pageY,search);
                   } })
                    .catch(error => {
                        console.error('Error executing Python script:', error);
                        // 处理错误
                    });
                    }
            })
            .on('mouseleave',function(event,d){
                d3.select(this)
                  .attr("fill", d.index%2==0?"green":"orange")
                  .attr("font-weight","none");
                tooltiptree.style("visibility",'false');

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
console.log(fullname,data);
  const treeStructure = buildJsonTree(fullname,data);
  return treeStructure;
}

function drawOutTree(nodes,links,datain,dataout,locX,locY,search)
{
    var treemini=d3.tree()
           .size([300, 250]);
    var hiout=d3.hierarchy(dataout);
    var rootout=treemini(hiout);
    var linksout=rootout.links();
    var nodesout=rootout.descendants();
    // 创建一个数组用于存储具有重叠路径的叶子节点
    var overlappingLeafNodes = [];
    var overlappingminiNodes=[]
    for (var i = 0; i < nodesout.length; i++) {
        if(nodesout[i].height==1)
        {
            overlappingminiNodes.push(nodesout[i]);
        }
    }
    for (var t =0;t<overlappingminiNodes.length;t++){
       for (var j = 0; j < nodes.length; j++) {
        if(nodes[j].height==0){
        if (nodes[j].data.name.substring(0, nodes[j].data.name.lastIndexOf(".")) === overlappingminiNodes[t].data.name &&nodes[j].depth-overlappingminiNodes[t].depth==-2) {
        var pointNode=nodes[j];
        var pointminiNode=overlappingminiNodes[t]
        while(pointNode.parent)
        {
        pointNode=pointNode.parent;
        pointminiNode=pointminiNode.parent;
        if(pointminiNode.data.name!=pointNode.data.name)
        {
            break;
        }
        }
            overlappingLeafNodes.push(nodes[j]);
            break;
          }
        }
        }
    }
    var outRect=d3.select("#mainsvg").selectAll(".rectout")
       .data(overlappingLeafNodes)
       .enter()
       .append("rect")
       .attr("class","rectout")
       .attr("x",d=>d.y-5)
       .attr("y",d=>d.x-5)
       .attr("width", 10) // 设置矩形宽度
       .attr("height", 10) // 设置矩形高度
       .attr("stroke", "blue")
       .attr("stroke-width", 2)
       .attr("fill", "none");
    var miniTree = d3.select('#graph')
        .append("g")
        .attr("id", "miniTree")

    var gc = d3.select("#miniTree")
               .attr("transform", "translate(" + locX/4 + "," + locY/2 + ")");

    gc.append("rect")
        .attr("id","bgrect")
        .attr("width", "620px")
        .attr("height", "300px")
        .attr("fill", "#E4F1FF")
        .attr("opacity","0.9")
    // 添加竖直分割线
    gc.append("line")
        .attr("x1", "290px")  // 起始点 x 坐标
        .attr("y1", "0")      // 起始点 y 坐标
        .attr("x2", "290px")  // 终点 x 坐标
        .attr("y2", "300px")  // 终点 y 坐标
        .attr("stroke", "#AED2FF");  // 分割线颜色

    gc.append("text")
        .attr("x", "0px")
        .attr("y", "10px")
        .attr("font-size", "15px")
        .text("build-in classes");
    gc.append("text")
        .attr("x", "300px")
        .attr("y", "10px")
        .attr("font-size", "15px")
        .text("build-out classes");
    var datain=gc.selectAll(".textin")
        .data(datain)
        .enter()
        .append("text")
        .attr("class","textin")
        .attr("y",function(d,i)
        {
        return (i+1)*15+20;
        })
        .attr("font-size","12px")
        .text(d=>d)
    var lines=gc.selectAll("path")
                .data(linksout)
                .enter()
                .append("path")
                .attr("stroke","#555")
                .attr("stroke-width",0.5)
                .attr("opacity",0.5)
                .attr("d",d3.linkVertical()          //d3.linkHorizontal()
                            .x(d=>d.x+300)
                            .y(d=>d.y+35)
                )
                .attr("fill","none");
    var mynode=gc.selectAll("circle")
            .data(nodesout)
            .join("circle")
            .attr("cx",d=>d.x+300)
            .attr("cy",d=>d.y+35)
            .attr("r",5)
            .attr("opacity",0.5)
            .attr("stroke","#555");

    var nodetxt=gc.selectAll(".textout")
            .data(nodesout)
            .enter()
            .append("text")
            .attr("class","textout")
            .attr("x",d=>d.x+300)
            .attr("y",d=>d.y+35)
            .attr("dx",(d,i)=>d.height==0?"0em":"-1em")
            .attr("dy","0.5em")
            .attr("text-anchor",(d,i)=>d.height==0?"start":"end")
            .attr("font-size","12px")
            .text(d=>d.data.name)
            .on("mouseover",function(d,i)
            {  d3.select(this)
                .attr("fill", "red")
                .attr("font-weight","bold");
            })
            .on("mouseleave",function(d,i)
            {  d3.select(this)
                .attr("fill", "black")
                .attr("font-weight","none");
            })
            .on("click",function(d,i)
              {
              if(i.height==0){
               var fullname = i.parent.data.name;
               var point=i.parent;
              }
               else
               {
                var fullname = i.data.name;
                var point=i;
               }
                  while(point.depth>=2&& point.parent)
                  {
                      point=point.parent;
                      fullname = point.data.name +'.'+ fullname; // 使用 + 运算符连接字符串
                  }
              //   fullname="torch."+fullname;
              console.log(fullname);
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
                          //tips.style("display","none");
                          tips.remove();
                         });

                      tips.append("div")
                                    .attr("class","content")
                                    .html('<pre><code class="language-python">'+highlightedCode+'</code></pre>');
                                    })

                      .catch(error => {
                          console.error('Error executing Python script:', error);
                          // 处理错误
                      });
            });

            }
}

window.onDrawTreeReady = function(data,search) {
    drawTree(data,search);
}

