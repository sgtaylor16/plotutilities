import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";


function burndownPlot(jsonarray,datekey,divname){
    //make sure array is sorted
    jsonarray.sort((a,b)=>a[datekey]-b[datekey]);
    //add total field
    const totalnumber = jsonarray.length;
    for(let i=0;i<totalnumber;i++){
        if(i==0){
            jsonarray[i]['total'] = totalnumber;
    }else{
        jsonarray[i]['total'] = jsonarray[i-1]['total']-1;
    }
    }

    let plot  = Plot.plot({
        marks:[
            Plot.line(jsonarray,{x:datekey,y:'total',curve:'step-after'}),
            Plot.gridY({interval:1})
        ]
    })

    let div = document.getElementById(divname);
    div.append(plot);

    return null

}

export {burndownPlot}