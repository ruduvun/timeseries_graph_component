/**
 * @fileoverview Library for loading values and creating time series graph
 * @author Radovan Kavka
 */

import TimeSeriesGraph from "./timeseries_graph.js";

let signals = new Array();
let graph = null;
let signal_index = 0;
let color_strings = [
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00"
];


function dynamicallyLoadScript(url) {
    var script = document.createElement("script");  // create a script DOM node
    script.src = url;  // set its src to the provided URL
   
    document.head.appendChild(script);  // add it to the end of the head section of the page (could change 'head' to 'body' to add it to the end of the body section instead)
}

function dynamicallyLoadStyle(url) {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/html";
    link.href = url;
    document.head.appendChild(link);
}

/**
 * Async function that extracts 8-bit signed integers from file
 * @param {File} file 
 * @returns Object of various parameters with 8-bit signed integer array
 */
function readFileAsync(file) {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
  
      reader.onload = () => {
        
        var bytes = new Int8Array(reader.result);
        let obj = {name: file.name, data: bytes, color: color_strings[signal_index], num: signal_index + 1, line_width: 0.5, show: 1};
        signal_index++;
        resolve(obj);
      };
  
      reader.onerror = () => {
          alert("Nastala chyba při čtení souboru.");
          reject
      };
  
      reader.readAsArrayBuffer(file);
    })
  }

/**
 * Takes all binary files and sends them into readFileAsync. After async operation, the data is sent into 'load_success' function
 */
function load_timeseries_binary()
{
    
    var signalInputs = document.querySelector("#timeseries_binary_files");
    // nebyly zadany soubory pro data signalu
    if(signalInputs.files.length == 0) {
        console.log('Nebyly zadany zadne signaly');
        alert("Nebyly zadany zadne signaly");
        return;
    }
    let files = [...signalInputs.files];
    let promises = files.map(x => readFileAsync(x));

    var signal_arr = [];
    
    // pokud se splni vsechny asynchronni funkce
    Promise.all(promises).then((values) => {

        console.log(values);
        for(let x of values)
        {
            console.log(x.data.byteLength);
            console.log(x);
        }
        load_success(values);
        init_graph();
    });
}

/**
 * Writes info about each signal and inserts signals into 'signals' array
 * @param {Signal} sigs signal object array
 */
function load_success(sigs)
{
    var div = document.getElementById("timeseries_binary_datalist");
    while (div.firstChild) div.removeChild(div.firstChild);
    var h4 = document.createElement("h4");
    h4.classList.add("mt-4");
    h4.innerText = "Seznam načtených signálů";

    var ol = document.createElement("ol");
    for(let x of sigs)
    {
        var li = document.createElement("li");
        li.innerText = x.name + " - " + x.data.byteLength + " bajtů, první hodnota:" + x.data[0];
        ol.appendChild(li);
        signals.push(x);
    }
    div.appendChild(h4);
    div.appendChild(ol);
}

function init_graph()
{
    console.log(signals);
    let cont = document.getElementById("test_container");
    if(signals.length == 0){
        alert("Nebyly načteny žádné signály k vykreslení!");
        return;
    }
    if(graph != null)   graph.destroy(); 
    graph = new TimeSeriesGraph(cont, signals);
    window.addEventListener('resize', function(){
        graph.change_size(cont.offsetWidth, (cont.offsetWidth * 9 / 16));
    });

}

function init_load() {
    console.log("Init load");
    signals = [];
    signal_index = 0;
    load_timeseries_binary();
}

export function init_timeseries_binary(container_name) {

    let cont = document.getElementById(container_name);
    if(cont == null)
        alert("Cannot initialize TimeSeries inside non-existing container");

    else {
        cont.classList.add("timeseries_font");

        let input = document.createElement("input");
        input.multiple = true;
        input.type = "file";
        input.id = "timeseries_binary_files";
        input.classList = ["timeseries-load-button"];
        input.oninput = init_load;
        let label = document.createElement("label");
        label.innerText = "Nahrát soubory";
        label.appendChild(input);
        
        label.classList = ["timeseries-custom-file-upload"];
        let br = document.createElement("br");
        let loadBut = document.createElement("button");
        loadBut.onclick = load_timeseries_binary;
        loadBut.innerText = "Načíst soubory";
        loadBut.classList = ["timeseries-load-button"];
        let initBut = document.createElement("button");
        initBut.onclick = init_graph;
        initBut.innerText = "Vykreslit graf";
        initBut.classList = ["timeseries-load-button"];
        let datalist = document.createElement("div");
        datalist.id = "timeseries_binary_datalist";

        //cont.appendChild(input);
        cont.appendChild(label);
        /*cont.appendChild(br);
        cont.appendChild(loadBut);
        cont.appendChild(br.cloneNode());
        cont.appendChild(initBut);
        cont.appendChild(br.cloneNode());*/
        cont.appendChild(datalist);
        
    }
}

window.init_timeseries_binary = init_timeseries_binary

