function drawCloud(data,search){
      var arraycolor = new Array(10);
      for (var i = 0; i < 10; i++) {
        arraycolor[i] = color[i];
      }
      var hidata = d3.hierarchy(data);
//      var worddata = hidata.descendants();
      var tree=d3.tree()
               .size([height,width*0.7]);
      var hiwords = new Array(hidata.length);
      var root=tree(hidata);
      var links=root.links();
      var worddata=root.descendants();
      console.log(worddata);
      for (var i = 0; i < worddata.length; i++) {
//          hiwords[i] = { text: worddata[i].data.name, size:(worddata[i].height+1)*6 };
            if(worddata[i].children)
            hiwords[i] = { text:worddata[i].data.name,size:(worddata[i].height+1)*6 ,leaf:"False",parent:worddata[i].parent,depth:worddata[i].depth};
            else
            hiwords[i] = { text: worddata[i].data.name, size:(worddata[i].height+1)*6 ,leaf:"True" ,parent:worddata[i].parent,depth:worddata[i].depth};
        }
      var wc = d3.layout.cloud()
          .size([width, height])
          .words(hiwords)
          .padding(0)
          .rotate(0)
          .font("Impact")
          .fontSize(function (d) {
            return d.size;
          })
          .on("end", draw)
          .start();

       function draw(words) {
          d3.select("#graph").append("svg")
            .attr("id", "cloudsvg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
            .selectAll("text")
            .data(hiwords)
            .enter()
            .append("a")
            .append("text")
            .style("font-size", d => d.size)
            .style("font-family", "Impact")
            .style("fill", function (d, i) {
             if(d.leaf=="True")
                {
                return "black";
                }
             else
            return color[worddata[i].depth]; })
            .attr("text-anchor", "middle")
            .attr("transform", function (d) {
              return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .attr("opacity", 0.8)
            .attr("background-color",function(d)
            {
                if(d.leaf=="True")
                {
                return "grey";
                }
            })
            .text(function (d) { return d.text; })
            .on("click",function(d,i)
            {
              console.log(d,i)
              var fullname = i.text.slice(0, -3);
              var point=i;
                while(point.depth>=0&& point.parent)
                {
                    point=point.parent;
                    fullname = point.data.name +'.'+ fullname; // 使用 + 运算符连接字符串
                }
                fullname="torch."+fullname;
            search(fullname)
            console.log(d,i,fullname);
            fetch('http://127.0.0.1:5006/leafCode?wanted=' + fullname)
                    .then(response => response.text())
                    .then(data => {
                     const tips = d3.select("body")
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
                        .text(data)


    tips.style("position", "absolute")
            .style("top", "50%")
            .style("left", "50%")
            .style("transform", "translate(-50%, -50%)")
            .style("background-color", "white")
            .style("border", "1px solid black");  
                        console.log(data);
                        })
                    .catch(error => {
                        console.error('Error executing Python script:', error);
                        // 处理错误
                    });
            });

          var colorrec = d3.select("svg").selectAll('rect')
            .data(arraycolor)
            .enter()
            .append("rect")
            .attr("x", (d, i) => (i * 20 + width * 0.86))
            .attr("y", 20)
            .attr("width", 18)
            .attr("height", 18)
            .attr("opacity", 0.8)
            .attr("fill", (d, i) => arraycolor[i]);

          var info = d3.select("svg").append("text")
            .attr("x", width * 0.7)
            .attr("y", 85)
            .attr("font-size", "20px")
            .attr("font-weight", "bold")
            .attr("fill", color[2])
            .text("Totally " + worddata.length+" Nodes");
        }
}

window.onDrawCloudReady = function(data,search) {
    console.log('drawTree.js is ready');
    // 执行绘图逻辑
    drawCloud(data,search);
}
