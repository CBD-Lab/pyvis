function drawMatrixGraph(graph){
    function trim(str){
        return str.replace(/\s|\xA0/g,"");
    }
    console.log(graph);
    var nodes=graph.nodes;
    var links=graph.links;
//                var svgbox = document.getElementById("graph").getBBox();
//                var netw = svgbox.width;
//                var neth = svgbox.height;
    var neth=height;
    var netw=width;
    console.log(neth,netw);

    var svg = d3.select("#graph")
        .attr("width", netw)
        .attr("height", neth);
    d3.select('svg').selectAll('*').remove();

    svg.append("rect")
       .attr("x",1)
       .attr("y",1)
       .attr("width",netw-2)
       .attr("height",neth-2)
       .attr("stroke","#777")
       .attr("fill","#FFF");

    //console.log(nodes,links);
    var nodecount=nodes.length;
    var edgecount=links.length;
    var nodeweight=new Array(nodes.length);
    var ncount=nodes.length;
    var R=neth/nodes.length*0.5;
    if(nodes.length<40) R=10;
    var iid;

    var bgrecdata=new Array(ncount*ncount);
    var bgrec=svg.selectAll('rect')
            .data(bgrecdata)
            .enter()
            .append("rect")
            .attr("x",(d,i)=>(width/5+R+(2*R)*(i%ncount)))
            .attr("y",(d,i)=>(3*R+(2*R)*Math.floor(i/ncount)))
            .attr("width",Math.abs(2*R-1))
            .attr("height",Math.abs(2*R-1))
            .attr("fill","lightgray");

    var textlist=svg.selectAll(".textList")
                 .data(nodes)
                 .enter()
                 .append("text")
                 .attr("class","textList")
                 .attr("font-family","Times New Roman")
                 .attr("font-size",""+R*2+"px")
                 .attr("font-weight","bold")
                 .attr("text-anchor","right")
                 .attr("x",(d,i)=>{
                    //console.log(d,i);
                    var tt=trim(d.name);//去字符串首尾空格
                    return 5;
                 })
                 .attr("y",(d,i)=>{return R*5+i*R*2})
                 .text((d)=>{return d.name;})
                 .on("mouseover", function(d,i){
                    d3.select(this)
                      .attr("fill","#F00")
                      .attr("font-size","20px");
                    nodeLeft.filter( function(t){ 	//过滤器
                         //console.log(t,"zuo+",i,);
                         return t.name== i.name;
                    })
                    .attr("r",R*1.5);
                    node.filter( function(t){ 	//过滤器
                         //console.log("shang+");
                         return t.name== i.name;
                    })
                    .attr("r",R*1.5);
                 })
                 .on("mouseout", function(d,i){
                    d3.select(this)
                      .attr("fill","#000")
                      .attr("font-size",""+R*2+"px");
                    nodeLeft.filter( function(t){ 	//过滤器
                         return t.name== i.name;
                    })
                    .attr("r",R);
                    node.filter(function(t){ 	//过滤器
                         return t.name== i.name;
                    })
                    .attr("r",R);
                 })
                 .on("mousedown", function(d,i){
                    textlist.filter( function(t){ 	//过滤器
                            //console.log(t.index,i)
                             return t.name != i.name;
                        })
                        .attr("fill","#000")
                        .attr("font-size",""+R*2+"px");
                    link.filter(function(l){ 	//过滤器
                         textlist.filter(function(t,m){ 	//过滤器
                                //console.log('link',l,i,t,m)
                                if (i.name == t.name){
                                    iid = m;
                                }
                                return (m==l.target)&&(l.source == iid);
                         })
                         .attr("fill","rgb(255, 127, 14)")
                         .attr("font-size",""+R*2+"px");
                         return l.source == iid;//以当前text做头
                    })
                    .attr("fill","rgb(255,127,14)")   //橙色（依赖其他的.py模块）
                    .attr("stroke-width",1);
                    link.filter( function(l){ 	//过滤器
                         textlist.filter( function(t,m){ 	//过滤器
                                return (m==l.source)&&(l.target == iid);
                         })
                         .attr("fill","rgb(44,160,44)")
                         .attr("font-size",""+R*2+"px");
                         return l.target == iid;//以当前text做尾
                    })
                    .attr("fill","rgb(44,160,44)")   //绿色（被其他.py模块依赖）
                    .attr("stroke-width",1);

                    link.filter(function(l){ 	//过滤器
                             return l.source.index != iid && l.target.index != iid;
                        })
                        .attr("fill","FFFFFF")
                        .attr("stroke-width",1);

                    textlist.filter( function(t,m){ 	//过滤器
                             return m == iid;
                        })
                        .attr("fill","#F00")
                        .attr("font-size","18px");
                    //console.log('iid',iid);
                });

    var link = svg.selectAll(".link")
          .data(links)
          .enter().append("rect")
          .attr("class", "link")
          .attr("x", (d,i)=>{
                //console.log(d,i)
                return width/5+R+d.source*R*2})
          .attr("y", (d,i)=>{return 3*R+d.target*R*2})
          .attr("width",Math.abs(2*R-1))
          .attr("height",Math.abs(2*R-1))
          .attr("fill","rgb(255,127,14)")
          .on("mouseover", function(d,i){
                    d3.select(this)
                      .attr("fill","#F00");
//                                  .attr("stroke",null);

                    nodeLeft.filter( function(t,m){ 	//过滤器
                         //console.log(i,t,m)
                         return m== i.target;
                    })
                    .attr("r",R*1.5);
                    node.filter(function(t,m){ 	//过滤器
                         //console.log("111",d.source.index);
                         return m == i.source;
                    })
                    .attr("r",R*1.5);

                    textlist.filter(function(t,m){ 	//过滤器
                        return m == i.target;
                    })
                    .attr("fill","#F00")
                    .attr("font-size","18px");
          })
          .on("mouseout", function(d,i){
                    d3.select(this)
                      .attr("fill","rgb(255,127,14)");
                    nodeLeft.filter(function(t,m){ 	//过滤器
                         return m== i.target;
                    })
                    .attr("r",R);
                    node.filter( function(t,m) { 	//过滤器
                         return m== i.source;
                    })
                    .attr("r",R);

                    textlist.filter( function(t,m) { 	//过滤器

                        return m == i.target;
                    })
                    .attr("fill","#000")
                    .attr("font-size",""+R*2+"px");
          });

    var node = svg.selectAll(".node")
          .data(nodes)
          .enter().append("circle")
          .attr("class", "node")
          .attr("r", R)
          .attr("cx", (d,i)=>{return width/5+R*2+R*2*i})
          .attr("cy",R*2)
          .attr("fill",  (d,i)=> {return color[i%10]; })
          .attr("stroke", "black")
          .attr("stroke-width",2)
          .on("mouseover", function(d,i){
                d3.select(this)
                 .attr("r",R*1.5);
                nodeLeft.filter( function(t) {
                         return t.name== i.name;
                    })
                   .attr("r",R*1.5);

                textlist.filter( function(m) {
                         return m.name == i.name;
                    })
                    .attr("fill","#F00")
                    .attr("font-size","18px")
                    .attr("dx",80);
          })
          .on("mouseout", function(d,i) {
                d3.select(this)
                  .attr("r",R);
                nodeLeft.filter( function(t) {
                         return t.name== i.name;
                    })
                   .attr("r",R);

                textlist.filter( function(m) {
                         return m.name == i.name;
                    })
                    .attr("fill","#000")
                    .attr("font-size",""+R*2+"px")
                    .attr("dx",0);
          })
          .on("mousedown", function(d,i) {
                textlist.filter( function(t) {
                        return(t.name!=i.name)
                    })
                    .attr("fill","#000")
                    .attr("dx",0);
                link.filter( function(l) {
                         textlist.filter( function(t,m) {
                                //console.log(i,t,m,n);
                                if (i.name == t.name){
                                    iid = m;
                                }
                                return (m==l.target)&&(l.source == iid);
                         })
                         .attr("fill","rgb(255, 127, 14)")
                         .attr("font-size",""+R*2+"px")
                         .attr("dx",20);
                         return l.source == iid;
                    })
                    .attr("fill","#F00")
                    .attr("stroke-width",1);
                link.filter( function(l) {
                         textlist.filter( function(t,m) {
                                return (m==l.source)&&(l.target == iid);
                         })
                         .attr("fill","rgb(44,160,44)")
                         .attr("font-size",""+R*2+"px")
                         .attr("dx",20);
                         return l.target == iid;
                    })
                    .attr("fill","rgb(44,160,44)")
                    .attr("stroke-width",1);
                link.filter( function(l) {
                         return l.source != iid && l.target != iid;
                    })
                    .attr("fill","lightgray")
                    .attr("stroke-width",1);
                textlist.filter( function(t,m){
                        return(m==iid)
                    })
                    .attr("fill","#F00")
                    .attr("font-size","18px");
                console.log('nodiid',iid);
          });

    var nodeLeft = svg.selectAll(".nodeLeft")
          .data(nodes)
          .enter().append("circle")
          .attr("class", "nodeLeft")
          .attr("r", R)
          .attr("cy",(d,i)=>{return R*4+R*2*i})
          .attr("cx",width/5)
          .attr("fill",(d,i)=> {return color[i%10]; })
          .attr("stroke","black")
          .attr("stroke-width",0.5)
          .on("mouseover",function(d,i) {    //加入提示框
                d3.select(this)
                 .attr("r",R*1.5);

                node.filter(function(t) { 	//过滤器
                         return t.name== i.name;
                    })
                  .attr("r",R*1.5);
                textlist.filter( function(m){ 	//过滤器
                         return m.name == i.name;
                    })
                    .attr("fill","#F00")
                    .attr("font-size","18px");
          })
          .on("mouseout",function(d,i){

                d3.select(this)
                  .attr("r",R);
                node.filter(function(t){ 	//过滤器
                         return t.name == i.name;
                    })
                   .attr("r",R);
                textlist.filter(function(m){ 	//过滤器
                         return m.name == i.name;
                    })
                    .attr("fill","#000")
                    .attr("font-size",""+R*2+"px");
          })
          .on("mousedown",function(d,i){
                textlist.filter(function(t,m){ 	//过滤器
                         if (i.name == t.name){
                                    iid = m;
                                }
                         return t.name != i.name;
                    })
                    .attr("fill","#000")
                    .attr("font-size",R*2)
                    .attr("x",5);
                textlist.filter(function(t){ 	//过滤器
                         return t.name == i.name;
                    })
                    .attr("fill","#F00")
                    .attr("font-size","18px");
                link.filter( function(l){ 	//过滤器
                         return l.source == iid;
                    })
                    .attr("fill","rgb(255,127,14)")   //橙色（依赖其他的.py模块）
                    .attr("stroke-width",1);
                link.filter(function(l){ 	//过滤器
                         return l.target == iid;
                    })
                    .attr("fill","rgb(44,160,44)")   //绿色（被其他.py模块依赖）
                    .attr("stroke-width",1);
                link.filter(function(l) { 	//过滤器
                         return l.source != iid && l.target != iid;
                    })
                    .attr("fill","heightgray")//为什么不是heightgray
                    .attr("stroke-width",1);
                console.log('leftiid',iid);
          });


}//end drawMatrixGraph()

window.onDrawMatrixReady = function(data) {
    // 执行绘图逻辑
    drawMatrixGraph(data);
}