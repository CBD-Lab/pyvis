function drawBitree(data) {

	var svg = d3.select("#graph")
		.attr("width", width)
		.attr("height", height);
	// 获取具有ID属性的div元素
	var colorrec = svg.selectAll('rect')
		.data(color)
		.enter()
		.append("rect")
		.attr("x", (d, i) => (i * 16 + width * 0.55))
		.attr("y", 30)
		.attr("width", 14)
		.attr("height", 14)
		.attr("fill", (d, i) => color[i])
		.attr("opacity", 0.7);

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
	function show(data, x0, y0, length, rate, a, count) {

		id++;
		var x1 = x0;
		var y1 = y0;
		var x2 = x1 + length * Math.cos(a);
		var y2 = y1 + length * Math.sin(a);
		svg.append("line")
			.attr("x1", x1)
			.attr("y1", y1)
			.attr("x2", x2)
			.attr("y2", y2)
			.attr("id", "line" + id)
			.attr("stroke", color[data.depth])
			.attr("stroke-width", data.height * 2 + 1)
			.attr("opacity", 0.7);

		svg.append("circle")
			.attr("cx", x2)
			.attr("cy", y2)
			.attr("r", d => count > 0 ? 0 : (Math.log(data.data.value + 1) / 2 + 1))
			.attr("fill", color[data.depth])
			.attr("stroke", "white")
			.attr("opacity", 0.7);

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
window.onDrawBitreeReady = function (data) {
	// 执行绘图逻辑
	drawBitree(data);
}