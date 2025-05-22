import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";



function sched_access({Index,Name,Start,Finish,Account,complete}){
    //Function to convert string values from json into the proper type for D3
    return ({Index:Index, Name:Name , Start: new Date(Start) , Finish:new Date(Finish) , Account: Account,complete: complete});
}

function checkforMilestones(object){
    if(object.Account == 'Milestones'){
        return true;
    }else{
        return false;
    }
}

function checkforZeroDuration(object){
    if(object.Start.toDateString() == object.Finish.toDateString()){
        return true;
    }else{
        return false;
    }
}

function checkforTasks(object){
    ///If the start date is not equal to the end date assume return True
    if(object.Start.toDateString() != object.Finish.toDateString()){
        return true;
    }else{
        return false;
    }
}

function findAccounts(object){
    /* Find the unique values in an array of objects for the Account member
    Returns a list of the unique accounts */
    let flags = [], l = object.length, i,uniqueAccounts = [];

    for(i=0; i<l; i++){
        if( flags[object[i].Account]){
            continue;
        }else{
        flags[object[i].Account] = true;
        uniqueAccounts.push(object[i].Account);
        }
    }
    return uniqueAccounts
}

function filterOnOneAccount(Account,task){

    if(Account == task.Account){
        return true
    }else{
        return false
    }

}

function accountsFilter(data,AccountFilter){

    let outputarray = [];

    AccountFilter.forEach((Account) => {
        let temp = data.filter((task) => {
            return filterOnOneAccount(Account,task);
        })
        outputarray = outputarray.concat(temp);
    })
    return outputarray;
}

function putAccounts(svgid,dataarray,yaxis,schedStart,schedEnd){

    let svg = d3.select("svg" + svgid) //Select the svg element that all plotting will happen on.

    //Find the tasks with zero duration, they will be marked as diamond milestones
    let zerodur = dataarray.filter(checkforZeroDuration);

    //Find the tasks with > 0 duration, they will be marked as bars.
    let tasks = dataarray.filter(checkforTasks);

    //find the unique control accounts
    uniqueCAs = findAccounts(dataarray);

    //Get the height of the svg element

    let height = document.getElementById(svgid.slice(1)).getAttribute("height");
    let width = document.getElementById(svgid.slice(1)).getAttribute("width");
    let margin = 100;
    let topProtection = 50;
    let axisheight = 70;
    let barheight = 30;
    let fontsize = 14;
    var labelfontsize = 14;

    newheight = uniqueCAs.length * (barheight + 10) + axisheight + topProtection;
    document.getElementById(svgid.slice(1)).setAttribute("height",newheight);

//#region Scales

    let schedScale = d3.scaleTime()
                    .domain([schedStart,schedEnd])
                    .range([margin,width - margin]);

    let timeAxis = d3.axisBottom()
                    .scale(schedScale)
                    .tickFormat(d3.timeFormat("%b %Y"))
                    .ticks(d3.timeMonth.every(1));

    let rectHeight = d3.scaleBand()
                    .domain(uniqueCAs)
                    .range([topProtection, newheight - axisheight]);

    let colorScale = d3.scaleOrdinal()
                        .domain(uniqueCAs)
                        .range(d3.schemePastel1);

    function colorScale2(basefunc,CA,test){
        console.log(typeof(test))
        if(test){
            return "lightgrey"
        }else{
            // console.log("In HEre")
            return basefunc(CA)
        }
    }

    var accountAxis = d3.axisLeft()
                    .scale(rectHeight)
                    .ticks(uniqueCAs)

//#endregion Scales

//#region Milestone Circles

    //Put in the Milestone Circles

    svg.selectAll("circle")
        .data(zerodur)
        .join("circle")
        .attr("cx",function(d,_i){
            return schedScale(d.Start);
        })
        .attr("cy",function(d,_i){
        return (rectHeight(d.Account) + barheight * 0.5)
        })
        .attr("r",5)
        .on("mouseover",function(d,_i){
            let tempselection = d3.select(this);
            //let xloc = (schedScale(d.Finish) + 5).toString();
            //let yloc = (rectHeight(d.Account) + 0.5 * barheight + 0.4 * fontsize).toString();
            let xloc = "40";
            let yloc = "10";
            let yloc2 = "25";
            let mytext = "Start = " + d.Start;
            let mytext2 = "Finish = " + d.Finish;
    
            svg.append("text")
                .attr("x",xloc)
                .attr("y",yloc)
                .attr("font-size",labelfontsize)
                .text(mytext)
                .attr("class","NameLabel")
            
            svg.append("text")
                .attr("x",xloc)
                .attr("y",yloc2)
                .attr("font-size",labelfontsize)
                .text(mytext2)
                .attr("class","NameLabel2")
        })
        .on("mouseout",function(_d,_i){
            d3.select("text.NameLabel").remove()
            d3.select("text.NameLabel2").remove()
        });

    svg.selectAll("text")
    .data(zerodur)
    .join("text")
    .text(function(d,_i){
        return d.Name
    })
    .attr("x",function(d,_i){
        return schedScale(d.Start) + 10;
    })
    .attr("y",function(d,_i){
        return (rectHeight(d.Account) + barheight * 0.5);
    })
    .attr("transform",function(d,_i){
        let cx = schedScale(d.Start);
        let cy = rectHeight(d.Account) + barheight * 0.5;
        return ('rotate(-25,'+ cx + ',' + cy + ')')
    })
    .style("text-anchor", "start")
    .attr("font-size",fontsize)



//#endregion

//#region Put in Rectangles

    svg.selectAll("rect")
        .data(tasks)
        .join("rect")
        .attr("x",function(d,_i){
            return schedScale(d.Start);
        })
        .attr("y",function(d,_i){
            return rectHeight(d.Account)
        })
        .attr("rx",barheight/4)
        .attr("width",function(d,_i){
            return schedScale(d.Finish) - schedScale(d.Start);
        })
        .attr("height",barheight)
        .attr("fill",function(d,_i){
            //return colorScale(d.Account);
            return colorScale2(colorScale,d.Account,d.complete)
        })
        .attr("fill-opacity",0.7)
        .on("mouseover",function(d,_i){
            let tempselection = d3.select(this);
            //let xloc = (schedScale(d.Finish) + 5).toString();
            //let yloc = (rectHeight(d.Account) + 0.5 * barheight + 0.4 * fontsize).toString();
            let xloc = "40";
            let yloc = "10";
            let yloc2 = "25";
            let mytext = "Start = " + d.Start;
            let mytext2 = "Finish = " + d.Finish;

            svg.append("text")
                .attr("x",xloc)
                .attr("y",yloc)
                .attr("font-size",labelfontsize)
                .text(mytext)
                .attr("class","NameLabel")
            
            svg.append("text")
                .attr("x",xloc)
                .attr("y",yloc2)
                .attr("font-size",labelfontsize)
                .text(mytext2)
                .attr("class","NameLabel2")
        })
        .on("mouseout",function(_d,_i){
            d3.select("text.NameLabel").remove()
            d3.select("text.NameLabel2").remove()
        })

     svg.selectAll("text.tasks")
        .data(tasks)
        .join("text")
        .attr("class","tasks")
        .text(function(d,_i){
            return d.Name
        })
        .attr("x",function(d,_i){
            return (schedScale(d.Start)+5)
        })
        .attr("y",function(d,_i){
            return (rectHeight(d.Account) + 0.5 * barheight + 0.4 * fontsize)
        })
        .attr("font-size",fontsize)
        .attr("transform",function(d,_i){
            let duration= schedScale(d.Finish) - schedScale(d.Start);
            let cx = schedScale(d.Start);
            let cy = rectHeight(d.Account) + barheight * 0.5;
            if(duration< 95){
                return ('rotate(-15,'+ cx + ',' + cy + ')')
            }else{
                return ('rotate(0,0,0)')
            }
        });

//#endregion

//#region Put in date Axis

    let temp1 = newheight - axisheight;

    svg.append("g").call(timeAxis).attr("class","axis")
                    .attr("transform","translate(0," + temp1 + ")" )
                    .selectAll("text")
                    .attr("transform", "translate(-10,10)rotate(-45)")
                    .style("text-anchor", "end");

//#endregion

//#region labels on y axis
    if(yaxis){
    svg.append("g").call(accountAxis)
                    .attr("transform","translate(" + margin + ",0)")
    }
//#endregion
}

function makeIMP2(data,svgid,CAfilter,yaxis = false,schedstart,schedend){
    /*Creates a schedule on the webpage with the svgid
    data - json object that contains the data
    svgid - id of the svg element
    CAfilter
    yaxis
     */

    //d3 read in file

    data = data.map(sched_access)


    //filter only on the accounts that are in CAfilter

    mytasks = accountsFilter(data,CAfilter);
    putAccounts(svgid,mytasks,yaxis,schedstart,schedend)
    }


export {makeIMP2,sched_access,putAccounts};