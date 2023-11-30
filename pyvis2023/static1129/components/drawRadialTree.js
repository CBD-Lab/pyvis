function drawRadialTree(data, radialTreeCount) {
  var padding = { left: 80, right: 50, top: 20, bottom: 20 };
  var svg = d3.select("#graph")
    .attr("width", width + padding.left + padding.right)
    .attr("height", height + padding.top + padding.bottom)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  var pdfs = new Map();
  var gits = new Map();
  var pdfchange = 0;
  var gitchange = 0;

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
    
    radialTreeCount.node = nodes.length;
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
                      //console.log("当前点击时下层的data=");
                      //console.log(data.children[i].name);
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
      .attr("fill", d => d.height != 0 ? "green" : "#fff")
      .on("mouseenter", (event, d) => {
        d3.select(this.d)
          .attr("stroke", "#555")
          .attr("stroke-width", 0.5);
        tooltip.html("1")
          .style("left", event.pageX + "px")
          .style("top", event.pageY + "px")
      })
      .on("mouseleave", (event, d) => {
        d3.select(this.d).attr("stroke", null);
        tooltip.style("visibility", 'false');
      });

    enterNodes.append("text")
      .attr("x", d => d.x < Math.PI === !d.children ? 14 : -14)
      .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
      .attr("stroke-width", 0.5)
      .attr("stroke", "#555")
      .attr("font-size", 12)
      .text(d => d.data.name)
      .attr("font-family", "Consolas")
      .attr("transform", d => `
            rotate(${d.x >= Math.PI ? 180 : 0})
          `)
      .attr("font-weight", "bold")
      .attr("cursor", "pointer");
    
    svg.selectAll("text")
      .on("click", (d, i) => {
        var fullname = i.data.name.split('.', 1)[0];
        var point = i;
          while (point.depth >= 0 && point.parent) {
            point = point.parent;
            console.log("point:",point.data.name);
            fullname = point.data.name + '.' + fullname;
          }
          if(fullname.substring(0,2)=='nn')
          {
          fullname="torch."+fullname;
          }
        //console.log("treemap fullname:",fullname);           

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
      })
      .on("mouseover", function (event, d) {
        var fullname = d.data.name.split('.', 1)[0];
        var point = d;
        while (point.depth >= 0 && point.parent) {
          point = point.parent;
          console.log("point:",point.data.name);
          fullname = point.data.name + '.' + fullname;
        }
        if(fullname.substring(0,2)=='nn')
        {
          fullname="torch."+fullname;
        }
        fullname = fullname + ".py";
        d3.select(this)
          .transition()
          .duration(300)
          .text(d => fullname)
          
      })
      .on("mouseout", function (event, d) {
        d3.select(this)
          .text(d => d.data.name)
      });

enterNodes
.each(function(d) {
  if(d.data.linkAll && typeof( d.data.linkAll['pdfClass']) !== "undefined" && Object.keys(d.data.linkAll['pdfClass']).length > 0)
  {
      for (key in d.data.linkAll['pdfClass']){
          pdfs.set(key,d.data.linkAll['pdfClass'][key]);
      }
  }
  if(d.data.linkAll && typeof( d.data.linkAll['gitClass']) !== "undefined" && Object.keys(d.data.linkAll['gitClass']).length > 0)
  {
      for (key in d.data.linkAll['gitClass']){
          gits.set(key,d.data.linkAll['gitClass'][key]);
      }
  }
  if (d.data.linkAll && typeof(d.data.linkAll["pdfModule"]) !== "undefined" && d.data.linkAll["pdfModule"].length > 0)
  {
      var fullname = d.data.name.split('.', 1)[0]; 
      var point = d;
      while (point.depth >= 0 && point.parent) {
          point = point.parent;
          fullname = point.data.name + '.' + fullname;
      }
      fullname = fullname;
      pdfs.set(fullname,d.data.linkAll['pdfModule'][0])
  }
    
});

d3.select("input[id=showPdf5]").on("change", function () {
  console.log('showpdf',gits);
  if (pdfchange == 0)
    pdfchange = 1;
  else
    pdfchange = 0;
    if(pdfchange==1){
          var pdfinfo = d3.select('#svgbox').append("div")
                      .attr("class", "tooltip")
                      .attr('id','pdfshow5')
                      .style("left", (width * 0.2) + "px")
                      .style("top", (height * 0.15) + "px")
                      .style("background-color", "white")
                      .style("border-radius", "5px")
                      .style("padding", "5px")
                      .style("box-shadow", "0px 2px 4px rgba(0, 0, 0, 0.1)")
                      .style('list-style','none');

          pdfinfo.append("foreignObject")
                  .attr("height", "12px")
                  .append("xhtml:div")
                  .style("display", "flex")
                  .style("align-items", "center")
                  .style("margin", 0)
                  .style("padding", 0)
                  .html('<img src="http://127.0.0.1:5006/get_svg/pdf.svg" style="width: 8px; height: 15px; margin-right: 5px;"/>')
                  .append("span")
                  .attr("class", "close")
                  .attr("color", "red")
                  .text("x")
                  .style("position", "absolute")
                  .style('right',"0")
                  .on("click", () => {
                    pdfinfo.remove();
                    d3.select("input#showPdf5").property("checked", false);
                    pdfchange = 0;
                  });
          if (pdfs.size == 0){
              pdfinfo.append('text')
                  .attr("stroke-family", "仿宋")
                  .attr("font-size", "10px")
                  .text("no PDF!");
          }
          else{
              pdfs.forEach((value, key) => {
                  console.log('vk', value, key);
                  pdfinfo.append('text')
                      .attr("stroke-family", "仿宋")
                      .attr("font-size", "10px")
                      .text(key)
                      .on("click",function()
                      {
  //                        console.log(d);
                          pdfgitclick(key);
                      });
                  pdfinfo.append('br');
              });
          }
      }
      else{
          d3.select('#pdfshow5').remove();
      }
});
d3.select("input[id=showGit5]").on("change", function () {
  console.log('sp',gits);
  if (gitchange == 0)
    gitchange = 1;
  else
    gitchange = 0;
    if(gitchange==1){
          var gitinfo = d3.select('#svgbox').append("div")
                      .attr("class", "tooltip")
                      .attr('id','gitshow5')
                      .style("left", (width * 0.2) + "px")
                      .style("top", (height * 0.15) + "px")
                      .style("background-color", "white")
                      .style("border-radius", "5px")
                      .style("padding", "5px")
                      .style("box-shadow", "0px 2px 4px rgba(0, 0, 0, 0.1)")
                      .style('list-style','none');
          gitinfo.append("foreignObject")
                  .attr("height", "12px")
                  .append("xhtml:div")
                  .style("display", "flex")
                  .style("align-items", "center")
                  .style("margin", 0)
                  .style("padding", 0)
                  .html('<img src="http://127.0.0.1:5006/get_svg/github.svg" style="width: 10px; height: 10px; margin-right: 5px;"/>')
                  .append("span")
                  .attr("class", "close")
                  .attr("color", "red")
                  .text("x")
                  .style("position", "absolute")
                  .style('right',"0")
                  .on("click", () => {
                    gitinfo.remove();
                    d3.select("input#showGit5").property("checked", false);
                    gitchange = 0;
                  });
          if (gits.size == 0){
              gitinfo.append('text')
                  .attr("stroke-family", "仿宋")
                  .attr("font-size", "10px")
                  .text("no GitHub files !");
          }
          else{
              gits.forEach((value, key) => {
                  console.log('vk', value, key);
                  gitinfo.append('text')
                      .attr("stroke-family", "仿宋")
                      .attr("font-size", "10px")
                      .text(key)
                      .on("click",function()
                      {
  //                        console.log(d);
                          pdfgitclick(key);
                      });
                  gitinfo.append('br');
              });
          }
      }
      else{
          d3.select('#gitshow5').remove();
      }
});

function pdfgitclick(classname){
  console.log('pgc',classname);
  fetch('http://127.0.0.1:5006/classVariable?wanted=' + classname)
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
}
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
      .data(links, d => d.target.name);

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

window.onDrawRadialTreeReady = function (data, radialTreeCount) {
  // 执行绘图逻辑
  drawRadialTree(data, radialTreeCount);
}