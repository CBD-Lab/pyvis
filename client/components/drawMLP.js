function drawMLP(netParam,modelParam) {
    var width  = (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) * 0.83;
    var height = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) * 0.8;
    var color = d3.scaleOrdinal(d3.schemeCategory10);
    var svg = d3.select("#graph")
        .attr("width", width)
        .attr("height", height);
    var lineCount=0;
    var circleCount=0
    for(let i=1;i<netParam.length;i++)
    {
        lineCount+=netParam[i]*netParam[i-1];
        circleCount+=netParam[i];
    }
    circleCount+=netParam[0];
//    lineCount+=netParam[0]+netParam[netParam.length-1];
    var widthUnit=width/(netParam.length+2);
    var heightUnit=new Array(netParam.length);
    netParam.forEach(function(netLayer,index)
    {
        heightUnit[index]=height/(Math.floor(netParam[index]/2) *2+2);//如果是奇数就多一格，如果是偶数就多两格。
    })
    var lineData=new Array(lineCount);
    var circleData=new Array(circleCount);
    var count=0;
    for(var i=0;i<netParam.length-1;i++)
    {
        for(var j=0;j<netParam[i];j++)
        {
            for(var k=0;k<netParam[i+1];k++)
            {
                let x1=widthUnit*(i+1);
                let x2=widthUnit*(i+2);
                let y1=netParam[i]%2==0?(j+1)*heightUnit[i]+heightUnit[i]/2:(j+1)*heightUnit[i];
                let y2=netParam[i+1]%2==0?(k+1)*heightUnit[i+1]+heightUnit[i+1]/2:(k+1)*heightUnit[i+1];
                let data=modelParam[i][0][k][j];
                lineData[count++]={
                "x1":x1,
                "y1":y1,
                "x2":x2,
                "y2":y2,
                "data":data
                }
            }
        }
    }
    count=0;
    for(var i=0;i<netParam.length;i++)
    {
        for(var j=0;j<netParam[i];j++)
        {
            circleData[count++]={
            "x":widthUnit*(i+1),
            "y":netParam[i]%2==0?(j+1)*heightUnit[i]+heightUnit[i]/2:(j+1)*heightUnit[i],
            "color":color(i),
            "bias":i==0?0:modelParam[i-1][1][j]
            }
        }
    }
    console.log(circleData);
//    var model = 1;
//    var dataset1 = new Array(modelParam[0] * model);
//    for (var i = 0; i < dataset1.length; i++) {
//        dataset1[i] = (i * height) / modelParam[0];
//    }
//    var dataset2 = new Array(modelParam[1] * model);
//
//    for (var i = 0; i < dataset2.length; i++) {
//        dataset2[i] = (i * height) / modelParam[1];
//    }
//    var dataset3 = new Array(modelParam[2] * model);
//    var dataset4 = new Array(model);
//    dataset4[0] = height / 2;
//    for (var i = 0; i < dataset3.length; i++) {
//      dataset3[i] = (i * height) / 3;
//    }
//    var dataset4 = new Array(
//      (modelParam[2] * modelParam[1] + modelParam[1] * modelParam[0]) * model
//    );
//    var dataset5 = new Array(modelParam[2] * 1);
//    var dataset6 = new Array(modelParam[0] * 1);
//    var dataset7 = new Array(1);
//    var circleStep = new Array(3);
//    circleStep[0] = height / dataset1.length;
//    circleStep[1] = height / dataset2.length;
//    circleStep[2] = height / dataset3.length;
//
//    //矩形所占的宽度（不包括空白），单位为像素
//    var circleWidth1 = circleStep[0] * 0.5;
//    var circleWidth2 = circleStep[1] * 0.5;
//    var circleWidth3 = circleStep[2] * 0.5;
//    var textcontent = [
//      "inputLayer",
//      "hiddenLayer",
//      "hiddenLayer",
//      "outputLayer",
//    ];
  
//        let svg = d3.select("body").select("#MLPgraph");
    svg.selectAll("*").remove();
    svg
      .attr("width", width) //设定<svg>的宽度属性
      .attr("height", height); //设定<svg>的高度属性
    let g = svg.append("g");
    var defs = g.append("defs");
    var arrowMarker = defs
      .append("marker")
      .attr("id", "arrow")
      .attr("markerUnits", "strokeWidth")
      .attr("markerWidth", "6")
      .attr("markerHeight", "6")
      .attr("viewBox", "0 0 6 6")
      .attr("refX", "3")
      .attr("refY", "3")
      .attr("orient", "auto");
    var arrow_path = "M1,1 L5,3 L1,5 L2,3 L1,1";
    arrowMarker.append("path").attr("d", arrow_path).attr("fill", "#000");
    var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    var line =g.selectAll("line")
        .data(lineData)
        .enter()
        .append("line")
        .attr("x1",(d,i)=>d.x1)
        .attr("y1",(d,i)=>d.y1)
        .attr("x2",(d,i)=>d.x2)
        .attr("y2",(d,i)=>d.y2)
        .attr("stroke", "black")
        .attr("stroke-width", (d,i)=>Math.abs(d.data))
        .attr("marker-end", "url(#arrow)")
        .on("mouseover",function(event,d)
        {
            tooltip.transition()
//            .duration(100)
            .style("opacity", .9);
            tooltip.html("Weight: " + d.data)
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY - 28) + "px");
            d3.select(this)
            .attr("stroke","yellow")
        })
        .on("mouseout", function (d) {
        tooltip.transition()
            .duration(500)
            .style("opacity", 0);
            d3.select(this)
            .attr("stroke","black")
        });


    //绘制箭头
//    var line1 = g
//      .selectAll("line1")
//      .data(dataset4) //绑定数据
//      .enter() //获取enter部分
//      .append("line")
//      .attr("x1", (d, i) =>
//        i < modelParam[0]* modelParam[1] ? width / 6 : (width / 6) * 2
//      )
//      .attr("y1", (d, i) =>
//        i <modelParam[0] *modelParam[1]
//          ? ((i % modelParam[0]) + 1) * circleStep[0] - circleWidth1
//          : (((i - modelParam[0] * modelParam[1] + 1) % modelParam[1]) + 1) *
//              circleStep[1] -
//            circleWidth2
//      )
//      .attr("x2", (d, i) =>
//        i < modelParam[0] * modelParam[1] ? (width / 6) * 2 : (width / 6) * 3
//      )
//      .attr("y2", (d, i) =>
//        i < modelParam[0] * modelParam[1]
//          ? ((i - (i % modelParam[0])) / modelParam[0] + 1) *
//              circleStep[1] -
//            circleWidth2
//          : ((i -
//              modelParam[0] * modelParam[1] -
//              ((i - modelParam[0] * modelParam[1]) % modelParam[1])) /
//              modelParam[1] +
//              1) *
//              circleStep[2] -
//            circleWidth3
//      )
//      .attr("stroke", "black")
//      .attr("stroke-width", 1)
//      .attr("marker-end", "url(#arrow)");
//    var line2 = g
//      .selectAll("line2")
//      .data(dataset5) //绑定数据
//      .enter() //获取enter部分
//      .append("line")
//      .attr("x1", (d, i) => (width / 6) * 3)
//      .attr(
//        "y1",
//        (d, i) =>
//          (((i + 1) % modelParam[2]) + 1) * circleStep[2] - circleWidth3
//      )
//      .attr("x2", (d, i) => (width / 6) * 4)
//      .attr("y2", (d, i) => height / 2)
//      .attr("stroke", "black")
//      .attr("stroke-width", 1)
//      .attr("marker-end", "url(#arrow)");
//        //左侧箭头
//    var line3 = g
//      .selectAll("line3")
//      .data(dataset6) //绑定数据
//      .enter() //获取enter部分
//      .append("line")
//      .attr("x1", (d, i) => width / 12)
//      .attr("y1", (d, i) => (i + 1) * circleStep[0] - circleWidth1)
//      .attr("x2", function (d, i) {
//        return width / 6;
//      })
//      .attr("y2", (d, i) => (i + 1) * circleStep[0] - circleWidth1)
//      .attr("stroke", "black")
//      .attr("stroke-width", 1)
//      .attr("marker-end", "url(#arrow)");
       //右侧箭头
//    var line4 = g
//      .selectAll("line4")
//      .data(dataset7) //绑定数据
//      .enter() //获取enter部分
//      .append("line")
//      .attr("x1", (d, i) => (width / 6) * 4)
//      .attr("y1", (d, i) => height / 2)
//      .attr("x2", (d, i) => (width / 6) * 4.5)
//      .attr("y2", (d, i) => height / 2)
//      .attr("stroke", "black")
//      .attr("stroke-width", 1)
//      .attr("marker-end", "url(#arrow)");
        //文字绘制
//    var text = g
//      .selectAll("text")
//      .data(textcontent) //绑定数据
//      .enter() //获取enter部分
//      .append("text") //添加text元素，使其与绑定数组的长度一致
//      .attr("fill", "black")
//      .attr("font-size", "15px")
//      .attr("text-anchor", "middle")
//      .attr("x", function (d, i) {
//        return ((i + 1) * width) / 6;
//      })
//      .attr("y", function (d) {
//        return height * 1.1;
//      })
//      .text(function (d, i) {
//        return d;
//      });
    var circle = g
      .selectAll("circle")
      .data(circleData)
      .enter()
      .append("circle")
      .attr("class", "circle")
      .attr("cx", (d,i)=> d.x)
      .attr("cy", (d, i) => d.y)
      .attr("r", "15px")
      .attr("fill", (d,i)=>d.color)
      .on("mouseover",function(event,d)
      {
        tooltip.transition()
//            .duration(100)
        .style("opacity", .9);
        tooltip.html("Bias: " + d.bias)
        .style("left", (event.pageX) + "px")
        .style("top", (event.pageY - 28) + "px");
        d3.select(this)
        .attr("fill","yellow")
    })
    .on("mouseout", function (event,d) {
         tooltip.transition()
        .duration(500)
        .style("opacity", 0);
        d3.select(this)
        .attr("fill",d.color)
    });
//    var circle2 = g
//      .selectAll("circle2")
//      .data(dataset2)
//      .enter()
//      .append("circle")
//      .attr("class", "circle2")
//      .attr("cx", (width / 6) * 2)
//      .attr("cy", (d, i) => (i + 1) * circleStep[1] - circleWidth2)
//      .attr("r", "15px")
//      .attr("fill", "#F7D76F");
//    var circle3 = g
//      .selectAll("circle3")
//      .data(dataset3)
//      .enter()
//      .append("circle")
//      .attr("class", "circle3")
//      .attr("cx", (width / 6) * 3)
//      .attr("cy", (d, i) => (i + 1) * circleStep[2] - circleWidth3)
//      .attr("r", "15px")
//      .attr("fill", "#F7D76F");
//    var circle4 = g
//      .selectAll("circle4")
//      .data(dataset4)
//      .enter()
//      .append("circle")
//      .attr("class", "circle4")
//      .attr("cx", (width / 6) * 4)
//      .attr("cy", height / 2)
//      .attr("r", "15px")
//      .attr("fill", "#1DC4A0");
  }

window.onDrawMLPReady = function (netParam,modelParam) {
    // Execution of drawing logic
    drawMLP(netParam,modelParam);
}


//.tooltip {
//    position: absolute;
//    text-align: center;
//    padding: 2px;
//    font: 12px sans-serif;
//    background: lightsteelblue;
//    border: 0px;
//    border-radius: 8px;
//    pointer-events: none;
//}
