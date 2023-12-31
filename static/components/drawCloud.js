function drawCloud(data,search,cloudcount,kdoc,showFile){
      var width = (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) * 0.84;
      var height = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) * 0.89;

      var arraycolor = new Array(10);
      for (var i = 0; i < 10; i++) {
        arraycolor[i] = color[i];
      }

    var pdfs = new Map();
    var gits = new Map();
    var pdfchange = 0;
    var gitchange = 0;


      var hidata = d3.hierarchy(data);
      var tree=d3.tree()
               .size([height,width*0.7]);
      var hiwords = new Array(hidata.length);
      var root=tree(hidata);
      var links=root.links();
      var worddata=root.descendants();

      cloudcount.node = worddata.length;
      var depth=0;
      for (var i = 0; i < worddata.length; i++) {
            if(worddata[i].children)
            hiwords[i] = { text:worddata[i].data.name,size:(worddata[i].height+1)*6 ,leaf:"False",parent:worddata[i].parent,depth:worddata[i].depth};
            else
            {
            depth=worddata[i].depth;
            hiwords[i] = { text: worddata[i].data.name, size:(worddata[i].height+1)*6 ,leaf:"True" ,parent:worddata[i].parent,depth:worddata[i].depth};
        }}
      var wc = d3.layout.cloud()
          .size([width*0.85, height])
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
         var svg=d3.select("#graph").append("svg")
            .attr("id", "cloudsvg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")

         svg.selectAll("text")
            .data(hiwords)
            .enter()
            .append("a")
            .append("text")
            .style("font-size", d => d.size)
            .style("font-family", "Impact")
            .style("cursor", "pointer")
            .style("fill", function (d, i) {
                if(worddata[i].data.linkAll &&
                 ((typeof( worddata[i].data.linkAll['pdfClass']) !== "undefined" && Object.keys(worddata[i].data.linkAll['pdfClass']).length > 0)
                 || (typeof( worddata[i].data.linkAll['gitClass']) !== "undefined" && Object.keys(worddata[i].data.linkAll['gitClass']).length > 0)
                 || (typeof( worddata[i].data.linkAll['pdfModule']) !== "undefined" && Object.keys(worddata[i].data.linkAll['pdfModule']).length > 0)))
                 { return 'black';
                 }
                 else{
                    return color[worddata[i].depth]; }})
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
            .on("mouseover", function(d,i){
                d3.select(this)
                    .attr("font-weight", "bold");
             var fullname = i.text;
              var point = i;
              while (point.depth >= 0 && point.parent) {
                point = point.parent;
                if(!(point.data.name=='package'&&point.depth==0)){//delete the first layer"package." pylibstree
                        fullname = point.data.name + '.' + fullname;
                    }
              }

              var [x, y] = d3.pointer(event);
              var text = d3.select('#svgbox').append("tooltip")
                            .html(fullname)
                            .style("left", (width*0.2) + "px")
                            .style("top", (height*0.2) + "px")
                            .style("position", "absolute")
                            .style("background-color", "white")
                            .style("border-radius", "5px")
                            .style("padding", "5px")
                            .style("box-shadow", "0px 4px 6px rgba(0, 0, 0, 0.1)");
            })
           .on("mouseout", function(d) {
                d3.select(this)
                  .attr("font-weight", "normal");
                d3.select('#svgbox').selectAll("tooltip").remove();
              })
            .on("click", (d, i) => {
             var fullname = i.text.split('.', 1)[0];
              var point = i;
              while (point.depth >= 0 && point.parent) {
                point = point.parent;
                if(!(point.data.name=='package'&&point.depth==0)){//delete the first layer"package." pylibstree
                        fullname = point.data.name + '.' + fullname;
                    }
              }
                kdoc.moduledir=fullname;
                kdoc.classname='';
                showFile(kdoc)
            })
            .each(function(d,i) {
                if(worddata[i].data.linkAll && typeof( worddata[i].data.linkAll['pdfClass']) !== "undefined" && Object.keys(worddata[i].data.linkAll['pdfClass']).length > 0)
                {
                    for (key in worddata[i].data.linkAll['pdfClass']){
                        pdfs.set(key,worddata[i].data.linkAll['pdfClass'][key]);
                    }
                }
                if(worddata[i].data.linkAll && typeof( worddata[i].data.linkAll['gitClass']) !== "undefined" && Object.keys(worddata[i].data.linkAll['gitClass']).length > 0)
                {
                    for (key in worddata[i].data.linkAll['gitClass']){
                        gits.set(key,worddata[i].data.linkAll['gitClass'][key]);
                    }
                }
                if (worddata[i].data.linkAll && typeof(worddata[i].data.linkAll["pdfModule"]) !== "undefined" && worddata[i].data.linkAll["pdfModule"].length > 0)
                {
                    var fullname = worddata[i].data.name.split('.', 1)[0];
                    var point = worddata[i];
                    while (point.depth >= 0 && point.parent) {
                        point = point.parent;
                        if(!(point.data.name=='package'&&point.depth==0)){//delete the first layer"package." pylibstree
                        fullname = point.data.name + '.' + fullname;
                    }
                    }
                    pdfs.set(fullname,worddata[i].data.linkAll['pdfModule'][0])
                }
            });

         var colorrec = d3.select("svg").selectAll('rect')
            .data(arraycolor.splice(0,depth+1))
            .enter()
            .append("rect")
            .attr("x", 1100)
            .attr("y", (d, i) => (i * 20 + height * 0.1))
            .attr("width", 18)
            .attr("height", 18)
            .attr("opacity", 0.9)
            .attr("fill", (d, i) => d)
            .on("click", function(d, i) {
                var currentOpacity = d3.select(this).attr("opacity");
                let currentLayer=0;
                for(k=0;k<10;k++)
                {
                    if(color[k]==i){
                        currentLayer=k;
                        break;}
                }
            var allLayerOpacities = [];

            svg.selectAll("text").nodes().forEach(function(textNode,i) {
                var opacity = d3.select(textNode).attr("opacity");
                allLayerOpacities[hiwords[i].depth] = opacity;
            });
                if(currentOpacity!=0.9){  // Click to display the current level of word cloud data
                    d3.select(this).attr("opacity","0.9");
                    svg.selectAll("text").attr("opacity", function (d,i) {
                            if (d.depth === currentLayer) {
                                return 0.8;
                            }
                            else
                            {
                                return allLayerOpacities[d.depth];
                            }
                        })
                    }
                else  // Click to hide the current word cloud data
                    {
                    svg.selectAll("text").attr("opacity", function (d,i) {
                            if (d.depth === currentLayer) {
                                return 0;  // Set transparency to 0 to hide the element
                            }
                            else
                            {
                                return allLayerOpacities[d.depth];
                            }
                        })
                    d3.select(this).attr("opacity","0.1");
                    }
            });

          var info = d3.select("svg").append("text")
            .attr("x", width * 0.7)
            .attr("y", 85)
            .attr("font-size", "20px")
            .attr("font-weight", "bold")
            .attr("fill", color[2])

        }

         d3.select("input[id=showPdf2]").on("change", function () {
//        console.log('sp',gits);
        if (pdfchange == 0){
			pdfchange = 1;
			if (gitchange==1){
                d3.select('#gitshow2').remove();
                d3.select("input#showGit2").property("checked", false);
                gitchange=0;
			}
			var pdfinfo = d3.select('#svgbox').append("div")
                        .attr("class", "tooltip")
                        .attr('id','pdfshow2')
                        .style("left", (width * 0.2) + "px")
                        .style("top", (height * 0.15) + "px")
                        .style("background-color", "white")
                        .style("border-radius", "5px")
                        .style("padding", "5px")
                        .style("box-shadow", "0px 2px 4px rgba(0, 0, 0, 0.1)")
                        .style('list-style','none')
                        .style("cursor", "pointer");

            pdfinfo.append("foreignObject")
                    .attr("height", "12px")
                    .append("xhtml:div")
                    .style("display", "flex")
                    .style("align-items", "center")
                    .style("margin", 0)
                    .style("padding", 0)
                    .html('<img src=pathUrl+"/get_svg/pdf.svg" style="width: 8px; height: 15px; margin-right: 5px;"/>')
                    .append("span")
                    .attr("class", "close")
                    .attr("color", "red")
                    .text("x")
                    .style("position", "absolute")
                    .style('right',"0")
                    .on("click", () => {
                      pdfinfo.remove();
                      d3.select("input#showPdf2").property("checked", false);
                      pdfchange = 0;
                    });

            if (pdfs.size == 0){
                pdfinfo.append('text')
                    .attr("stroke-family", "FangSong")
                    .attr("font-size", "10px")
                    .attr('opacity',0.7)
                    .text("no PDF!");
            }
            else{
                pdfs.forEach((value, key) => {
                    console.log('vk', value, key);
                    pdfinfo.append('text')
                        .attr("stroke-family", "FangSong")
                        .attr("font-size", "10px")
                        .text(key)
                        .on("click",function()
                        {
                            pdfgitclick(key);
                        });
                    pdfinfo.append('br');
                });
            }
        }
		else{
			pdfchange = 0;
            d3.select('#pdfshow2').remove();
        }
	});
	d3.select("input[id=showGit2]").on("change", function () {
        if (gitchange == 0){
            gitchange = 1;
            if (pdfchange==1){
                d3.select('#pdfshow2').remove();
                d3.select("input#showPdf2").property("checked", false);
                pdfchange=0;
            }

            var gitinfo = d3.select('#svgbox').append("div")
                        .attr("class", "tooltip")
                        .attr('id','gitshow2')
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
                    .html('<img src=pathUrl+"/get_svg/github.svg" style="width: 10px; height: 10px; margin-right: 5px;"/>')
                    .append("span")
                    .attr("class", "close")
                    .attr("color", "red")
                    .text("x")
                    .style("position", "absolute")
                    .style('right',"0")
                    .on("click", () => {
                      gitinfo.remove();
                      d3.select("input#showGit2").property("checked", false);
                      gitchange = 0;
                    });
            if (gits.size == 0){
                gitinfo.append('text')
                    .attr("stroke-family", "FangSong")
                    .attr("font-size", "10px")
                    .text("no GitHub files !");
            }
            else{
                gits.forEach((value, key) => {
//                    console.log('vk', value, key);
                    gitinfo.append('text')
                        .attr("stroke-family", "FangSong")
                        .attr("font-size", "10px")
                        .text(key)
                        .on("click",function()
                        {
                            pdfgitclick(key);
                        });
                    gitinfo.append('br');
                });
            }
        }
		else{
		    gitchange = 0;
            d3.select('#gitshow2').remove();
        }
	});
	// pdf and git click event
	function pdfgitclick(classname){
        console.log('pgc',classname);
        fetch(pathUrl+'/classVariable?wanted=' + classname)
        .then(response => response.json())
        .then(data => {
            var tips = d3.select("body")
                        .append("div")
                        .attr("class","popup")
                        .style("width", "500px")
            var drag=d3.drag()
                        .on("start", function (event) {
                            // Record the position at the start of the drag
                            var startX = event.x;
                            var startY = event.y;
                            // Get the position of the current cue box
                            var currentLeft = parseFloat(tips.style("left"));
                            var currentTop = parseFloat(tips.style("top"));
                            // Calculate the mouse offset relative to the upper-left corner of the cue box
                            offsetX = startX - currentLeft;
                            offsetY = startY - currentTop;
                        })
                        .on("drag", function (event) {
                        // Update cue box position with mouse movement
                            tips.style("left", (event.x - offsetX) + "px")
                                .style("top", (event.y - offsetY) + "px");
                        });
            // Bind the drag behavior to the element to be dragged
            tips.call(drag);
            var closeButton=tips.append("span")
                      .attr("class","close")
                      .attr("color","red")
                      .text("x")
                      .on("click",function(){
                      d3.select(".popup").remove();
                      });
            // Setting the Close Button Position
            closeButton.style("position", "fixed")
                      .style("top", "0")
                      .style("left", "0");
            var contentContainer = tips.append("div").attr("class", "content-container");
            var tableContainer = contentContainer.append("table").attr("class", "var-fun-container var-fun-container table-style");
            var tableHeader = tableContainer.append("thead").append("tr");
            tableHeader.append("th").text("Variable");  // Table header column 1
            tableHeader.append("th").text("Function");  // Table header column 2

            var tableBody = tableContainer.append("tbody");  // Creating the main part of the form
            var row = tableBody.append("tr");  // Create a line
            row.append("td").attr("class", "contentVar").style("color", "green").html(data['var'].join("<br>"));  // first column
            row.append("td").attr("class", "contentFun").style("color", "blue").html(data['fun'].join("<br>"));  // second column
            var docContainer = tips.append("div").attr("class", "contentDoc-container");
            var textWithLinks = data['doc'];
            var linkRegex = /(\bhttps?:\/\/\S+\b)/g;  // \b matches word boundaries, \s looks for blank characters
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
        });
    }
}

window.onDrawCloudReady = function(data,search,cloudcount,kdoc,showFile) {
    console.log('drawTree.js is ready');
    // Execution of drawing logic
    drawCloud(data,search,cloudcount,kdoc,showFile);
}
