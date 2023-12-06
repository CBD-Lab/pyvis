function showFile(keyworddoc)
{
    var keyword = {
    classname: keyworddoc.classname,
    moduledir: keyworddoc.moduledir
    };
    var keywordJson = JSON.stringify(keyword);
    axios.get("http://127.0.0.1:5006/codeDoc?wanted=" + keywordJson).then(res=>{
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
                            // Calculate the mouse offset re lative to the upper-left corner of the cue box
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
								  .html('<pre><code class="language-python">' + res.data.code + '</code></pre>');

                })
}