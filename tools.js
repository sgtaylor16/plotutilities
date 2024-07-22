import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";


function burndownPlot(jsonarray,datekey,divname){

    function isDate(value) {
        return value instanceof Date || Object.prototype.toString.call(value) === '[object Date]';
      }

    function convertToDate(value){
        if(value == null){
            return null
        }else if(isDate(value)){
            return value
        }else{
            return new Date(value)
        }
    }

    jsonarray.map( d => (convertToDate(d[datekey])))
        
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

}

//function to make a quick timeline


function plotgannt(ganntarray,projarray,divid,startDate,endDate){

    function filterschedule(ganntarray,projarray){
        //projarray is the array of tasks from MS Project.
        //ganntarray is a list of objects with the following format:
        // {"title":str,'ids':[int],"order":int}
        // the order is the order in which the tasks should be displayed.
        let subset = projarray.filter(d => (ganntarray.includes(d['Unique_ID'] ? true: false)));
        return subset
    }

    function calcMaxMin(ganntarray,projarray){
        //projarray is the array of tasks from MS Project.
        //ganntarray is a list of objects with the following format:
        // {"title":str,'ids':[int],"order":int}
        // the order is the order in which the tasks should be displayed.
        ganntarray.forEach(d => {   
            let filteredArray = filterschedule(d['ids'],projarray);
            d['minDate'] = d3.min(filteredArray,d => d['Start_Date']);
            d['maxDate'] = d3.max(filteredArray,d => d['Finish_Date']);
        })
        return null;
    }
    
    calcMaxMin(ganntarray,projarray);

    const bars = ganntarray.filter(d.minDate.getTime() != d.maxDate.getTime());
    const milestones = ganntarray.filter(d.minDate.getTime() == d.maxDate.getTime());

    //Create the Schedule
    //Derived from https://observablehq.com/@observablehq/build-your-own-gantt-chart

    const yDomain = ganntarray.sort((a) => d3.ascending(a.order)).map(d => d.title);

    const schedplot = Plot.plot({
        height:400,
        width:800,
        marks:[
            Plot.barX(bars,{
                y:'title',
                x1:"minDate",
                x2:"maxDate",
                fill:"steelblue"
            }),
            Plot.dot(milestones,{
                y:'title',
                x:'minDate',
                r:10
            }),
            Plot.text(ganntarray,{
                y:'title',
                x:'minDate',
                text:"title",
                textAnchor:"start",
                fontSize:12,
                stroke:"white",
                fill:"dimgray",
                fontWeight:500
            })
        ],
        x:{
            grid:true,
            domain:[startDate,endDate],
            tickFormat:null,
            tickSize:null
        },
        y:{
            domain:yDomain,
            label:null,
            tickFormat:null,
            tickSize:null
        }  
    });

    const scheddiv = document.getElementById(divid);
    scheddiv.append(schedplot);

};



export {burndownPlot,plotgannt};