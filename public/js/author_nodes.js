var currentConnection = null;

var canvasOffset = new Point(0, 0);
var canvasScale = 1.0;

var canvasDragOffset = null;
var canvasDragPosition = null;


function Connection(input, output) {
    let begin = getCenter(output.element);
    let end = getCenter(input.element);
                
    this.input = input;
    this.output = output;
    this.line = addSpline(begin, end, this);
}

function beginConnection(begin_inout, begin_is_input, point) {        
    currentConnection = {};
    currentConnection.line = begin_is_input ? addSpline(point, getCenter(begin_inout.element)) : addSpline(getCenter(begin_inout.element), point);
    currentConnection.begin_is_input = begin_is_input;
    currentConnection.begin_inout = begin_inout;
}

function endConnection() {
    currentConnection.line.remove();
    currentConnection = null;
}

function getCenter(e) {
    let x = e.offset().left + e.outerWidth() * canvasScale / 2;
    let y = e.offset().top + e.outerHeight() * canvasScale / 2;
    
    return viewToCanvas(new Point(x, y));
}

function viewToCanvas(p) {
    p.x = (p.x - $("#node-canvas").offset().left - canvasOffset.x) / canvasScale;
    p.y = (p.y - $("#node-canvas").offset().top  - canvasOffset.y) / canvasScale;
    
    return p;
}

function redrawConnections(connections) {
    connections.forEach( (c) => {
        c.line.remove();
        c.line = addSpline(getCenter(c.output.element), getCenter(c.input.element), c);
    });
}

function removeFromArray(array, element) {
    let index = array.indexOf(element);
    if(index != -1) {
        array.splice(index, 1);
    }
}

function removeConnection(c) {
    c.line.remove();
    
    if(c.input.onDisconnect) c.input.onDisconnect(c);
    if(c.output.onDisconnect) c.output.onDisconnect(c);
    
    removeFromArray(c.input.connections, c);
    removeFromArray(c.output.connections, c);
}

function Output(node, single, onConnect, onDisconnect) {
    this.element = $('<div class="output input-output"></div>');
    this.node = node;
    this.single = single;
    this.onConnect = onConnect;
    this.onDisconnect = onDisconnect;
    this.connections = [];
    
    this.element.on('mousedown', (e) => {
        let point = getCenter(this.element);
        beginConnection(this, false, point);
        
        e.preventDefault();
        return false;
    });
    
    this.element.on('mouseup', (e) => {
        if(currentConnection) {
            if (currentConnection.begin_inout.node == this.node) {
                //Attempting to connect output and input from the same node
                endConnection();
            } else if(!currentConnection.begin_is_input) {
                //Attempting to connect output to output
                endConnection();
            } else {
                let input = currentConnection.begin_inout;
                //Add the new formed connection to the list of connections of both the input and the output
                let connection = new Connection(input, this);
                input.addConnection(connection);
                this.addConnection(connection);
                
                endConnection();
            }
        }
    });
    
    this.addConnection = (connection) => {
        if(this.single && this.connections.length >= 1) {
            removeConnection(this.connections[0]);
            this.connections = [];
        }
        
        this.connections.push(connection);
        if(this.onConnect) {
            this.onConnect(connection);
        }
    };
}

function Input(node, single, onConnect, onDisconnect) {
    this.element = $('<div class="input input-output"></div>');
    this.node = node;
    this.single = single;
    this.onConnect = onConnect;
    this.onDisconnect = onDisconnect;
    this.connections = [];
    
    this.element.on('mousedown', (e) => {
        let point = getCenter(this.element);
        beginConnection(this, true, point);
        
        e.preventDefault();
        return false;
    });
    
    this.element.on('mouseup', (e) => {
        if(currentConnection) {
            if (currentConnection.begin_inout.node == this.node) {
                //Attempting to connect output and input from the same node
                endConnection();
            } else if(currentConnection.begin_is_input) {
                //Attempting to connect input to input
                endConnection();
            } else {
                let output = currentConnection.begin_inout;
                //Add the new formed connection to the list of connections of both the input and the output
                let connection = new Connection(this, output);
                this.addConnection(connection);
                output.addConnection(connection);
                
                endConnection();
            }
        }
    });
    
    this.addConnection = (connection) => {
        if(this.single && this.connections.length >= 1) {
            removeConnection(this.connections[0]);
            this.connections = [];
        }
        
        this.connections.push(connection);
        if(this.onConnect) {
            this.onConnect(connection);
        }
    };
}

function redrawNodeConnections(node) {
    node.inputs.forEach( (i) => redrawConnections(i.connections));
    node.outputs.forEach( (o) => redrawConnections(o.connections));
}

function Node(name, pos, callbacks) {
    let element = $($("#template-node").html());
    let canvas = $("#canvas-transform");
    
    var dragBegin;
    element.draggable({
        start: (event) => {
            element.appendTo(canvas);
            dragBegin = new Point(event.clientX, event.clientY);
        },
        
        drag: (event, ui) => {
            var original = ui.originalPosition;
            
            var newPos = new Point((event.clientX - dragBegin.x + original.left) / canvasScale, 
                                   (event.clientY - dragBegin.y + original.top ) / canvasScale);
                                   
            //Update position used by jqueryui
            ui.position.left = newPos.x;
            ui.position.top = newPos.y;
            
            //Update the current node before redrawing connections
            element.css("left", newPos.x + "px");
            element.css("top", newPos.y + "px");
            
            redrawNodeConnections(this);
            
            if(this.onPositionChange) this.onPositionChange(newPos);
        }
    });
    
    element.css({ left: pos.x, top: pos.y });
    let name_input = element.find('.name');
    name_input.val(name);
    name_input.on("change", () => {
        if(this.onNameChange) this.onNameChange(name_input.val());
    });
    
    element.find('.test').on("click", (e) => {
        this.body().append($("<div><button>Hey</button></div>"));
    });
    
    element.find('.delete').on("click", (e) => {
        if(this.onDelete) this.onDelete();
        
        this.inputs.forEach( (i) => {
            while(i.connections.length) {
                removeConnection(i.connections[i.connections.length - 1]);
            }
        });
        this.outputs.forEach( (o) => {
            while(o.connections.length) {
                removeConnection(o.connections[o.connections.length - 1]);
            }
        });
        
        this.element.remove();
    });
    
    element.find('.copy').on("click", (e) => {
        if(this.onCopy) this.onCopy();
    });
    
    element.appendTo(canvas);
    
    this.element = element;
    this.inputs = [];
    this.outputs = [];
    this.onCopy= callbacks.onCopy;
    this.onDelete = callbacks.onDelete;
    this.onNameChange = callbacks.onNameChange;
    this.onPositionChange = callbacks.onPositionChange;
    
    
    this.addInput = (info) => {
        let input = new Input(this, info.single, info.onConnect, info.onDisconnect);
        this.inputs.push(input);
        
        this.element.find(".node-inputs").append(input.element);
    }
    
    this.addOutput = (info) => {
        let output = new Output(this, info.single, info.onConnect, info.onDisconnect);
        this.outputs.push(output);
        
        this.element.find(".node-outputs").append(output.element);
    }
    
    this.setColor = (color) => {
        this.element.css("border-color", color);
    }
    
    this.body = () => {
        return element.find(".node-body");
    };
    
}

function Point(x, y) {
    this.x = x;
    this.y = y;
}

function addSplineFromControlPoints(a, b, c, d, connection) {
    let spline = $('<svg class="svg-connection"> <path class="connection" d="M' + a.x + ' ' + a.y + 'C ' + b.x + ' ' + b.y + ', ' + c.x + ' ' + c.y + ', ' + d.x + ' ' + d.y + '" /> </svg>');
    if(connection) {
        spline.on("mousedown", "path", (e) => {
            removeConnection(connection);
            let point = viewToCanvas(new Point(e.pageX, e.pageY));
            beginConnection(connection.output, false, point);
            return false;
        });
    }
    
    $("#canvas-transform").prepend(spline);
    return spline;
}

function addSpline(a, b, connection) {
    //Clamp the delta if negative or the spline looks bad
    let delta = Math.abs(Math.max(-600, b.x - a.x));
    let c1 = a.x + delta * 0.5;
    let c2 = b.x - delta * 0.5;
    return addSplineFromControlPoints(a, new Point(c1, a.y), new Point(c2, b.y), b, connection);
}

function updateCanvasTransform() {
    $("#canvas-transform").css("transform", "translate(" + canvasOffset.x + "px, " + canvasOffset.y +"px) scale(" + canvasScale + ")");
}

function setCanvasOffsetAndScale(offset, scale) {
    canvasOffset = offset;
    canvasScale = scale;
    updateCanvasTransform();
}

function getNextAvailablePoint() {
    let canvas_rect = $("#node-canvas")[0].getBoundingClientRect();
    let x = window.pageXOffset + canvas_rect.left + 20;
    let y = window.pageYOffset + canvas_rect.top + 20;
    let p = viewToCanvas(new Point(x, y));
    p.x = Math.trunc(p.x);
    p.y = Math.trunc(p.y);
    
    //Try up to 20 times
    let nodes = $(".node");
    for (let i = 0; i < 50; i++) {
        let free = true;
        for(let j = 0; j < nodes.length; j++) {
            let x = Math.trunc(nodes[j].offsetLeft);
            let y = Math.trunc(nodes[j].offsetTop);
            
            if(x == p.x && y == p.y) {
                free = false;
                break;
            }
        }
        
        if(free) {
            break;
        }
        
        p.x += 20;
        p.y += 20;
    }
    
    return p;
}

function onClickNewNode() {
    let point = getNextAvailablePoint();
    let n = new Node("Hello!", point, () => console.log("Copied"), () => console.log("Deleted"));
    
    n.addOutput({ 
        single: true, 
        onConnect: (c) => {
            console.log("Output Connect!");
            n.setColor("darkblue");
        },
        onDisconnect: (c) => {
            console.log ("Output Disconnect!");
            n.setColor("darkred");
        }
    });
    
    n.addInput({
        single: false,
        onConnect: (c) => console.log("Input Connect!"),
        onDisconnect: (c) => console.log ("Input Disconnect!"),
    });
}

function clearCanvas() {
    $("#canvas-transform").empty();
}

$( () => {
    //Initialize canvas
    $("#node-canvas").on("mousemove", (e) => {
        if(currentConnection) {
            currentConnection.line.remove();
            
            let p = viewToCanvas(new Point(e.pageX, e.pageY));
            let begin, end;
            if(currentConnection.begin_is_input) {
                begin = p;
                end = getCenter(currentConnection.begin_inout.element);
            } else {
                begin = getCenter(currentConnection.begin_inout.element);
                end = p;
            }
            currentConnection.line = addSpline(begin, end);
        }
    });
    
    let canvas = $("#node-canvas");
    canvas.on("mousedown", (e) => {
        if(e.target == canvas[0]) {
            canvasDragOffset = new Point(canvasOffset.x, canvasOffset.y);
            canvasDragPosition = new Point(e.pageX, e.pageY);
            e.preventDefault();
        }
    });
    
    canvas.on("mousemove", (e) => { 
        if(canvasDragPosition) {
            let delta = new Point(canvasDragPosition.x - e.pageX, canvasDragPosition.y - e.pageY);
            canvasOffset = new Point(canvasDragOffset.x - delta.x, canvasDragOffset.y - delta.y);
            updateCanvasTransform();
        }
    });
    
    canvas.on('wheel', function(event){
        let deltaWheel = event.originalEvent.deltaY;
        
        let newScale = canvasScale;
        if(deltaWheel < 0){
            newScale = Math.min(canvasScale * 1.1, 1.0);
        }
        else if(deltaWheel > 0) {
            newScale = Math.max(canvasScale * 0.9, 0.25);
        }
        if(deltaWheel != 0) {
            let mouseOld = viewToCanvas(new Point(event.pageX, event.pageY));
            canvasScale = newScale;
            let mouseNew = viewToCanvas(new Point(event.pageX, event.pageY));
            
            //Adjust the offset by the amount the mouse has moved due to the change in scale, this way the position in the canvas at the cursor stays fixed
            canvasOffset.x += (mouseNew.x - mouseOld.x) * canvasScale;
            canvasOffset.y += (mouseNew.y - mouseOld.y) * canvasScale;
            updateCanvasTransform();
        }
        event.preventDefault();
    });
    
   $(document).on("mouseup", (e) => {
        if(currentConnection) {
            endConnection();
        }
        
        canvasDragOffset = null;
        canvasDragPosition = null;
    });
});