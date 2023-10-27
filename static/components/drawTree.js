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
//            .attr("xlint:href",function(d){
//                        return "http://127.0.0.1:5006/localmodule?wanted="+d.data.name;
//            })
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
                console.log(d)
                var fullname = d.data.name.slice(0, -3);
                while(point.depth>=0&& point.parent)
                {
                    point=point.parent;
                    fullname = point.data.name +'.'+ fullname; // 使用 + 运算符连接字符串
                }
                fullname="torch."+fullname;
                fetch('http://127.0.0.1:5006/treeLeaf?wanted=' + fullname)
                    .then(response => response.text())
                    .then(data => {
                    if(data !== "null"){
                    var formattedData = data.replace(/"/g, '').replace(/\\n/g, '<br>').replace(/\\/g, '');
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
//                drawClassDetail('','',0)
                d3.select(this)
                  .attr("fill", (d,i)=>i%2==0?"green":"orange")
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

    function drawClassDetail(data,pos,ifon)
    {
        if(ifon==1){
            gc.append("rect")
                .attr("id","classDetailRect")
                .attr("x", pos.x)      // 设置背景框的 x 坐标
                .attr("y", pos.y)      // 设置背景框的 y 坐标
                .attr("width", 200)    // 设置背景框的宽度
                .attr("height", 60)    // 设置背景框的高度
                .attr("fill", "lightgray");  // 设置背景框的背景颜色

            gc.append("text")
                .attr("id","classDetail")
                .attr("x",pos.x)
                .attr("y",pos.y+30)
                .text(data);  // 替换换行符为实际的换行)
        }

        else if(ifon==0)
        {
            d3.select("#classDetailRect").remove();
            d3.select("#classDetail").remove();
        }
    }
}

window.onDrawTreeReady = function(data) {
    drawTree(data);
}

