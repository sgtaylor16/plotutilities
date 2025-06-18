import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import {tricontour} from "https://cdn.skypack.dev/d3-tricontour@1";


function burndownPlot(jsonarray,datekey,divname){

    const totalnumber = jsonarray.length;

    function isDateLike(str) {
        // Regular expression to match common date formats
        const datePattern = /^(?:\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4})$/;
        // Test the string against the regex pattern
        return datePattern.test(str);
    }

    function convertToDate(obj){
        obj[datekey] = new Date(obj[datekey]);
        return obj;
    }

    jsonarray = jsonarray.filter(d => isDateLike(d[datekey]));
    jsonarray = jsonarray.map(d => convertToDate(d));

    jsonarray.sort((a,b) => {
        return a[datekey] - b[datekey];
    })

    //add total field

    for(let i=0;i<jsonarray.length;i++){
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

function plotschedule(ganntarray,startDate,endDate,divid){
    //gantarray is a list of object with the following values:
    // {"title":str,"minDate":date,"maxDate":date,"order":int}
    // startDate and endDate are the start and end dates of the project as javascript dates
    // divid is the id of the div where the plot will be placed

        //Create the Schedule
    //Derived from https://observablehq.com/@observablehq/build-your-own-gantt-chart

    for(let i=0;i<ganntarray.length;i++){
        ganntarray[i]['minDate'] = new Date(ganntarray[i]['startDate']);
        ganntarray[i]['maxDate'] = new Date(ganntarray[i]['endDate']);
    }

    const bars = ganntarray.filter(d =>d.minDate.getTime() != d.maxDate.getTime());
    const milestones = ganntarray.filter(d => d.minDate.getTime() == d.maxDate.getTime());

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

}

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

    //Create the Schedule
    plotschedule(filteredArray,startDate,endDate,divid);

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

function barwalk(jsonarray){
    //jsonarray is an array of objects with the following format:
    // {"name":str,"value":float,"startvalue":bool}
    let newarray = [];
    let startob = jsonarray.filter(d => d['startvalue'] == true);
    let deltaob = jsonarray.filter( d => d['startvalue'] == false);
    if(startob.length != 1){
        throw new Error('There should be exactly one start value');
    }
    newarray.push({'name':startob[0].name, 'bottom':0.0, 'top':startob[0].value,'end':startob[0].value,'value':startob[0].value});

    for(let i=0;i<deltaob.length;i++){
        if(deltaob[i].value < 0){
            newarray.push({'name':deltaob[i].name, 'bottom':newarray[i]['end'] + deltaob[i].value, 'top':newarray[i]['end'],'end':newarray[i]['end'] + deltaob[i].value,'value':deltaob[i].value});
        }else if(deltaob[i].value > 0){
            newarray.push({'name':deltaob[i].name, 'bottom':newarray[i]['end'], 'top':newarray[i]['end'] + deltaob[i].value,'end':newarray[i]['end'] + deltaob[i].value,'value':deltaob[i].value});
        }else{
            throw new Error('The value should not be zero');
        }    
    }

    return newarray;
}

function plotwalk(jsonarray,divid){
    //function to plot a bar chart walk

    let domainarray = [];
    jsonarray.forEach(d =>{domainarray.push(d['name'])});

    let positivearray = jsonarray.filter(d => d['value'] >= 0);
    let negativearray = jsonarray.filter(d => d['value'] < 0);

    const walkplot = Plot.plot({
        height:400,
        width:800,
        marginLeft:100,
        x:{
            domain:domainarray
        },
        marks:[
            Plot.ruleY([0]),
            Plot.barY(positivearray,{
                x:'name',
                y1:'bottom',
                y2:'top',
                fill:"lightblue"
            }),
            Plot.barY(negativearray,{
                x:'name',
                y1:'top',
                y2:'bottom',
                fill:"lightcoral"})
        ] 
    })
    const walkdiv = document.getElementById(divid);
    walkdiv.append(walkplot);
}

function obToArr(obarray,keylist){
    //obarray is an array of objects
    //keylist is a list of keys
    //returns an array of arrays
    let newarray = [];
    for(let i=0;i<obarray.length;i++){
        let temparray = [];
        for(let j=0;j<keylist.length;j++){
            temparray.push(obarray[i][keylist[j]]);
        }
        newarray.push(temparray);
    }
    return newarray;
}

function unstructuredPlot(data,valuerange,svgtag,thresholds=10){
    ///data is an array of arrays. The the first column should be x, second column shouold be y, and the third column the value you wish to plot on mesh.
    ///valuerange is a two element array with the min and max values you wish on the color scale.
    ///svgtag is the id of the svg tag where the plot will be placed
    ///thresholds is the number of levels you wish to plot. Default is 10.

    const svg = d3.select(svgtag);
    const margin = {left:10,right:10,top:10,bottom:10};
    const svg_height = svg.attr('height')
    const svg_width = svg.attr('width')

    let xscale = d3.scaleLinear().domain(d3.extent(data,d => d[0])).range([margin.left,svg_width - margin.right]);
    let yscale = d3.scaleLinear().domain(d3.extent(data,d => d[1])).range([svg_height-margin.top,margin.bottom])
    let cscale = d3.scaleSequential(d3.interpolateTurbo).domain(valuerange)

    let toScreen = ({type,value,coordinates}) => {  //Feeds a single Countour object
        return {type,value,coordinates: coordinates.map(rings =>{ //Feeds a single ring (there may be more than one)
            return rings.map(points => {
                return points.map(([x,y]) => ([
                    xscale(x),yscale(y)
                ]))
            })
        })}
    }

    levels = linspace(valuerange[0],valuerange[1],thresholds)

    let contours = d3.tricontour().thresholds(levels)(data).map(toScreen)

    const path = d3.geoPath()

    svg.selectAll("path")
    .data(contours)
    .join("path")
    .attr("d",path)
    .attr("fill",d => cscale(d.value))
    .attr("stroke",'black')
}

function groupUnstack(data,key1,key2,reducer){
    //Function to take tidy data and group it by a key, then unstack it using D3
    console.log(reducer)

    let groupedData = d3.rollup(data,reducer,(d) => d[key1],(d) => d[key2]);

    let uniqueKey1 = Array.from(new Set(data.map(d => d[key1]))).sort((a,b) => a-b);
    let uniqueKey2 = Array.from(new Set(data.map(d => d[key2]))).sort((a,b) => a-b);

    let outArray = [];
    uniqueKey1.forEach(k1 => {
        uniqueKey2.forEach(k2 => {
            try{
                let summedValue = groupedData.get(k1).get(k2);
                outArray.push({key1:k1, key2:k2,value:summedValue});
            }
            catch (e){
                //pass (do nothing)
            }
        })
    })
    return outArray;
}
export {burndownPlot,plotgannt,plotwalk,barwalk,plotschedule,obToArr,unstructuredPlot,groupUnstack};