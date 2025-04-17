import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import {tricontour} from "https://cdn.skypack.dev/d3-tricontour@1";


function linspace(start,stop,num){
    const step = (stop-start)/(num-1);
    return Array.from({length:num},(d,i) => start + i*step);
}


function unstructured(data,valuerange,svgtag,levels=8){
    //

    const svg = d3.select(svgtag);
    const margin = {top:10,right:10,bottom:10,left:10};
    const svg_width = +svg.attr('width');
    const svg_height = +svg.attr('height');

    const xscale = d3.scaleLinear().domain(d3.extent(data,d => d[0])).range([margin.left,svg_width - margin.right]);
    const yscale = d3.scaleLinear().domain(d3.extent(data,d => d[1])).range([svg_height - margin.bottom,margin.top]);

    const levels = linspace(valuerange[0],valuerange[1],levels);

    contours = tricontour().thresholds(levels)(data);

    path = d3.geoPath()

    svg.selectAll("path")
    .data(contours)
    .join("path")
    .attr("d",path)
    .attr("stroke","black")

}

