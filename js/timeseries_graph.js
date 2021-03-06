export default class TimeSeriesGraph {
    /**
     * container
     */
    #container; /* container for TimeSeriesGraph*/
    // canvas element for graph
    #canvas;
    // drawing context of canvas
    #ctx;
    // array of signals
    #signals;
    // array of annotations
    #annotations
    // width of canvas
    #width;
    // height of canvas
    #height;
    // from which value will graph start
    #start;
    // měřítko grafu
    #scale
    // drag_x
    #drag_x
    // je zakliknute tlacitko na mysi
    #is_mouse_down
    // posuvnik pro graf
    #slider
    // nadpis pro anotace
    #annotations_heading
    // list anotaci
    #annotations_list
    // anotacni rezim
    #annotation_mode
    // je anotace zvolena?
    #annotation_selected
    // kontextové menu pro pravé kliknutí na canvas
    #context_menu
    // je kontextové okno otevřené?
    #context_menu_opened
    // počet mezi vertikálními čárami
    #grid_density
    #grid_density_max
    #grid_density_min
    /**
     * 
     * @param {*} container 
     * @param {*} signals 
     */
    constructor(container, signals) {
        // container for TimeSeriesGraph
        this.#container = container;
        this.#signals = signals;
        this.#annotations = [];
        this.#init_canvas();
        this.#init_components();
        this.#start = 0;
        this.#scale = 1;
        this.#drag_x = -1;
        this.#is_mouse_down = false;
        this.#annotation_mode = false;
        this.#annotation_selected = false;
        this.#grid_density = 100;
        this.#grid_density_max = 50000;
        this.#grid_density_min = 10;
        /*this.create_annotation(100, "x");
        this.create_annotation(120, "y");
        this.create_annotation(140, "z");*/
        this.#render();
    }
    /**
     * Initialization of canvas and other values for TimeSeriesGraph
     */
    #init_canvas(){
        this.#canvas = document.createElement("canvas");
        this.#canvas.id = "timeseries_graph";
        // 16 / 9 aspect ratio podle sirky div-u
        this.#width = this.#container.offsetWidth ;
        this.#height = (this.#width * 9 / 16);
        this.#canvas.width = this.#width;
        this.#canvas.height = this.#height;
        // pripnuti canvasu do pozadovaneho containeru
        this.#container.appendChild(this.#canvas);
        // ziskani kontextu canvasu pro kresleni
        this.#ctx = this.#canvas.getContext("2d")
        /*
        let input = document.createElement("input");
        input.classList = ["btn btn-outline-primary"];
        input.type = "file";
        input.id = "timeseries_files";
        input.multiple = true;
       let br = document.createElement("br");
        let load_but = document.createElement("button");
        load_but.classList = ["btn btn-success mt-4"];
        load_but.innerText = "Načíst soubory";
        load_but.onclick = function(){
            TimeSeriesGraph.load_timeseries_binary();
        }

        this.#container.appendChild(input);
        this.#container.appendChild(br);
        this.#container.appendChild(load_but);
        */
    }

    #init_components(){

        this.#context_menu = document.createElement("ul");
        this.#context_menu.className = "timeseries-context-menu";
        this.#context_menu.innerHTML = "<div>Item 1</div><div>Item 2</div>";

        this.#container.appendChild(this.#context_menu);
        this.#context_menu_opened = false;
        

        this.#slider = document.createElement("input");
        this.#slider.type = "range";
        this.#slider.min = 0;
        this.#slider.max = 800000 - this.#width;
        this.#slider.value = 0;
        this.#slider.step = 5;
        this.#slider.style.width = "100%";
        this.#slider.addEventListener('input', e => this.set_value(e.target.value));
        this.#container.appendChild(this.#slider);

        // zoom event
        this.#canvas.addEventListener('wheel', event => this.zoom(event), false);
        
        let flexbox = document.createElement("div");
        flexbox.classList = ["timeseries_signal_switches"];
        
        // skryti/zobrazeni signalu
        for(let sig of this.#signals) {
            let signal_div = document.createElement("div");
            signal_div.classList = ["timeseries_signal_div"];
            let label = document.createElement("label");
            let checkbox = document.createElement("input");
            label.innerText = sig.name;
            label.style.marginRight = "0.5rem";
            checkbox.type = "checkbox";
            checkbox.checked = true;
            checkbox.addEventListener("input", () => this.switch_signal_visibility(sig.num));
            signal_div.appendChild(label);
            signal_div.appendChild(checkbox);
            flexbox.appendChild(signal_div);
        }
        this.#container.appendChild(flexbox);
        // oddeleni
        let hr = document.createElement("hr");
        this.#container.appendChild(hr);

        // vytvoření anotace
        let an_p = document.createElement("p");
        an_p.innerText = "Anotace na hodnotě x: ";
        let an_in = document.createElement("input");
        an_in.id = "an_val";
        an_in.type = "number";
        an_in.min = 0;
        an_in.max = 800000;
        let an_name = document.createElement("input");
        an_name.id = "an_name";
        an_name.type = "text";

        let an_but = document.createElement("button");
        an_but.classList = ["timeseries-load-button"];
        an_but.innerText = "Vytvořit anotaci";

        let an_mode = document.createElement("button");
        an_mode.innerText = "Zapnout anotační režim";
        an_mode.id = "an_mode_button";
        an_mode.classList = ["timeseries-load-button"];


        this.#container.appendChild(an_p);
        this.#container.appendChild(an_in);
        this.#container.appendChild(an_name)
        an_but.addEventListener("click", event => this.create_annotation(document.getElementById("an_val").value, document.getElementById("an_name").value));
        this.#container.appendChild(an_but);

        an_mode.addEventListener("click", () => this.switch_annotation_mode());
        this.#container.appendChild(an_mode);
        this.#annotations_heading = document.createElement("h5");
        this.#annotations_heading.innerText = "Seznam anotací";
        if(this.#annotations.length == 0)   this.#annotations_heading.style = "display:none";
        this.#container.appendChild(this.#annotations_heading);
        this.#annotations_list = document.createElement("ul");
        this.#container.appendChild(this.#annotations_list);

        this.#canvas.addEventListener('mousedown', e => this.mouse_down(e));
        this.#canvas.addEventListener('mouseup', e => this.mouse_up(e));
        this.#canvas.addEventListener('mousemove', e => this.mouse_move(e));
        this.#canvas.addEventListener('click', e => this.catch_click(e));
        this.#canvas.addEventListener('contextmenu', e => this.catch_rightclick(e), false);
    }

    /**
     * Draws axis inside a graph and marks numbers for each axis
     */
    #draw_axis(){
        //console.log("Drawing axis...")
        let ctx = this.#ctx;
        // ramecek
        this.draw_rectangle(
            {x: 0, y: 0}, 
            {x: this.#width, y: this.#height-1}, 
            "#808080", 
            0.5
        );
        // x osa
        this.draw_line(
            {x: 0, y: this.#height/2}, 
            {x: this.#width, y: this.#height/2}, 
            "#000000", 
            0.5
        );
        // sede osy - horizontalni 
        let constant = this.#height / 256;
        let posun = 0;
        for(let i = 127; i > 0; i--)
        {
            if(i % 20 == 0){
                this.draw_line(
                    {x: 0, y: constant * posun}, 
                    {x: this.#width, y: constant * posun}, 
                    "#808080", 
                    0.5
                );    
                //ctx.fillText(i, 5, constant*posun + 2);
                this.draw_text(i, 5, constant*posun + 2, "#000000");
            }
            posun++;
        }
        for(let i = -1; i >= -128; i--)
        {
            if(i % 20 == 0){
                this.draw_line(
                    {x: 0, y: constant * posun}, 
                    {x: this.#width, y: constant * posun}, 
                    "#808080", 
                    0.5
                );    
                //ctx.fillText(i, 5, constant*posun + 2);
                this.draw_text(i, 5, constant*posun + 2, "#000000");
            }
            posun++;
        }
        // sede osy - vertikalni
        
        if(this.#scale >= 1) {
            let indexed = [];
            for(let i = 0; i < this.#width; i++) {
                let index = this.get_index_with_coords(i, false);
                if(index % this.#grid_density == 0 && !indexed.includes(index)) {
                    indexed.push(index);
                    this.draw_line(
                        {x: i, y: 0},
                        {x: i, y: this.#height},
                        "#808080",
                        0.5
                    );
                    this.draw_text(index, i+5, this.#height - 8, "#808080");
                }
            }
        }
        else {
            for(let i = 0; i < this.#width; i++) {
                let indexFrom = this.get_index_with_coords(i, false);
                let indexTo = this.get_index_with_coords(i+1, false);
                let index = 0;
                for(let i = indexFrom; i < indexTo; i++)
                    if(i % this.#grid_density == 0)
                        index = i;
                if(index != 0) {
                    this.draw_line(
                        {x: i, y: 0},
                        {x: i, y: this.#height},
                        "#808080",
                        0.5
                    );
                    this.draw_text(index, i+5, this.#height - 8, "#808080");
                }
            }
        }
        
    }
    /**
     * Draws all signals from 'signals' array
     */
    #draw_signals(){
        //console.log("Drawing signals...");
        let center = parseInt(this.#height / 2);
        let constant = this.#height / 256;
        // pocet na x pro scale < 1
        let pocet_na_x = this.get_index_with_coords(1) - this.get_index_with_coords(0);

        for (let sig of this.#signals) {
            if (sig.show) {
                
                if(this.#scale >= 1) {
                    for(let i = 0; i < this.#width; i++) {
                        if(this.#start + i - 1 == sig.data.byteLength - 1)
                        {
                            console.log(`[draw_signals] Breaked at val x=${this.#start + i - 1}`);
                            break;
                        }
                            
                        this.draw_line(
                            {x: this.get_coords_with_x(this.#start + i), y: center - (sig.data[this.#start + i] * constant)}, 
                            {x: this.get_coords_with_x(this.#start + i + 1), y: center - (sig.data[this.#start + i + 1]*constant)}, 
                            sig.color, 
                            sig.line_width
                        );   
                    }
                }
                else {
                    let index = this.#start;
                    
                    //console.log(`[draw_signals] pocet_na_x: ${pocet_na_x}`);
                    for(let i = 0; i < this.#width; i++) {
                        if(this.#start + index == sig.data.byteLength - 1)
                            break;
                        let arr = [];
                        let min = 0, max = 0;
                        for(let j = 0; j < pocet_na_x; j++) {
                            if((index + j) == sig.data.byteLength - 1)
                                break;
                            arr.push(sig.data[index + j]);
                        }
                        min = Math.min(...arr);
                        max = Math.max(...arr);
                        //console.log(`[draw_signals] arr.length: ${arr}`);
                        if(arr.length > 1) {
                            this.draw_line(
                                {x: i, y: center - (min*constant)}, 
                                {x: i, y: center - (max*constant)}, 
                                sig.color, 
                                sig.line_width
                            ); 
                        }
                        else {
                            this.draw_line(
                                {x: i, y: center - (sig.data[this.#start + i] * constant)},
                                {x: i+1, y: center - (sig.data[this.#start + i + 1] * constant)},
                                sig.color,
                                sig.line_width
                            );
                        }
                        
                        index += pocet_na_x;
                        
                    }
                }
            }
        }
    }

    #draw_annotations(){
        let posun = this.#height / 50;
        // pruchod vsech anotaci
        for(let an of this.#annotations){
            let real_x = this.get_coords_with_x(an.x);
            // anotace je v rozmezi grafu
            if(real_x >= 0 && real_x < (this.#start + this.#width)){
                //console.log(`[draw_annotations] Drawing on x=${real_x}`);
                for(let i = 0; i < this.#height; i += posun*2) {
                    if(an.highlight) {
                        this.draw_line(
                            {x: real_x, y: i},
                            {x: real_x, y: i + posun},
                            "#FF0000", 
                            0.5
                        );
                    }
                    else {
                        this.draw_line(
                            {x: real_x, y: i},
                            {x: real_x, y: i + posun},
                            "#000000", 
                            0.5
                        );
                    }
                }
                //console.log(`[draw_annotations] Before text draw: x=${real_x}`);
                if(an.highlight) {
                    this.draw_text(an.x, (real_x + 3), 10, "#FF0000");
                    this.draw_text(an.name, real_x + 3, 20, "#FF0000");
                }
                else {
                    this.draw_text(an.x, (real_x + 3), 10, "#000000");
                    this.draw_text(an.name, real_x + 3, 20, "#000000");
                }
            }
        }
    }

    /**
     * Clears canvas, draws axis and then draws all signals from 'signals' array
     */
    #render(){
        this.#clear();
        this.#draw_axis();
        this.#draw_signals();
        this.#draw_annotations();
    }
    /**
     * Draws entire canvas with white color
     */
    #clear(){
        //console.log("Clearing Graph...");
        this.#ctx.clearRect(0,0, this.#width, this.#height);
    }
    /**
     * Event driven function which resizes current canvas and renders again
     * @param {int} width new width of container
     * @param {int} height new height of container
     */
    change_size(width, height){
        this.#width = width;
        this.#height = height;
        this.#canvas.width = width;
        this.#canvas.height = height;
        this.#render();
    }
    /**
     * Removes canvas and all it's controls from container
     */
    destroy(){
        console.log("Destroying graph...");
        // odebrání ovládacích prvků grafu
        while(this.#canvas.nextSibling) this.#container.removeChild(this.#canvas.nextSibling);
        // odebrání grafu
        if(this.#canvas)
            this.#container.removeChild(this.#canvas);
    }

    // EVENTY
    /**
     * Event driven function to move left in graph by 'n' points
     * @param {int} size 
     */
    move_left(size){
        console.log("Moving graph left by " + size + "...");
        if(this.#start - size < 0)
            this.#start = 0;
        else
            this.#start -= size;
        this.#render();
    }
    /**
     * Event driven function to move right in graph by 'n' points
     * @param {int} size 
     */
    move_right(size){
        console.log("Moving graph right by " + size + "...");
        if(this.#start + this.#width > 800000)
            this.#start = 800000 - this.#width;
        else
            this.#start += size;
        this.#render();
    }
    /**
     * Event driven function whenever input range value is changed
     * @param {int} val Value from input range 
     */
    set_value(val){
        console.log("[set_value]: " + val);
        this.#start = parseInt(val);
        this.#render();
    }
    /**
     * Event driven function capturing mouse scroll
     * @param {Event} event 
     */
    zoom(event){
        event.preventDefault();
        let val = event.deltaY;
        let previousScale = this.#scale;
        // priblizeni
        if(val < 0){
           this.#scale *= 1.1;
           this.#scale = this.#scale.toFixed(5);
           if(this.#scale > 0.6 && this.#scale < 1)
                this.#scale = 1;
        }
        // oddaleni
        else {
            this.#scale /= 1.1;
            this.#scale = this.#scale.toFixed(5);
            if(previousScale == 1)
                this.#scale = 0.6;
        }
        // prizpusobeni hustoty vertikalni mrizky
        this.#set_density();
        // prizpusobeni posuvnikoveho ovladani
        this.#update_slider();
        // horni a spodni mez hustoty vertikalni mrizky
        if(this.#grid_density > this.#grid_density_max)
            this.#grid_density = this.#grid_density_max;
        else if (this.#grid_density < this.#grid_density_min)
            this.#grid_density = this.#grid_density_min;
        // aktualizace odchylky hodnot signalu
        this.#scale_by_coords(this.#remove_offset_from_coord(event.x), previousScale);
        console.log("[scale]: " + this.#scale);
        console.log("[grid_density]: " + this.#grid_density);
        this.#render();
    }

    create_annotation(val, name) {
        let value = parseInt(val);
        for(let a of this.#annotations){
            if (a.x == value)
                return;
        }
        console.log("Creating annotation on x=" + value);
        let an = {x: value, highlight: false, name: name};
        this.#annotations.push(an);
        this.#create_annotations_list();
        this.#render();
    }

    #deselect_annotation() {
        for(let a of this.#annotations)
            if(a.highlight)
                a.highlight = false;
    }

    mouse_down(e){
        //console.log(`"[mouse_down] x: ${e.x}, y: ${e.y}"`);
        if(e.which == 1)
            this.#is_mouse_down = true; 
    }

    mouse_up(e){
        //console.log(`"[mouse_up] x: ${e.x}, y: ${e.y}"`);
        if(e.which == 1) {
            this.#is_mouse_down = false;
            this.#drag_x = -1;
        }
    }

    mouse_move(e){
        if(this.#is_mouse_down) {
            if(this.#drag_x == -1)
                this.#drag_x = this.#remove_offset_from_coord(e.x);
            else {
                let newX = this.#remove_offset_from_coord(e.x);
                let deltaIndexes = this.get_index_with_coords(this.#drag_x) - this.get_index_with_coords(newX);
                this.#start += deltaIndexes;
                if(this.#start < 0) this.#start = 0;
                this.#slider.value = this.#start;
                this.#drag_x = this.#remove_offset_from_coord(e.x);
                this.#render();
            }
        }
    }

    catch_click(e){
        e.preventDefault();
        if (this.#context_menu_opened)
            this.#close_context_menu();
        console.log(`[catch_click] ClickedX: ${this.#remove_offset_from_coord(e.x)}`);
        let clickedX = this.get_index_with_coords(e.x, true);
        let clickedCoord = this.get_coords_with_x(clickedX);
        console.log(`[catch_click] Clicked on index ${clickedX}, coord: ${clickedCoord}`);
        this.#select_annotation_if_clicked(e);
    }

    catch_rightclick(e) {
        e.preventDefault();
        this.#select_annotation_if_clicked(e);
        if(this.#annotation_mode) {
            console.log(`[catch_rightclick]`);
            if(!this.#context_menu_opened) {
                this.#open_context_menu(e);
            }
            else
                this.#close_context_menu()
        }
        return false;
    }



    // /EVENTY

    // VYKRESLOVANI ZAKLADNICH TVARU
    /**
     * Draws rectangle to current context of a canvas
     * @param {Point} p1 Begin point
     * @param {Point} p2 End point
     * @param {string} color Color of rectangle to be drawn
     * @param {float} line_width Width of rectangle to be drawn
     */
    draw_rectangle(p1, p2, color, line_width){
        this.#ctx.beginPath();
        this.#ctx.lineWidth = line_width;
        this.#ctx.strokeStyle = color;
        
        this.#ctx.moveTo(p1.x, p1.y);
        this.#ctx.lineTo(p2.x, p1.y);
        this.#ctx.lineTo(p2.x, p2.y);
        this.#ctx.lineTo(p1.x, p2.y);
        this.#ctx.lineTo(p1.x, p1.y);

        this.#ctx.stroke();
    }

    /**
     * Draws line to current context of a canvas
     * @param {Point} p1 First point
     * @param {Point} p2 Second point
     * @param {string} color Color of line to be drawn
     * @param {float} line_width Width of line to be drawn
     */
    draw_line(p1, p2, color, line_width){
        this.#ctx.beginPath();
        this.#ctx.lineWidth = line_width;
        this.#ctx.strokeStyle = color;
        this.#ctx.moveTo(p1.x, p1.y);
        this.#ctx.lineTo(p2.x, p2.y);
        this.#ctx.stroke();
    }
    /**
     * Draws given text at coordinates with specified color
     * @param {string} text Text to be drawn
     * @param {int} x X coordinate of canvas
     * @param {int} y Y coordinate of canvas
     * @param {string} color Color of text
     */
    draw_text(text, x, y, color="#000000"){
        if (typeof text != "string")
            text = text.toString();
        //console.log(`[draw_text] text: ${text}, x: ${x}, y: ${y}, color: ${color}`);
        this.#ctx.beginPath();
        this.#ctx.fillStyle = color;
        this.#ctx.fillText(text, x, y);
        this.#ctx.stroke();
        this.#ctx.fillStyle = "#000000";
    }

    /**
     * Turns off rendering of certain signal by number 'n'
     * @param {int} n Number of signal 
     */
    switch_signal_visibility(n) {
        for (let sig of this.#signals) {
            if (sig.num == n) {
                sig.show = !sig.show;
                this.#render();
                return;
            }
        }
        console.log("Given signal with n."+n+" was not found");
    }

    /**
     * Switch graph to annotation mode, which enables context menu
     */
    switch_annotation_mode() {
        if(this.#annotation_mode) {
            document.getElementById("an_mode_button").innerText = "Zapnout anotační režim";
            this.#annotation_mode = false;
        }
        else {
            document.getElementById("an_mode_button").innerText = "Vypnout anotační režim";
            this.#annotation_mode = true;
        }
    }

    // POMOCNÉ FUNKCE
    /**
     * Returns index of signals
     * @param {int} coord X coordination in canvas
     * @param {boolean} withOffset if value 'coord' has left offset included
     * @returns index of signals
     */
    get_index_with_coords(coord, withOffset){
        let clickedX = -1;
        
        if(withOffset) {
            clickedX = this.#remove_offset_from_coord(coord);
        }
        else {
            clickedX = parseInt(coord);
        }
        //console.log(`[get_index_with_coords] clickedX:${clickedX}`);
        if(this.#scale == 1) {
            return parseInt((this.#start + clickedX).toFixed(0));
        }
        else if (this.#scale > 1) {
            return parseInt((this.#start + (clickedX / this.#scale)).toFixed(0));
        }
        else if (this.#scale < 1) {
            return parseInt((this.#start + (clickedX / this.#scale)).toFixed(0));
        }
        return -1;
    }
    /**
     * Returns X coordination without offset
     * @param {int} index index of signals
     * @returns X coordination
     */
    get_coords_with_x(index){
        if(this.#scale == 1) {
            if(index >= this.#start && index <= (this.#start + this.#width))
                return parseInt((index - this.#start));
            else
                console.log(`[get_coords_with_x] ERROR: Index ${index} out of bounds`);
        }
        else if(this.#scale > 1) {
            return parseInt(((index - this.#start) * this.#scale).toFixed(0));
        }
        else {
            let result = parseInt(((index - this.#start) * this.#scale).toFixed(0))
            /*this.draw_line(
                {x: result, y: 0},
                {x: result, y: this.#height},
                "#BBBBBB",
                5
            );*/
            return parseInt(((index - this.#start) * this.#scale).toFixed(0));
        }
            
    }

    /**
     * Returns new X coord without side offset of canvas
     * @param {int} coord X coordination with side offset
     * @returns X without side offset
     */
    #remove_offset_from_coord(coord) {
        let rect = this.#canvas.getBoundingClientRect();
        //console.log(`[get_index_with_coords] coord: ${coord}, rect.left: ${rect.left}`);
        // x v grafu bez offsetu canvasu
        let newX = parseInt(coord - rect.left);
        return newX;
    }

    #get_distance(x1, x2) {
        let result = Math.sqrt(x1**2 - x2**2)
        //console.log(`[get_distance] ${result}`);
        return Math.sqrt(x1**2 - x2**2);
    }

    #set_density() {
        let min = this.get_index_with_coords(0, false);
        let max = this.get_index_with_coords(this.#width, false);
        if (this.#scale >= 1)
            this.#grid_density = Math.ceil(Math.floor((max - min) / 13) / 10) * 10;
        else if (this.#scale < 1 && this.#scale > 0.2)
            this.#grid_density = Math.ceil(Math.floor((max - min) / 13) / 100) * 100;
        else if (this.#scale <= 0.2 && this.#scale > 0.1)
            this.#grid_density = Math.ceil(Math.floor((max - min) / 13) / 500) * 500;
        else 
            this.#grid_density = Math.ceil(Math.floor((max - min) / 13) / 1000) * 1000;
    }

    #update_slider() {
        
        //this.#slider.max = (800000 / this.#scale) - (this.#width / this.#scale);
    }

    /**
     * Calculates new horizontal shift
     * @param {int} x X coordination where zoom was applied
     * @param {float} previousScale previous scale before zoom
     */
    #scale_by_coords(x, previousScale) {
        console.log(`[scale_by_coords] X=${x}`);
        let center_x = this.#width / 2;
        let rel_x = x - center_x;
        let scaledX = rel_x / this.#scale;
        let newStart = parseInt((x / previousScale) - (x / this.#scale));
        console.log(`[scale_by_coords] New scaled x=${scaledX}`);
        if (this.#start + newStart < 0)
            this.#start = 0;
        else
            this.#start += newStart;
        this.#slider.value = this.#start;
    }

    /**
     * Refreshes list of annotations
     */
    #create_annotations_list() {
        // zobrazení nadpisu anotací, pokud existují
        this.#annotations_heading.style = (this.#annotations.length == 0) ? "display:none" : "display:block";
        // odebrání původního seznamu anotací
        while(this.#annotations_list.firstChild) this.#annotations_list.removeChild(this.#annotations_list.firstChild);
        for(let an of this.#annotations){
            let li = document.createElement("li");
            li.innerText = an.x + " - " + an.name + " " + (an.highlight ? "X" : "");
            this.#annotations_list.appendChild(li);
        }
    }
    /**
     * Opens context menu
     * @param {Event} e Event where was right clicked
     */
    #open_context_menu(e) {
        this.#context_menu.style.visibility = "visible";
        //context menu
        let coord = this.#remove_offset_from_coord(e.clientX);
        const xTranslate = ((coord) * 100) / this.#width;
        
        this.#context_menu.style.left = (e.clientX)+ 'px';
        this.#context_menu.style.top = (e.clientY + 5)+ 'px';
        this.#context_menu.style.transform = `translateX(-${xTranslate}%)`;
        this.#context_menu_opened = true;
        console.log(`[open_context_menu] clientX: ${e.clientX}`);
        let x = this.get_index_with_coords(e.clientX, true);
        console.log(`[open_context_menu] Menu will be for index ${x}`);
        // odstranění předešlých možností
        while(this.#context_menu.firstChild) this.#context_menu.removeChild(this.#context_menu.firstChild);
        // options
        if(this.#annotation_selected) {
            //edit
            let editA = document.createElement("a");
            editA.classList = ["timeseries-context-menu-option"];
            editA.onclick = () => this.edit_annotation();
            let editDiv = document.createElement("div");
            editDiv.innerText = "Upravit vybrané anotace";
            editA.appendChild(editDiv);
            //remove
            let removeA = document.createElement("a");
            removeA.classList = ["timeseries-context-menu-option"];
            removeA.onclick = () => this.remove_annotation();
            let removeDiv = document.createElement("div");
            removeDiv.innerText = "Odstranit vybrané anotace";
            removeA.appendChild(removeDiv);

            this.#context_menu.appendChild(editA);
            this.#context_menu.appendChild(removeA);
        }    
        else {
            let createA = document.createElement("a");
            createA.classList = ["timeseries-context-menu-option"];
            createA.onclick = () => this.prompt_annotation(x);
            let createDiv = document.createElement("div");
            createDiv.innerText = "Vytvořit anotaci";
            createA.appendChild(createDiv);

            this.#context_menu.appendChild(createA);
        }
    }

    /**
     * Closes context menu
     */
    #close_context_menu() {
        this.#context_menu.style.visibility = "hidden";
        this.#context_menu_opened = false;
    }
    /**
     * Highlights annotation if it's near x
     * @param {int} x X coordination
     */
    #select_annotation_if_clicked(e) {
        let multipleClick = e.ctrlKey;
        console.log(`[select_annotation_if_clicked] ctrl: ${multipleClick}`);
        let xCoord = this.#remove_offset_from_coord(e.x);
        let clickedIndex = this.get_index_with_coords(xCoord, false);
        console.log(`[select_annotation_if_clicked] clickedX: ${clickedIndex}`);
        let results = [];
        for(let a of this.#annotations) {
            if (clickedIndex > (a.x - (3/this.#scale)) && clickedIndex < (a.x + (3/this.#scale))) {
                results.push(a);
                this.#annotation_selected = true;
            }
        }
        // více anotací v rozsahu
        if (results.length > 1) {
            let finalX = results[0].x;
            let distance = this.#get_distance(xCoord, this.get_coords_with_x(results[0].x));
            for(let i = 1; i < results.length; i++) {
                let x2 = this.get_coords_with_x(results[i].x);
                console.log(`[select_annotation_if_clicked] x2: ${x2}`);
                let newDistance = this.#get_distance(xCoord, x2);
                if( distance > newDistance) {
                    distance = newDistance;
                    finalX = results[i].x; 
                }
            }
            this.#select_annotation_by_x(finalX, multipleClick ? false:true);
        }
        else if (results.length == 1) {
            this.#select_annotation_by_x(results[0].x, multipleClick ? false:true);
        }
        else {
            this.#deselect_annotation();
            this.#annotation_selected = false;
            this.#create_annotations_list();
        }
        this.#render();
    }
    /**
     * Selects 
     * @param {int} x 
     * @param {boolean} deselect 
     */
    #select_annotation_by_x(x, deselect) {
        if(deselect)
            this.#deselect_annotation();
        for(let a of this.#annotations) {
            if(a.x == x) {
                a.highlight = true;
            }
        }
        this.#create_annotations_list();
    }

    prompt_annotation(x) {
        let nazev = prompt("Zadejte název anotace", "Anotace X");
        if(nazev != null)
            this.create_annotation(x, nazev);
        else
            alert("Nebyl zadán název pro anotaci!");
        this.#close_context_menu();
    }

    edit_annotation() {
        for(let a of this.#annotations) {
            if(a.highlight == true) {
                let newName = prompt("Zadejte nový název anotace", a.name);
                if(!newName)
                    alert("Nebyl zadán název pro anotaci!");
                else
                    a.name = newName;
            }
        }
        this.#create_annotations_list();
        this.#close_context_menu();
        this.#render();
    }

    remove_annotation() {
        for(let i = 0; i < this.#annotations.length; i++) {
            if(this.#annotations[i].highlight == true) {
                console.log(`[remove_annotation] splicing`);
                this.#annotations.splice(i, 1);
                i--;    // splice sníží velikost pole o 1
            }
        }
        this.#create_annotations_list();
        this.#close_context_menu();
        this.#render();
    }
}