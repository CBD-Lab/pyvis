function drawPineTree(data,pineCount,kdoc) {
    var width = (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) * 0.84;
    var height = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) * 0.89;

	var svg = d3.select("#graph")
		.attr("width", width)
		.attr("height", height);

    var pdfs = new Map();
    var gits = new Map();
    var pdfchange = 0;
    var gitchange = 0;

	// Get div element with ID attribute
	var symboltext = ['py','pyi','dll','pxd','else','c','pic','file']
	var symbolli = svg.selectAll('.symbol')
		.data(symboltext)
		.enter()
		.append("path")
		.attr("transform", function(d,i) {
            return "translate(" +(width*0.7+i*20)+ "," + 40 + ")";
        })
        .attr("d", function(d,i) {
              if (i == 7){
                  var pathdata = "M -5 -5 L -5 5 L 5 5 L 5 -2 L -1 -2 L -1 -5 Z";
                  return pathdata;
              }
              else {
                return d3.symbol().type(d3.symbols[i])();
              }
        })
		.attr("fill", (d, i) => color[i])
		.attr("opacity", 0.7);
	var symbolinfo = svg.selectAll("text")
	    .data(symboltext)
	    .enter()
	    .append('text')
	    .attr("text-anchor", "middle")
		.attr("x", (d,i)=>width*0.7+i*20)
		.attr("y", 54)
		.attr("font-size", "10px")
		.attr("fill", color[2])
		.text((d,i)=>symboltext[i]);

	var data = d3.hierarchy(data)
		.sort((a, b) => d3.ascending(a.data.depth, b.data.depth));

	var info = svg.append("text")
		.attr("x", width * 0.1)
		.attr("y", 40)
		.attr("font-size", "20px")
		.attr("font-weight", "bold")
		.attr("fill", color[2])
		.text("Nodes=" + data.children.length);

    pineCount.node = data.children.length;
	var length = 100;
	var rate = 0.6;
	var x0 = width / 2;
	var y0 = height;
	var id = 0;  // children count
	var angle = Math.PI;
	var labelchange = 1;


	d3.select("input[id=lengthscale]").on("change", function () {
		length = this.value;
		d3.selectAll("line").remove();
		d3.selectAll("text").remove();
		d3.selectAll("path").remove();
		id = 0;
		show(data, x0, y0, length, rate, -Math.PI / 2, data.children.length);
		d3.selectAll("text")
			.attr("fill", "black");
	});
	d3.select("input[id=anglescale]").on("change", function () {
		angle = this.value;
		d3.selectAll("line").remove();
		d3.selectAll("text").remove();
		d3.selectAll("path").remove();
		id = 0;
		show(data, x0, y0, length, rate, -Math.PI / 2, data.children.length);
		d3.selectAll("text")
			.attr("fill", "black");
	});
	d3.select("input[id=ratescale]").on("change", function () {
		rate= this.value/100;
		d3.selectAll("line").remove();
		d3.selectAll("text").remove();
		d3.selectAll("path").remove();
		id = 0;
		show(data, x0, y0, length, rate, -Math.PI / 2, data.children.length);
		d3.selectAll("text")
			.attr("fill", "black");
	});
	d3.select("input[id=showLabel]").on("change", function () {
		d3.selectAll("text")
			.attr("opacity", d => labelchange == 0 ? 1 : 0);
		if (labelchange == 0)
			labelchange = 1;
		else
			labelchange = 0;
	});
	d3.select("input[id=showPdf3]").on("change", function () {
//        console.log('sp',gits);
        if (pdfchange == 0){
			pdfchange = 1;
			if (gitchange==1){
                d3.select('#gitshow3').remove();
                d3.select("input#showGit3").property("checked", false);
                gitchange=0;
			}
			var pdfinfo = d3.select('#svgbox').append("div")
                        .attr("class", "tooltip")
                        .attr('id','pdfshow3')
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
                    .html('<img src="http://127.0.0.1:5006/get_svg/pdf.svg" style="width: 8px; height: 15px; margin-right: 5px;"/>')
                    .append("span")
                    .attr("class", "close")
                    .attr("color", "red")
                    .text("x")
                    .style("position", "absolute")
                    .style('right',"0")
                    .on("click", () => {
                      pdfinfo.remove();
                      d3.select("input#showPdf3").property("checked", false);
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
            d3.select('#pdfshow3').remove();
        }
	});
	d3.select("input[id=showGit3]").on("change", function () {
        if (gitchange == 0){
            gitchange = 1;
            if (pdfchange==1){
                d3.select('#pdfshow3').remove();
                d3.select("input#showPdf3").property("checked", false);
                pdfchange=0;
            }

            var gitinfo = d3.select('#svgbox').append("div")
                        .attr("class", "tooltip")
                        .attr('id','gitshow3')
                        .style("left", (width * 0.2) + "px")
                        .style("top", (height * 0.15) + "px")
                        .style("background-color", "white")
                        .style("border-radius", "5px")
                        .style("padding", "5px")
                        .style("box-shadow", "0px 2px 4px rgba(0, 0, 0, 0.1)")
                        .style('list-style','none')
                        .style("cursor", "pointer");
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
                      d3.select("input#showGit3").property("checked", false);
                      gitchange = 0;
                    });
            if (gits.size == 0){
                gitinfo.append('text')
                    .attr("stroke-family", "FangSong")
                    .attr("font-size", "10px")
                    .text("no GitHub!");
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
            d3.select('#gitshow3').remove();
        }
	});

	function show(data, x0, y0, length, rate, a, count) {
		id++;
		var x1 = x0;
		var y1 = y0;
		var x2 = x1 + length * Math.cos(a);
		var y2 = y1 + length * Math.sin(a);
		var R = Math.log(data.data.value + 1) / 2 + 1;
		console.log(data,count);
		var now_data = data;
		svg.append("line")
			.attr("x1", x1)
			.attr("y1", y1)
			.attr("x2", x2)
			.attr("y2", y2)
			.attr("id", "line" + id)
			.attr("stroke", color[data.depth])
			.attr("stroke-width", data.height * 2 + 1)
			.attr("opacity", 0.7);

//		svg.append("circle")
//			.attr("cx", x2)
//			.attr("cy", y2)
//			.attr("r", d => count > 0 ? 0 : R)
//            .attr("fill",color[data.depth])
//			.attr("stroke", "white")
//			.attr("opacity", 0.7)
        svg.append("path")
            .attr("transform", function(d) {
                        return "translate(" + x2 + "," + y2+ ")";
                    })
            .attr("d", function(d) {
                  var endcase = (now_data.data.name).split('.')[1];
                  if (endcase == 'py'){
                      return d3.symbol().type(d3.symbols[0])();
                  }
                  else if (endcase == 'pyi'){
                      return d3.symbol().type(d3.symbols[1])();
                  }
                  else if (endcase == 'dll'){
                      return d3.symbol().type(d3.symbols[2])();
                  }
                  else if (endcase == 'pxd'){
                      return d3.symbol().type(d3.symbols[3])();
                  }
            //      else if (endcase == 'h'){
            //          return d3.symbol().type(d3.symbols[4])();
            //      }
                  else if (endcase == 'c'){
                      return d3.symbol().type(d3.symbols[5])();
                  }
                  else if ((endcase == 'png' ) || (endcase == 'jpg')){
                      return d3.symbol().type(d3.symbols[6])();
                  }
                  else if(now_data.children||now_data._children){
                      var pathdata = "M -5 -5 L -5 5 L 5 5 L 5 -2 L -1 -2 L -1 -5 Z";
                      return pathdata;
                  }
                  else//for unknown type of file
                  {
                      return d3.symbol().type(d3.symbols[4])();
                      }
            })
            .attr("opacity",d => count > 0 ? 0 : 0.5)
            .attr("stroke", "lightgray")
            .attr("fill", (d)=>{
                console.log(d,now_data);
                 if(now_data.data.linkAll &&
                 ((typeof( now_data.data.linkAll['pdfClass']) !== "undefined" && Object.keys(now_data.data.linkAll['pdfClass']).length > 0)
                 || (typeof( now_data.data.linkAll['gitClass']) !== "undefined" && Object.keys(now_data.data.linkAll['gitClass']).length > 0)
                 || (typeof( now_data.data.linkAll['pdfModule']) !== "undefined" && Object.keys(now_data.data.linkAll['pdfModule']).length > 0)))
                 {

                    return 'black';
                 }
                 else{
                    return color[now_data.depth];
                 }
            })
			.attr("cursor", "pointer")
			.on("mouseover", function(){
			    console.log('over',now_data);
                d3.select(this)
                    .attr("opacity",1);
                var fullname = now_data.data.name;
                var point = now_data;
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
                            .style("box-shadow", "0px 2px 4px rgba(0, 0, 0, 0.1)");
            })
           .on("mouseout", function(d) {
                d3.select(this)
                  .attr("opacity", d => count > 0 ? 0 : 0.5);
                d3.select('#svgbox').selectAll("tooltip").remove();
              })
		   .on("click", (d) => {
                var fullname = now_data.data.name.split('.', 1)[0];
                var point = now_data;
                while (point.depth >= 0 && point.parent) {
                    point = point.parent;
                    if(!(point.data.name=='package'&&point.depth==0)){//delete the first layer"package." pylibstree
                        fullname = point.data.name + '.' + fullname;
                    }
                }
                kdoc.moduledir=fullname;
                kdoc.classname='';
                var keyword = {
                    classname: '',
                    moduledir: fullname
                    };
                var keywordJson = JSON.stringify(keyword);
                fetch('http://127.0.0.1:5006/codeDoc?wanted=' + keywordJson)
                    .then(response => response.json())
                    .then(data => {
                        const language = 'python';
                        const highlightedCode = Prism.highlight(data.code, Prism.languages[language], language);
                        var tips = d3.select("body")
                                   .append("div")
                                   .attr("class", "popup");

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

                            console.log(data);
                        })
                .catch(error => {
                    console.error('Error executing Python script:', error);
                });
           })
           .each(function() {
                if(now_data.data.linkAll && typeof( now_data.data.linkAll['pdfClass']) !== "undefined" && Object.keys(now_data.data.linkAll['pdfClass']).length > 0)
                {
                    for (key in now_data.data.linkAll['pdfClass']){
                        pdfs.set(key,now_data.data.linkAll['pdfClass'][key]);
                    }
                }
                if(now_data.data.linkAll && typeof( now_data.data.linkAll['gitClass']) !== "undefined" && Object.keys(now_data.data.linkAll['gitClass']).length > 0)
                {
                    for (key in now_data.data.linkAll['gitClass']){
                        gits.set(key,now_data.data.linkAll['gitClass'][key]);
                    }
                }
                if (now_data.data.linkAll && typeof(now_data.data.linkAll["pdfModule"]) !== "undefined" && now_data.data.linkAll["pdfModule"].length > 0)
                {
                    var fullname = now_data.data.name.split('.', 1)[0];
                    var point = now_data;
                    while (point.depth >= 0 && point.parent) {
                        point = point.parent;
                        if(!(point.data.name=='package'&&point.depth==0)){//delete the first layer"package." pylibstree
                        fullname = point.data.name + '.' + fullname;
                        }
                    }
                    pdfs.set(fullname,now_data.data.linkAll['pdfModule'][0])
                }
        });

		svg.append("text")
			.attr("x", x2 + 20)
			.attr("y", y2 + 20)
			.attr("id", "text" + id)
			.attr("stroke-family", "FangSong")
			.attr("font-size", "20px")
			.attr("font-weight", "bold")
			.attr("fill", color[data.depth])
			.attr("opacity", d => count > 0 ? 1 : 0)
			.text(d => (count > -1) && ((id % 43 == 1)) ? data.data.name + "-" + id : "");

		if (count > 0) {
			for (var i = 0; i < count; i++) {
				data = data.children[i];
				var a = Math.PI * i / (count) - Math.PI + Math.PI * Math.random() / count;

				if (data.height > 0)  // no children
				{
					var subcount = data.children.length;

					show(data, x2, y2, length * rate * (data.height / 2 + Math.random() * 0.3 + 0.3), rate, a, subcount);
					data = data.parent;
				}
				else {  // has children

					show(data, x2, y2, length * rate/2, rate/2, a, 0);
					data = data.parent;
				}
			}
		}
		else {
			data = data.parent;
		}
	}

	show(data, x0, y0, length, rate, -Math.PI / 2, data.children.length);

	// pdf and git click event
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
            // Setting the Off Button Position
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
window.onDrawPineTreeReady = function (data,pineCount,kdoc) {
	// Execution of drawing logic
	drawPineTree(data,pineCount,kdoc);
}