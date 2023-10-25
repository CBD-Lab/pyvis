console.log('drawFileTree.js is loaded');
function drawFileTree(data){
    //树状图布局
var tree = d3.tree()
             .size([2 * Math.PI, radius])
             .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth)

var radius = width/40;
d3.json(data).then(function(raw) {
  //给第一个节点添加初始坐标x0和y0
  raw.x0 = 0;
  raw.y0 = 0;
  //console.log(raw);
  //console.log(raw.children);
  var raw0=raw;


  //以第一个节点为起始节点，重绘
  redraw(raw);

  //重绘函数
  function redraw(data){

    /*
    （1） 计算节点和连线的位置
    */
    //var root=tree(d3.hierarchy(source).sort((a, b) => d3.ascending(a.data.name, b.data.name)));
    console.log(data);
    var root=tree(d3.hierarchy(data))
    //应用布局，计算节点和连线
    var nodes = root.descendants();
    var links = root.links();
    //console.log(nodes);
	//console.log(links);

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

    //重新计算节点的y坐标
    nodes.forEach(function(d) { d.y = d.depth * 180; });

    /*
    （2） 节点的处理
    */

    //获取节点的update部分,个数相同
    var nodeUpdate = svg.selectAll(".node")
                        .data(nodes, function(d){ return d.name; });

    //获取节点的enter部分
    var nodeEnter = nodeUpdate.enter();

    //获取节点的exit部分
    var nodeExit = nodeUpdate.exit();

    //1. 节点的 Enter 部分的处理办法
    var enterNodes = nodeEnter.append("g")
                    .attr("class","node")
                    .attr("transform", d => `
                    rotate(${d.x * 180 / Math.PI - 90})
                    translate(${d.y},0)
                    `)
                    .on("click", function(d) {
						//console.log("你点击的是="+d.data.name);
						if (d.data.name=='d3')
						{
                                toggle(raw0);
								redraw(raw0); 
						}
						else{
			    //交互处理：1-相等&&无真和隐藏子节点  2-相等   3-不等进一步看子节点
				for(var i=0;i<raw.children.length;i++){	
					if((!raw.children[i].children)&&(!raw.children[i]._children)){
						if(raw.children[i].name==d.data.name){
						  //console.log(i+"-"+d.data.name+"相等，无子节点，退出for循环");
						  break;
						}
						else{
						  //console.log(i+"-"+d.data.name+"不等，无子节点，下一次i循环");
						  continue;
						}
				    }
					else{
						if (raw.children[i].name==d.data.name){      
							//console.log("当前点击时的raw=");
							//console.log(raw.children[i].name);
							toggle(raw.children[i]);
							redraw(raw);
							break;
						}else{
                            //console.log(i+"-"+raw.children[i].name);
							if((raw.children[i]._children)&&(!raw.children[i].children))		continue;
							else
								for(var j=0;j<raw.children[i].children.length;j++){
								if (raw.children[i].children[j].name==d.data.name){
									console.log("当前点击时下层的raw=");
									console.log(raw.children[i].name);
									toggle(raw.children[i].children[j]);
									redraw(raw);
									break;
								}
								}
						}
					}										
                  }
				}
					});

    enterNodes.append("circle")
              .attr("r", d=>d.height*4+3)
              .style("fill", function(d) {
				  return d.height!=0 ? "green" : "#FFF"; 
				  });
    enterNodes.append("text")
				.attr("x", function(d) { return d.children || d._children ? -14 : 14; })
				/*.attr("transform",function(d,i){
								var tr="";
								if ((i>nodes.length/4)&&(i<nodes.length*3/4))
								{
									tr="rotate("+(180+i*360/nodes.length)+","+d.x+","+d.y+")"
								}
								else
									tr="rotate("+(i*360/nodes.length)+","+d.x+","+d.y+")"
								return tr
							})*/
				.attr("text-anchor", function(d) {
					return (d.children || d._children)? "end" : "start"; })
				.text(function(d) { return d.data.name; });

    //2. 节点的 Update 部分的处理办法
    var updateNodes = nodeUpdate.transition()
                        .duration(500)
                        //.attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });
						.attr("transform", d => `
							rotate(${d.x * 180 / Math.PI - 90})
							translate(${d.y},0)
							`)

    updateNodes.select("circle")
               .attr("r", 6)
               .style("fill", function(d) { 
				   return d._children ? "orange" : "#fff"; 
			   });

    //3. 节点的 Exit 部分的处理办法
    var exitNodes = nodeExit.transition()
                      .duration(500)
                 //     .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
					  .attr("transform", d => `
									rotate(${d.x * 180 / Math.PI - 90})
									translate(${d.y},0)
									`)
                      .remove();

    exitNodes.select("circle")
             .attr("r", 0);

    /*
    （3） 连线的处理
    */

    //获取连线的update部分
    var linkUpdate = svg.selectAll(".link")
                        .data(links, function(d){ return d.target.name; });

    //获取连线的enter部分
    var linkEnter = linkUpdate.enter();

    //获取连线的exit部分
    var linkExit = linkUpdate.exit();

    //1. 连线的 Enter 部分的处理办法
    linkEnter.insert("path",".node")
          .attr("class", "link")
          .attr("d", //function(d) {
              //var o = {x: source.x0, y: source.y0};
              //return diagonal({source: o, target: o});
				d3.linkRadial()
                      .angle(d => d.x)
                      .radius(d => d.y))
          .transition()
          .duration(500)
          .attr("d", d3.linkRadial()
                      .angle(d => d.x)
                      .radius(d => d.y));

    //2. 连线的 Update 部分的处理办法
    linkUpdate.transition()
        .duration(500)
        .attr("d", d3.linkRadial()
                      .angle(d => d.x)
                      .radius(d => d.y));

    //3. 连线的 Exit 部分的处理办法
    linkExit.transition()
          .duration(500)
          .attr("d", //function(d) {
            //var o = {x: source.x, y: source.y};
            //return diagonal({source: o, target: o});
         // })
		   d3.linkRadial()
                      .angle(d => d.x)
                      .radius(d => d.y))
          .remove();


    /*
    （4） 将当前的节点坐标保存在变量x0、y0里，以备更新时使用
    */
    nodes.forEach(function(d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });

  }

  //切换开关，d 为被点击的节点
  function toggle(dd){
		//console.log("开关ID="+dd.name+"的孩子"+dd.children.length);
		if(dd.children){ //如果有子节点
		  dd._children = dd.children; //将该子节点保存到 _children
		  
		  //console.log("关闭ID="+dd.name+"的孩子"+dd.children.length);
		  dd.children = null;  //将子节点设置为null

		}else{  //如果没有子节点
		  dd.children = dd._children; //从 _children 取回原来的子节点 
		  dd._children = null; //将 _children 设置为 null
		  //console.log("打开ID="+dd.name+"的孩子"+dd.children.length);
		}
  }

});
}