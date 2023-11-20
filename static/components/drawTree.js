function drawTree(data){
     let tooltiptree = d3.select('body')
                            .append('div')
                            .attr("id", "tiptree") // 添加ID属性
                            .style('position', 'absolute')
                            .style('z-index', '25')
                            .style('color', 'black')
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
                .attr("height", height)
                .on("click", function () {
                     d3.select("#miniTree").remove();
                });
     var tree=d3.tree()
               .size([height,width*0.7]);
     var hi=d3.hierarchy(data);
     var root=tree(hi);
     var links=root.links();
     var nodes=root.descendants();
     var i=0, duration=750;
//     var treemap = d3.tree().size([height, width]);
     initData(root);
   /********************* 2. 数据初始化绑定（包括数据更新） *********************/
    function initData(root) {
      // 设置第一个元素的初始位置
      root.x0 = height / 2;
      root.y0 = 10;
      root._height=0;
      root._children=[];
        // 计算总节点数
      const totalNodes = countNodes(root);
      var filecount=updateFileCount(root)
      if(filecount>0){
      collapseAllNodesByFile(root);}
      // 更新节点状态
      updateChart(root);
    }
/*********************************更新整个树形结构的节点文件数目   **************************/
function updateFileCount(node)
{
    if(!node.data.fileCount)
        {
            node.data.fileCount=0;
        }
    if(node.children)
    {
        node.children.forEach(function (child) {
        node.data.fileCount=updateFileCount(child)+node.data.fileCount
        })
    }
    return node.data.fileCount
}

/********************* 计算树中的节点总数 *********************/
function countNodes(node) {
  let count = 1; // 初始为 1，包括当前节点
  if (node.children) {
    node.children.forEach(function (child) {
      count += countNodes(child); // 递归计算子节点的总数
    });
  }
  return count;
}
/********************* 根据树的节点个数随机关闭节点 *********************/
function collapseAllNodesByProbability(node,totalNodes) {
  if (node.children) {
     node.children.forEach(function (child) {
      collapseAllNodesByProbability(child, totalNodes); // 递归处理子节点并传递额外参数
    });
    // 根据概率属性决定是否收起节点
    if (Math.random() > 100/totalNodes&node.depth!=0) {
      node._children = node.children; // 将子节点移到 _children 中
      node._height=0;//将该结点的高度另存为1
      node._children.forEach(function (child) {
      collapseAllNodesByProbability(child, totalNodes); // 递归处理子节点并传递额外参数
    });
      node.children = null; // 清空 children
    }
    else{
    node._height=node.height;
    }
  }
}
//根据节点名字来在父节点中移除
function removeNodeByName(parent,nodeName)
{
    parent.children=parent.children.filter(child=>child.data.name!==nodeName);
    parent.data.children=parent.data.children.filter(datachild=>datachild.name!=nodeName);
}

/********************* 根据树的节点及其子节点是否含有文件关闭节点 *********************/
function collapseAllNodesByFile(node) {
    if (node.children) {
    // 创建 children 数组的副本
    const childrenCopy = node.children.slice();
    childrenCopy.forEach(function (child) {
      collapseAllNodesByFile(child); // 递归处理子节点并传递额外参数
    });
  }

  if (!node.data.fileCount) {
    node.data.fileCount = 0;
  }

  // 目前是把当前节点作为子节点考虑是不是要收起，初始设置未如果当前节点树没有文件就收起
  if (node.data.fileCount === 0 && node.parent) {
    // 收起该节点
    var parent = node.parent;
    removeNodeByName(parent, node.data.name);

    if (!parent._children) {
      parent._children = [];
    }

    parent._children.push(node);
  }
}


/********************* 更新树的高度，根据_height参数 *********************/
function updateHeight(node)
{
  let height = 0; // 初始值设置为 0
  if(!node.children)//要么所有子节点被隐藏要么没有子节点，显示高度为0
  {
//    node._height=0;
    node.height=0
    return 0;
  }
  else//当前节点有子节点并且有展开的节点
  {
     node.children.forEach(function (child) {
     height=Math.max(height,1+updateHeight(child));//遍历所有子节点加一得到最大高度
    });
//    node._height=height;
    node.height=height;
    return height;
    }
  }
/********************* 5. link交互和绘制  *********************/
function updateLinks(source, links) {
  // 更新数据
  var link = svg.selectAll("path.link").data(links, function (d) {
    return d.id;
  });

  // 添加enter操作，添加类名为link的path元素
  var linkEnter = link
    .enter()
    .insert("path", "g")
    .attr("class", "link")
    .attr("fill","none")
    // 默认位置为当前父节点的位置
    .attr("d", function (d) {
      var o = {
        x: source.x0,
        y: source.y0
      };
      return diagonal(o, o);
    });

  // 获取update集
  var linkUpdate = linkEnter.merge(link);

  // 更新添加过渡动画
  linkUpdate
    .transition()
    .duration(duration)
    .attr("d", function (d) {
      return diagonal(d, d.parent);
    });

  // 获取exit集
  var linkExit = link
    .exit()
    // 设置过渡动画
    .transition()
    .duration(duration)
    .attr("d", function (d) {
      var o = {
        x: source.x,
        y: source.y
      };
      return diagonal(o, o);
    })
    // 移除link
    .remove();
}

/********************* 4. node交互和绘制  *********************/
function updateNodes(source, nodes) {
  // 给节点添加id，用于选择集索引
  var mynode = svg.selectAll("g.node").data(nodes, function (d,i) {
    return d.id || (d.id = ++i);
  });

  // 添加enter操作，添加类名为node的group元素
  var nodeEnter = mynode
    .enter()
    .append("g")
    .attr("class", "node")
    .attr("transform", function (d) {
      return "translate(" + source.y0 + "," + source.x0 + ")";
    });


  // 给每个新加的group元素添加cycle元素
    nodeEnter
     .append("path")
     .attr("class","node")
     .attr("d", d3.symbol().type(function(d) {
      var endcase = (d.data.name).split('.')[1];
      if (endcase == 'py'){
          return d3.symbols[0];
      }
      else if (endcase == 'pyi'){
          return d3.symbols[4];
      }
      else if (endcase == 'dll'){
          return d3.symbols[2];
      }
      else if ((endcase == 'png' ) || (endcase == 'jpg')){
          return d3.symbols[6];
      }
      else{
          return d3.symbols[5];
      }
    }))
    .attr("r", 1e-6)
    .style("fill", function (d) {
     return chooseColor(d.data.name)
    })
    .attr("opacity",function(d)
    {
        return (d._children) &&(!d.children) ? 0.9:0.1;
    })
    .on("click", function(d,i)
    {
        click(i);
    })

  // 给每个新加的group元素添加文字说明
  nodeEnter
    .append("text")
//    .attr("dy", ".1em")
    .attr("x", function (d) {
      return d.children || d._children ? -10 : 10;
    })
    .attr("y",3)
    .attr("text-anchor", function (d) {
      return d.children || d._children ? "end" : "start";
    })
    .text(function (d) {
      return d.data.name;
    })
     .attr("stroke", function(d){
        return chooseColor(d.data.name);
    })
     .attr("stroke-width","0.3px")
     .on("click",function(event,d)
     {
     if(d.height==0){
        textclick(event,d);
        console
        }
     })
    nodeEnter
        .each(function(d) {
            if(d.data.linkAll
            &&
            ((typeof( d.data.linkAll['pdfClass']) !== "undefined" && Object.keys(d.data.linkAll['pdfClass']).length > 0)||(typeof( d.data.linkAll['gitClass']) !== "undefined" && Object.keys(d.data.linkAll['gitClass']).length > 0)))
            {
              d3.select(this)
                .append("foreignObject")
                .attr("class","fileBox")
                .attr("width", "8px")
                .attr("height", "15px")
                .attr("x", function(event,d) {
                  return d.children || d._children ? -30 : 10+100;
                })
                .attr("y",-10)
                 .append("xhtml:div")
                 .style("margin", 0)
                 .style("padding", 0)
                 .html('<img src="http://127.0.0.1:5006/get_svg/fileBox.svg" width="100%" height="100%" />')
                 .on("click",function(event,d)
                 {
                    console.log(d);
                    textclick(event,d);
                 })

            }
            if (d.data.linkAll && typeof(d.data.linkAll["pdfModule"]) !== "undefined" && d.data.linkAll["pdfModule"].length > 0) {
            d3.select(this)
                .append("foreignObject")
                .attr("width", "8px")
                .attr("height", "15px")
                .attr("x", function(event,d) {
                  return d.children || d._children ? -30 : 20+100;
                })
                .attr("y",-10)
                 .append("xhtml:div")
                 .style("margin", 0)
                 .style("padding", 0)
                 .html('<img src="http://127.0.0.1:5006/get_svg/pdf.svg" width="100%" height="100%" />')
                 .on("click",function()
                 {
                    var link = d.data.linkAll['pdfModule'];
                    window.open(link, '_blank');
                 })

            }
      });


  // 获取update集
  var nodeUpdate = nodeEnter.merge(mynode);

  // 设置节点的位置变化，添加过渡动画效果
  nodeUpdate
    .transition()
    .duration(duration)
    .attr("transform", function (d) {
      return "translate(" + d.y + "," + d.x + ")";
    });

  // 更新节点的属性和样式
  nodeUpdate
    .select("path.node")
    .attr("r", 10)
     .style("fill", function (d) {
        return chooseColor(d.data.name);
    })
    .attr("cursor", "pointer");

  // 获取exit操作
  var nodeExit = mynode
    .exit()
    // 添加过渡动画
    .transition()
    .duration(duration)
    .attr("transform", function (d) {
      return "translate(" + source.y + "," + source.x + ")";
    })
    // 移除元素
    .remove();

  nodeExit.select("circle").attr("r", 1e-6);
  nodeExit.select("text").style("fill-opacity", 1e-6);
}


/********************* 6. 单击节点事件处理  *********************/
// 当点击时，展开当前节点的所有叶子节点
function click(d) {
      if (d._children&&d._children.length>0) {//如果有隐藏节点，就全部展开
          console.log("展开了")
          d._children.forEach(function(_child)
          {
            d.children.push(_child);
            d.data.children.push(_child.data)
          })
            d._children = [];
            console.log(d)
          }
      else {//如果已经全部展开就收缩回去
      const childrenCopy = d.children.slice();//创建副本
        childrenCopy.forEach(function(child)
            {
            if(!d._children)
                {
                    d._children=[];
                }
            if(child.data.fileCount<1){
                d._children.push(child)
                removeNodeByName(d,child.data.name)
                }
          })
      }
      console.log(d);

      updateChart(d);
}

function textclick(event,d){
            var pdfClass=d.data.linkAll&&d.data.linkAll['pdfClass']?d.data.linkAll['pdfClass']:'';
            var gitClass=d.data.linkAll&&d.data.linkAll['gitClass']?d.data.linkAll['gitClass']:'';

            d3.select("#miniTree")
                .remove();
            d3.select(".rectout").remove();
            if(d.height==0){
                var point=d;
                var fullname = d.data.name.slice(0, d.data.name.lastIndexOf("."));
                while(point.depth>=0&& point.parent)
                    {
                        point=point.parent;
                        fullname = point.data.name +'.'+ fullname;
                    }
                fetch('http://127.0.0.1:5006/treeLeaf?wanted=' + fullname)
                    .then(response => response.json())
                    .then(data => {
                    if(data !== "null"){
                    var datain=data.jsoninside;
                    var dataout=data.jsonoutside;
                    const jsontree = toJson(fullname,dataout);

                    drawOutTree(nodes,links,datain,jsontree,event.pageX,event.pageY,pdfClass,gitClass);
                       } })
                    .catch(error => {
                        console.error('Error executing Python script:', error);
                    });
            }
}
  /********************* 3. 数据更新绑定  *********************/
function updateChart(source) {
      d3.select("#fileBox").remove();
      d3.select("#pdfClass").remove();
      d3.select("#gitClass").remove();
      updateHeight(root);
      console.log(root)
//      var treeData=root
//      var hi=d3.hierarchy(root)
      var treeData = tree(root);
      console.log(treeData)
      // 计算新的Tree层级
      var nodes = treeData.descendants(),
      links = treeData.descendants().slice(1);
      nodes.forEach(function (d) {
        d.y = d.depth * width/(root.height+2);
      });

      // node交互和绘制
      updateNodes(source, nodes);
      // link交互和绘制
      updateLinks(source, links);

      // 为动画过渡保存旧的位置
      nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
      });

    }
// 添加贝塞尔曲线的path，衔接与父节点和子节点间
function diagonal(s, d) {
  path =
    `M ${s.y} ${s.x}
          C ${(s.y + d.y) / 2} ${s.x},
            ${(s.y + d.y) / 2} ${d.x},
            ${d.y} ${d.x}`;

  return path;
}
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
function chooseColor(fullname)
{
  var endcase = (fullname).split('.')[1];
      if (endcase == 'py'){
          return color[0];
      }
      else if (endcase == 'pyi'){
          return color[4];
      }
      else if (endcase == 'dll'){
          return color[2];
      }
      else if ((endcase == 'png' ) || (endcase == 'jpg')){
          return color[6];
      }
      else{
          return color[5];
      }
}

function toJson(fullname,data) {
  const treeStructure = buildJsonTree(fullname,data);
  return treeStructure;
}

function drawOutTree(nodes,links,datain,dataout,locX,locY,pdfClass,gitClass)
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
        var pointminiNode=overlappingminiNodes[t];
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
        .attr("width", "620px")
        .attr("height", "30px")
        .attr("fill", "grey")
        .attr("opacity","0.9")
    gc.append("rect")
        .attr("width", "620px")
        .attr("height", "270px")
        .attr("y","31px")
        .attr("fill", "#E4F1FF")
        .attr("opacity","0.9")
    // 添加竖直分割线
    gc.append("line")
        .attr("x1", "290px")  // 起始点 x 坐标
        .attr("y1", "0")      // 起始点 y 坐标
        .attr("x2", "290px")  // 终点 x 坐标
        .attr("y2", "300px")  // 终点 y 坐标
        .attr("stroke", "#AED2FF");  // 分割线颜色
    gc.append("line")
        .attr("x1", "0")  // 起始点 x 坐标
        .attr("y1", "30px")      // 起始点 y 坐标
        .attr("x2", "620px")  // 终点 x 坐标
        .attr("y2", "30px")  // 终点 y 坐标
        .attr("stroke", "#AED2FF");  // 分割线颜色
    gc.append("text")
        .attr("x", "0px")
        .attr("y", "20px")
        .attr("font-size", "15px")
        .text("build-in classes");
    gc.append("text")
        .attr("x", "300px")
        .attr("y", "20px")
        .attr("font-size", "15px")
        .text("build-out classes");
    var datain=gc.selectAll(".textin")
        .data(datain)
        .enter()
        .append("text")
        .attr("class","textin")
        .attr("x",20)
        .attr("y",function(d,i)
        {
        return (i+1)*15+30;
        })
        .attr("font-size","12px")
        .text(d=>d.split('.').slice(-1))
        .each(function(d,i) {
            var linkPdf=pdfClass[d];
            if(linkPdf)
            {
            var currentY = d3.select(this).attr("y");
            d3.select(this.parentNode)
                .append("foreignObject")
                .attr("class","pdfClass")
                .attr("width", "8px")
                .attr("height", "15px")
                .attr("x", function(event,d) {
                  return 0;
                })
                .attr("y",function()
                {
                    return currentY-15;
                })
                .append("xhtml:div")
                .html('<img src="http://127.0.0.1:5006/get_svg/pdf.svg" width="100%" height="100%" />')
                .on("click",function()
                {
                    window.open(linkPdf, '_blank');
                }
                )
                 }
        })
        .each(function(d,i) {
            var linkGit=gitClass[d];
            if(linkGit)
            {
            var currentY = d3.select(this).attr("y");
            d3.select(this.parentNode)
                .append("foreignObject")
                .attr("class","gitClass")
                .attr("width", "8px")
                .attr("height", "15px")
                .attr("x", function(event,d) {
                  return 10;
                })
                .attr("y",function()
                {
                    return currentY-15;
                })
                .append("xhtml:div")
                .html('<img src="http://127.0.0.1:5006/get_svg/github.svg" width="100%" height="100%" />')
                .on("click",function()
                {
                    window.open(linkGit, '_blank');
                }
                )
                 }
        })

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
          fetch('http://127.0.0.1:5006/classVariable?wanted=' + i)
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

                    });
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
              fetch('http://127.0.0.1:5006/leafCode?wanted=' + fullname)
                      .then(response => response.text())
                      .then(data => {
                       const language = 'python';
                             // 使用 Prism.highlight 方法高亮代码字符串
                       const highlightedCode = Prism.highlight(data, Prism.languages[language], language);

                       var tips = d3.select("body")
                                      .append("div")
                                      .attr("class","popup")
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

window.onDrawTreeReady = function(data) {
    drawTree(data);
}

