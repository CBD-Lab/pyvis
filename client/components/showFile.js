function showFile(keyworddoc)
{
    var keyword = {
    classname: keyworddoc.classname,
    moduledir: keyworddoc.moduledir
    };
    var keywordJson = JSON.stringify(keyword);
    axios.get(pathUrl+"/codeDoc?wanted=" + keywordJson).then(res=>{
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

                          const language = 'python';
                          const highlightedCode = Prism.highlight(res.data.code, Prism.languages[language], language);
                          var docContent='<pre><code class="language-python">' + res.data.doc + '</code></pre>';
                          var codeContent='<pre><code class="language-python">' + highlightedCode + '</code></pre>';

                          tips.append("span")
                              .attr("class", "close")
                              .attr("color", "red")
                              .style("width", "30px")
                              .style("height", "30px")
                              .style("cursor","pointer")
                              .style("background-color", "#FFDF76")
                              .style("position", "fixed")
                              .style("text-align", "center")
                              .html("&#10006;")
                              .on("click", () => {
                                  tips.remove();
                              });
                          tips.append("button")
                              .attr("class","change");
                          var changeButton = tips.select(".change");
                          changeButton.style("width","80px")
                                      .style("height","30px")
                                      .style("background-color","#3572A5")
                                      .style("color","white")
                                      .style("right", "10px")
                                      .style("position", "fixed")
                                      .style("cursor","pointer")
                                      .style("z-index", "9999")
                            changeButton.text("Code")
                          changeButton.on("click", function() {
                              var currentContent = tips.select(".content").html();
                              if(currentContent === docContent)
                              {
                                changeButton.text("Doc")
                              }
                              else
                                changeButton.text("Code")
                              var newContent = (currentContent === docContent) ? codeContent : docContent;
                              tips.select(".content").html(newContent);
                            });
                          tips.append("div")
                              .attr("class", "content")
                              .style("margin-top","30px")
                              .html('<pre><code class="language-python">' + res.data.doc + '</code></pre>');

            })
}