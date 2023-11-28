function drawPineTree(data) {

	var svg = d3.select("#graph")
		.attr("width", width)
		.attr("height", height);


	// 获取具有ID属性的div元素

	var symboltext = ['py','pyi','dll','pic','else']
	var symbolli = svg.selectAll('.symbol')
		.data(symboltext)
		.enter()
		.append("path")
		.attr("transform", function(d,i) {
            return "translate(" +(width*0.705+i*20)+ "," + 40 + ")";
        })
        .attr("d", d3.symbol().type( function(d,i) {
            switch (i) {
                case 0:
                    return d3.symbols[0];
                    break;
                case 1:
                    return d3.symbols[4];
                    break;
                case 2:
                    return d3.symbols[2];
                    break;
                case 3:
                    return d3.symbols[6];
                    break;
                case 4:
                    return d3.symbols[5];
                    break;
        }}))
		.attr("fill", (d, i) => color[i])
		.attr("opacity", 0.7);
	var symbolinfo = svg.selectAll("text")
	    .data(symboltext)
	    .enter()
	    .append('text')
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

	var length = 100;
	var rate = 0.6;
	var x0 = width / 2;
	var y0 = height;
	var id = 0;  //children count
	var angle = Math.PI;
	var labelchange = 1;


	d3.select("input[id=lengthscale]").on("change", function () {
		length = this.value;
		d3.selectAll("line").remove();
		d3.selectAll("text").remove();
		d3.selectAll("circle").remove();
		id = 0;
		show(data, x0, y0, length, rate, -Math.PI / 2, data.children.length);
		d3.selectAll("text")
			.attr("fill", "black");
	});
	d3.select("input[id=anglescale]").on("change", function () {
		angle = this.value;
		d3.selectAll("line").remove();
		d3.selectAll("text").remove();
		d3.selectAll("circle").remove();
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
//	console.log('1',data);
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
            .attr("d", d3.symbol().type( function() {
                console.log(now_data.data.name);
                var endcase = (now_data.data.name).split('.')[1];
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
            .attr("opacity",d => count > 0 ? 0 : 0.5)
            .attr("stroke", "lightgray")
            .attr("fill", (d,i)=>color[data.depth])
			.attr("cursor", "pointer")
			.on("mouseover", function(){
			    console.log('over',now_data);
                d3.select(this)
                    .attr("opacity",1);
                var fullname = now_data.data.name;
                var point = now_data;
                while (point.depth >= 0 && point.parent) {
                    point = point.parent;
                    fullname = point.data.name + '.' + fullname;
                }

                if (point.data.name == "nn")
                    fullname = "torch." + fullname;
                else
                    fullname = fullname;

                var [x, y] = d3.pointer(event);
                var text = d3.select('#svgbox').append("tooltip")
                            .html(fullname)
                            .style("left", (width*0.2) + "px")
                            .style("top", (height*0.2) + "px")
                            .style("position", "absolute");
            })
           .on("mouseout", function(d) {
                d3.select(this)
                  .attr("opacity", 0.5);
                d3.select('#svgbox').selectAll("tooltip").remove();
              })
			.on("click", (d) => {
                console.log('1',d, now_data);
                var fullname = now_data.data.name.split('.', 1)[0];
                var point = now_data;
                while (point.depth >= 0 && point.parent) {
                    point = point.parent;
                    fullname = point.data.name + '.' + fullname;
                }

                if (point.data.name == "nn")
                    fullname = "torch." + fullname;
                else
                    fullname = fullname;

                console.log('2',d, data, fullname);
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

                            console.log(data);
                        })
                .catch(error => {
                    console.error('Error executing Python script:', error);
                });
            });

		svg.append("text")
			.attr("x", x2 + 20)
			.attr("y", y2 + 20)
			.attr("id", "text" + id)
			.attr("stroke-family", "仿宋")
			.attr("font-size", "20px")
			.attr("font-weight", "bold")
			.attr("fill", color[data.depth])
			.attr("opacity", d => count > 0 ? 1 : 0)
			.text(d => (count > -1) && ((id % 43 == 1)) ? data.data.name + "-" + id : "");

		if (count > 0) {
			for (var i = 0; i < count; i++) {
				data = data.children[i];
				var a = Math.PI * i / (count) - Math.PI + Math.PI * Math.random() / count;

				if (data.height > 0)    //no children
				{
					var subcount = data.children.length;
					rate = 0.6;
					show(data, x2, y2, length * rate * (data.height / 2 + Math.random() * 0.3 + 0.3), rate, a, subcount);
					data = data.parent;
				}
				else {        //has children
					//console.log(count,i,data,data.data.name);
					rate = 0.3;
					show(data, x2, y2, length * rate, rate, a, 0);
					data = data.parent;
				}

			}
		}
		else {
			data = data.parent;
		}
	}

	show(data, x0, y0, length, rate, -Math.PI / 2, data.children.length);

}
window.onDrawPineTreeReady = function (data) {
	// 执行绘图逻辑
	drawPineTree(data);
}