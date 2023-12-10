function drawTreeMap(data, flag, pdf, mapCount, allRootsArrayLength,kdoc) {

    var width  = (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) * 0.83;
    var height = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) * 0.98;
    var color = d3.scaleOrdinal(d3.schemeCategory10);

    var pdfs = new Map();
    var gits = new Map();
    var pdfchange = 0;
    var gitchange = 0;

    var svg = d3.select("#graph")
        .attr("width", width)
        .attr("height", height);

    var treemap = d3.treemap()
        .size([width, height]);

    var hidata = d3.hierarchy(data)
        .sum(d => Math.sqrt(Math.sqrt(d.value)))
        .sort((a, b) => b.value - a.value);
    var treedata = treemap(hidata);

    nodes = treedata.leaves();

    mapCount.node = nodes.length;

    var gc = svg.selectAll("g")
        .data(nodes)
        .enter()
        .append("g")
        .attr("id", function (d, i) {
            return i;
        })
        .attr("margin", "10px")
    var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    var rect1 = gc.append("rect")
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("fill", function (d) {
            while (d.depth > 1) {
                if (flag) {
                    d = d.parent;
                }
                else {
                    break;
                }
            }
            return color(d.data.name)
        })
        .attr("transform", function (d) { return "translate(" + d.x0 + "," + d.y0 + ")"; })
        .attr("opacity", 0.6)
        .attr("stroke", "white")
        .attr("cursor", "pointer")
        .on("mouseover", function (event, d) {
            d3.select(this)
                .attr("opacity", 1.0)  // Rectangle transparency is 1 on mouse hover

            // Select the appropriate text element and add a transition animation
            d3.select(this.parentNode).select(".txt").raise()
                .transition()
                .duration(300) // transition time
                .attr("font-size", "16") // Changed font size
                .text(d => (d.data.name + "-" + d.data.value));
        })
        .on("mouseout", function (event, d) {
            d3.select(this)
                .attr("opacity", 0.6) // Transparency of the rectangle is 0.7 when the mouse is off.

            // Select the appropriate text element and add a transition animation
            d3.select(this.parentNode).select(".txt")
                .transition()
                .duration(300) // transition time
                .attr("font-size", "12") // Restore original font size
                .text(d => (d.data.name))
        })
        .on("click", (d, i) => {
            var fullname = i.data.name.split('.', 1)[0];
            var point = i;
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
        });

    var currentLayer = 0;
    // 遍历树状图，设置层级
    function setLayer(node) {
        // 如果是根节点，增加层级并赋值给节点的 layer 属性
        if (node.depth === 1) {
            currentLayer++;
            node.data.layer = currentLayer;
        }
        node.data.layer = currentLayer;
        // 将当前层级传递给子节点
        if (node.children) {
            node.children.forEach(child => {
                setLayer(child);
            });
        }
    }
    // 设置树状图节点的层级
    setLayer(treedata);

    var layer = 1;
    rect1.each(function(d) {
        console.log(d.data.name,d.data.layer)
        d.flag = 0;
        if(d.depth > 1){
            d.flag = 2;
            d = d.parent;
            if (d.depth == 1 ){
                d.flag = layer;
            }
            layer = layer + 1;
        }
        else{
            d.flag = layer;
        }
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
                         if(!(point.data.name=='package'&&point.depth==0)){//delete the first layer"package." pylibstree
                        fullname = point.data.name + '.' + fullname;
                        }
                    }
                    pdfs.set(fullname,d.data.linkAll['pdfModule'][0])
                }
    });

    d3.select("input[id=length]").on("change", function () { // Modify width and height to scale a rectangular block.
		var newScale = +this.value; // Get the value of the input box and convert it to a number
        var width1 = width * newScale * 0.01;
        var height1 = height * newScale * 0.01;
        svg.attr("width", width1)
            .attr("height", height1);
        // Update the width and height of the rectangular block

        rect1.attr("transform", function (d) { return "translate(" + d.x0 * newScale * 0.01 + "," + d.y0 * newScale * 0.01 + ")"; })
        rect1.attr("width", d => (d.x1 - d.x0) * newScale * 0.01)
            .attr("height", d => (d.y1 - d.y0) * newScale * 0.01)
        text.attr("x", d => (d.x1 - d.x0) / 2 * newScale * 0.01)
            .attr("y", d => (d.y1 - d.y0) / 2 * newScale * 0.01)
            .attr("transform", function (d) { return "translate(" + d.x0 * newScale * 0.01 + "," + d.y0 * newScale * 0.01 + ")"; })
    });

    d3.select("input[id=layer]").on("change", function () {
        var newScale = +this.value;
        rect1.each(function (d) {
            if (d.data.layer == newScale) {
                d3.select(this)
                .transition()
                .duration(300)
                .attr("opacity", 1.0);
            }
            else{
                d3.select(this)
                .transition()
                .duration(300)
                .attr("opacity", 0.1);
            }
        });
    });

    d3.select("input[id=showPdf4]").on("change", function () {
        if (pdfchange == 0)
			pdfchange = 1;
		else
			pdfchange = 0;
	    if(pdfchange==1){
            var pdfinfo = d3.select('#svgbox').append("div")
                        .attr("class", "tooltip")
                        .attr('id','pdfshow4')
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
                      d3.select("input#showPdf4").property("checked", false);
                      pdfchange = 0;
                    });
            if (pdfs.size == 0){
                pdfinfo.append('text')
                    .attr("stroke-family", "FangSong")
                    .attr("font-size", "10px")
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
            d3.select('#pdfshow4').remove();
        }
    });
    d3.select("input[id=showGit4]").on("change", function () {
        console.log('sp',gits);
        if (gitchange == 0)
			gitchange = 1;
		else
			gitchange = 0;
	    if(gitchange==1){
            var gitinfo = d3.select('#svgbox').append("div")
                        .attr("class", "tooltip")
                        .attr('id','gitshow4')
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
                      d3.select("input#showGit4").property("checked", false);
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
            d3.select('#gitshow4').remove();
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
            // Setting the Off Button Position
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

    var text = gc.append("text")
        .attr("font-size", "12")
        .attr("text-anchor", "middle")
        .attr("x", d => (d.x1 - d.x0) / 2)
        .attr("y", d => (d.y1 - d.y0) / 2)
        .attr("transform", function (d) { return "translate(" + d.x0 + "," + d.y0 + ")"; })
        .attr("class", "txt")
        .attr("fill", "white")
        .text(d => (d.data.name));

    var allRoots = new Set();
    // 遍历树状图，找到所有根节点
    function findAllRoots(node) {
        if (node.depth === 1) {
            // 当前节点是根节点
            allRoots.add(node.data.name);
        } else if (node.parent) {
            // 继续遍历父节点
            findAllRoots(node.parent);
        }
    }
    // 遍历树状图，找到所有根节点
    rect1.each(findAllRoots);
    // 将 Set 转为数组，方便后续使用
    var allRootsArray = Array.from(allRoots);
    var allRootsLength = allRootsArray.length;
    allRootsArrayLength = allRootsLength;
    // 打印所有根节点
    console.log("所有根节点:", allRootsArray);

}


window.onDrawTreeMapReady = function (data, flag, pdf, mapCount, allRootsArrayLength,kdoc) {
    // Execution of drawing logic
    drawTreeMap(data, flag, pdf, mapCount, allRootsArrayLength,kdoc);
}