function drawBubble(data,bubbleCount,kdoc) {
      let tooltip = d3.select('body')
        .append('div')
        .attr("id", "tip")
        .attr("class", "tooltips");

      var arraycolor = new Array(10);
      for (var i = 0; i < 10; i++) {
        arraycolor[i] = color[i];
      }
      var maxdepth = -1;

      var pdfs = new Map();
      var gits = new Map();
      var pdfchange = 0;
      var gitchange = 0;

      var svg = d3.select("#graph")
        .attr("width", width * 0.85)
        .attr("height", height);

      var pack = d3.pack()
        .size([width, height]);
      var hidata = d3.hierarchy(data, d => d.children)
        .sum(d => d.value);
      var packdata = pack(hidata);
      var nodes = packdata.descendants();
      var gc = svg.selectAll("g")
        .data(nodes)
        .enter()
        .append("g")
        .attr("transform", d => `translate(${d.x},${d.y})`);
     var circles = gc.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", d => d.r)
        .attr("fill", d => {
            if (maxdepth<d.depth){
                maxdepth=d.depth;
            }
            return color[d.depth]
        })
        .attr("opacity", 0.7)
        .style("cursor", "pointer")
        .on("mouseenter", (event, d) => {
          d3.select(this.d)
            .attr("stroke", "#555")
            .attr("stroke-width", 0.5);
          var fullname = d.data.name;
          var point = d;
          while (point.depth >= 0 && point.parent) {
            point = point.parent;
            fullname = point.data.name + '.' + fullname;
          }
          fullname = fullname;
          tooltip.html(fullname)
                 .style("left", event.pageX + "px")
                 .style("top", event.pageY + "px")
                 .style("background-color", "white")
                .style("border-radius", "5px")
                .style("padding", "5px")
                .style("box-shadow", "0px 2px 4px rgba(0, 0, 0, 0.1)");
        })
        .on("mouseleave", (event, d) => {
          d3.select(this.d).attr("stroke", null);
          tooltip.style("visibility", 'false');
        })
        .on("click", (d, i) => {
          var fullname = i.data.name.split('.', 1)[0];
          var point = i;
          while (point.depth >= 0 && point.parent) {
            point = point.parent;
            fullname = point.data.name + '.' + fullname;
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
        .on("contextmenu", (d,i)=> {
            d.preventDefault();
            var pdfinfo = d3.select('#svgbox').append("div")
                        .attr("class", "tooltip")
                        .style("left", (width * 0.2) + "px")
                        .style("top", (height * 0.15) + "px")
            pdfinfo.append("span")
                  .attr("class", "close")
                  .attr("color", "red")
                  .text("x")
                  .on("click", () => {
                         pdfinfo.remove();
                });
            console.log('c',i);
            if (i.height>0){
                traverseTree(i);
            }
            else{
                getpdfgit(i);
            }
            // traverseTree(i);
            function traverseTree(node) {
                node.children.forEach(function(child) {
                console.log('mc',child);
                if (child.height>0){
                    traverseTree(child);
                }
                else{
                    getpdfgit(child);
                }
            })}
            function getpdfgit(i){
                console.log('diaoyong',i);
                if(i.data.linkAll && typeof( i.data.linkAll['pdfClass']) !== "undefined" && Object.keys(i.data.linkAll['pdfClass']).length > 0)
                {
                    for (key in i.data.linkAll['pdfClass']){
                        pdfinfo.append("foreignObject")
                            .attr("height", "12px")
                            .append("xhtml:div")
                            .style("display", "flex")
                            .style("align-items", "center")
                            .style("margin", 0)
                            .style("padding", 0)
                            .html('<img src="http://127.0.0.1:5006/get_svg/pdf.svg" style="width: 8px; height: 15px; margin-right: 5px;"/>')
                            .append('text')
                            .attr("stroke-family", "FangSong")
                            .attr("font-size", "10px")
                            .text(key)
                            .on('click',d =>{pdfgitclick(key);});
//                        pdfinfo.append('br');
                    };
                }
                if(i.data.linkAll && typeof(i.data.linkAll['gitClass']) !== "undefined" && Object.keys(i.data.linkAll['gitClass']).length > 0)
                {
                    for (key in i.data.linkAll['gitClass']){
                        pdfinfo.append("foreignObject")
                            .attr("height", "12px")
                            .append("xhtml:div")
                            .style("display", "flex")
                            .style("align-items", "center")
                            .style("margin", 0)
                            .style("padding", 0)
                            .style("line-height", "1")
                            .html('<img src="http://127.0.0.1:5006/get_svg/github.svg" style="width: 8px; height: 15px; margin-right: 5px;"/>')
                            .append('text')
                            .attr("stroke-family", "FangSong")
                            .attr("font-size", "10px")
                            .text(key)
                            .on('click',d =>{pdfgitclick(key);});
//                        pdfinfo.append('br').style("margin", "0");
                    }
                }
                if (i.data.linkAll && typeof(i.data.linkAll["pdfModule"]) !== "undefined" && i.data.linkAll["pdfModule"].length > 0)
                {
                    pdfinfo.append("foreignObject")
                            .attr("height", "12px")
                            .append("xhtml:div")
                            .style("display", "flex")
                            .style("align-items", "center")
                            .style("margin", 0)
                            .style("padding", 0)
                            .html('<img src="http://127.0.0.1:5006/get_svg/pdf.svg" style="width: 8px; height: 15px; margin-right: 5px;"/>')
                            .append('text')
                            .attr("stroke-family", "FangSong")
                            .attr("font-size", "10px")
                            .text(i.data.name);
//                    pdfinfo.append('br');
                }
            }

        })
        .each(function(d) {
            if(d.data.linkAll && typeof( d.data.linkAll['pdfClass']) !== "undefined" && Object.keys(d.data.linkAll['pdfClass']).length > 0)
            {
                for (key in d.data.linkAll['pdfClass']){
                    pdfs.set(key,d.data.linkAll['pdfClass'][key]);
                }
                console.log('d',d);
            }
            if(d.data.linkAll && typeof( d.data.linkAll['gitClass']) !== "undefined" && Object.keys(d.data.linkAll['gitClass']).length > 0)
            {
                for (key in d.data.linkAll['gitClass']){
                    gits.set(key,d.data.linkAll['gitClass'][key]);
                }
                console.log('e',d);
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
                console.log('pm',fullname);
                pdfs.set(fullname,d.data.linkAll['pdfModule'][0])
            }
        });
    console.log('circle',circles);
    gc.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .style("text-anchor", "middle")
        .style("fill", "black")
        .style('font-size','12px')
        .text(d => {
            if (d.r>25){
                return d.data.name;
            }
            else{
                return '';
            }
        })
        .attr('opacity',d=>{
            if (d.depth == maxdepth){
                return 0.7;
            }
            else{
                return 0;
            }
        });

    var colorrec = svg.selectAll('rect')
         .data(arraycolor.slice(0,maxdepth+1))
        .enter()
        .append("rect")
        .attr("x", width*0.8)
        .attr("y", (d, i) => (i * 16 + height * 0.2))
        .attr("width", 14)
        .attr("height", 14)
        .attr("fill", (d, i) => arraycolor[i])
        .attr('opacity',0.9)
        .style("cursor", "pointer")
        .on('click',function(d,i){
            console.log('111',d,i);
            var currentOpacity = d3.select(this).attr("opacity");
            var selectedIndex = arraycolor.indexOf(i);
            console.log(selectedIndex);
            if(currentOpacity == 0.9){
                d3.select(this)
                    .attr("opacity",0.2);
                d3.selectAll('circle')
                    .filter(function(d){
                        return d.depth == selectedIndex;
                    })
                    .attr('opacity',0);
                d3.selectAll('text')
                    .filter(function(d){
                        return d.depth == selectedIndex;
                    })
                    .attr('opacity',0);
            }
            else{
                d3.select(this)
                    .attr("opacity",0.9);
                d3.selectAll('circle')
                    .filter(function(d){
                        return d.depth == selectedIndex;
                    })
                    .attr('opacity',0.7);
                d3.selectAll('text')
                    .filter(function(d){
                        return d.depth == selectedIndex;
                    })
                    .attr('opacity',0.7);
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
            tableHeader.append("th").text("Variable"); // Table header column 1
            tableHeader.append("th").text("Function"); // Table header column 2

            var tableBody = tableContainer.append("tbody"); // Creating the main part of the form
            var row = tableBody.append("tr"); // Create a line
            row.append("td").attr("class", "contentVar").style("color", "green").html(data['var'].join("<br>")); // first column
            row.append("td").attr("class", "contentFun").style("color", "blue").html(data['fun'].join("<br>")); // second column
            var docContainer = tips.append("div").attr("class", "contentDoc-container");
            var textWithLinks = data['doc'];
            var linkRegex = /(\bhttps?:\/\/\S+\b)/g;// \b matches word boundaries, \s looks for blank characters
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
     bubbleCount.node = nodes.length;
     d3.select("input[id=showPdf1]").on("change", function () {
        console.log('sp',gits);
        if (pdfchange == 0)
			pdfchange = 1;
		else
			pdfchange = 0;
	    if(pdfchange==1){
            var pdfinfo = d3.select('#svgbox').append("div")
                        .attr("class", "tooltip")
                        .attr('id','pdfshow1')
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
                      d3.select("input#showPdf1").property("checked", false);
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
            d3.select('#pdfshow1').remove();
        }
	});
	d3.select("input[id=showGit1]").on("change", function () {
        if (gitchange == 0)
			gitchange = 1;
		else
			gitchange = 0;
	    if(gitchange==1){
            var gitinfo = d3.select('#svgbox').append("div")
                        .attr("class", "tooltip")
                        .attr('id','gitshow1')
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
                      d3.select("input#showGit1").property("checked", false);
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
                    console.log('vk', value, key);
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
            d3.select('#gitshow1').remove();
        }
	});
}

window.onDrawBubbleReady = function(data,bubbleCount,kdoc) {
  // Execute drawing logic
  drawBubble(data,bubbleCount,kdoc);
};
