function drawFileTree(data) {
  var padding = {left: 80, right:50, top: 20, bottom: 20 };
  var svg = d3.select("#graph")
    .attr("width", width + padding.left + padding.right)
    .attr("height", height + padding.top + padding.bottom)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  //树状图布局
  var tree = d3.tree()
    .size([2 * Math.PI, radius])
    .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth)

  var radius = width / 9;

  //给第一个节点添加初始坐标x0和y0
  data.x0 = 0;
  data.y0 = 0;

  var data0 = data;

  //以第一个节点为起始节点，重绘
  redraw(data);

  //重绘函数
  function redraw(source) {

    //（1） 计算节点和连线的位置
    var root = tree(d3.hierarchy(source).sort((a, b) => d3.ascending(a.data.name, b.data.name)));
    //应用布局，计算节点和连线
    var nodes = root.descendants();
    var links = root.links();

    //重新计算节点的y坐标
    nodes.forEach(function (d) { d.y = d.depth * 120; });

    //（2） 节点的处理

    //获取节点的update部分,个数相同
    var nodeUpdate = svg.selectAll(".node")
      .data(nodes, d => d.name);

    //获取节点的enter部分
    var nodeEnter = nodeUpdate.enter();

    //获取节点的exit部分
    var nodeExit = nodeUpdate.exit();

    //1. 节点的 Enter 部分的处理办法
    var enterNodes = nodeEnter.append("g")
      .attr("class", "node")
      .attr("transform", d => `
                      rotate(${d.x * 180 / Math.PI - 90})
                      translate(${d.y},0)
                      `)
      .on("click", function (event, d) {
        if (d.data.name == 'd3') {
          toggle(data0);
          redraw(data0);
        }
        else {
          //交互处理：1-相等&&无真和隐藏子节点  2-相等   3-不等进一步看子节点
          for (var i = 0; i < data.children.length; i++) {
            if ((!data.children[i].children) && (!data.children[i]._children)) {
              if (data.children[i].name == d.data.name) {
                break;
              }
              else {
                continue;
              }
            }
            else {
              if (data.children[i].name == d.data.name) {
                toggle(data.children[i]);
                redraw(data);
                break;
              } else {
                if ((data.children[i]._children) && (!data.children[i].children)) continue;
                else
                  for (var j = 0; j < data.children[i].children.length; j++) {
                    if (data.children[i].children[j].name == d.data.name) {
                      console.log("当前点击时下层的data=");
                      console.log(data.children[i].name);
                      toggle(data.children[i].children[j]);
                      redraw(data);
                      break;
                    }
                  }
              }
            }
          }
        }
      });

    enterNodes.append("circle")
      .attr("r", d => d.height * 4 + 3)
      .attr("fill", d=> d.height != 0 ? "green" : "#fff");

    enterNodes.append("text")
      .attr("x", d => d.x < Math.PI === !d.children ? 14 : -14)
      .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
      .attr("stroke-width", 0.5)
      .attr("stroke", "#555")
      .attr("font-size", 12)
      .text(d => d.data.name)
      .attr("font-family", "Consolas")// 设置字体样式为Consolas;
      .attr("transform", d => `
            rotate(${d.x >= Math.PI ? 180 : 0})
          `)
      .attr("font-weight", "bold")


    //2. 节点的 Update 部分的处理办法
    var updateNodes = nodeUpdate.transition()
      .duration(2)
      .attr("transform", d => `
                rotate(${d.x * 180 / Math.PI - 90})
                translate(${d.y},0)
                `)

    updateNodes.select("circle")
      .attr("r", 6)
      .attr("fill", d => d._children ? "orange" : "#fff");

    //3. 节点的 Exit 部分的处理办法
    var exitNodes = nodeExit.transition()
      .duration(2)
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
      .data(links, d=> d.target.name);

    //获取连线的enter部分
    var linkEnter = linkUpdate.enter();

    //获取连线的exit部分
    var linkExit = linkUpdate.exit();

    //1. 连线的 Enter 部分的处理办法
    linkEnter.insert("path", ".node")
      .attr("class", "link")
      .attr("d",
        d3.linkRadial()
          .angle(d => d.x)
          .radius(d => d.y))
      .transition()
      .duration(2)
      .attr("d", d3.linkRadial()
        .angle(d => d.x)
        .radius(d => d.y))
      .attr("fill", "none");

    //2. 连线的 Update 部分的处理办法
    linkUpdate.transition()
      .duration(2)
      .attr("d", d3.linkRadial()
        .angle(d => d.x)
        .radius(d => d.y));

    //3. 连线的 Exit 部分的处理办法
    linkExit.transition()
      .duration(2)
      .attr("d",
        d3.linkRadial()
          .angle(d => d.x)
          .radius(d => d.y))
      .remove();

    /*
    （4） 将当前的节点坐标保存在变量x0、y0里，以备更新时使用
    */
    nodes.forEach(function (d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });
    // 更新节点的文本颜色
    updateTextColors();
  }
  function updateTextColors() {
    // 选择所有的文本元素，并根据是否具有子节点设置文本颜色
    svg.selectAll("text")
      .style("fill", 
        d => (d.children || d._children) ? "green" : "#000" // 具有子节点的文本颜色设置为绿色，否则为黑色
      );
  }

  //切换开关，d 为被点击的节点
  function toggle(dd) {
    if (dd.children) { //如果有子节点
      dd._children = dd.children; //将该子节点保存到 _children
      dd.children = null;  //将子节点设置为null

    } else {  //如果没有子节点
      dd.children = dd._children; //从 _children 取回原来的子节点 
      dd._children = null; //将 _children 设置为 null
    }
  }

}

window.onDrawFileTreeReady = function (data) {
  // 执行绘图逻辑
  drawFileTree(data);
}