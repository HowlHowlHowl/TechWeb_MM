//Represents the current connection being dragged with the cursor
var currentConnection = null;

//Current offset and scale of the canvas
var canvasOffset = new Point(0, 0);
var canvasScale = 1.0;

//Current offset and starting position of a drag on the canvas
var canvasDragOffset = null;
var canvasDragPosition = null;

//Create a connection between input and output
function Connection(input, output) {
    let begin = getCenter(output.element);
    let end = getCenter(input.element);
                
    this.input = input;
    this.output = output;
    this.line = addSpline(begin, end, this);
}

//Begin the creation of a connection being dragged with the cursor
function beginConnection(begin_inout, begin_is_input, point) {        
    currentConnection = {};
    currentConnection.line = begin_is_input ? addSpline(point, getCenter(begin_inout.element)) : addSpline(getCenter(begin_inout.element), point);
    currentConnection.begin_is_input = begin_is_input;
    currentConnection.begin_inout = begin_inout;
}

//End the creation of a connection
function endConnection() {
    currentConnection.line.remove();
    currentConnection = null;
}

//Return the center of the element e in canvas space
function getCenter(e) {
    let x = e.offset().left + e.outerWidth() * canvasScale / 2;
    let y = e.offset().top + e.outerHeight() * canvasScale / 2;
    
    return viewToCanvas(new Point(x, y));
}

//Transform point p from view space to canvas space
function viewToCanvas(p) {
    p.x = (p.x - $("#node-canvas").offset().left - canvasOffset.x) / canvasScale;
    p.y = (p.y - $("#node-canvas").offset().top  - canvasOffset.y) / canvasScale;
    
    return p;
}

//Redraw all the connections in the array
function redrawConnections(connections) {
    connections.forEach( (c) => {
        c.line.remove();
        c.line = addSpline(getCenter(c.output.element), getCenter(c.input.element), c);
    });
}

//Remove element from array, if present
function removeFromArray(array, element) {
    let index = array.indexOf(element);
    if(index != -1) {
        array.splice(index, 1);
    }
}

//Remove connection c, calling the events on the connected nodes if present
function removeConnection(c) {
    c.line.remove();
    
    if(c.input.onDisconnect) c.input.onDisconnect(c);
    if(c.output.onDisconnect) c.output.onDisconnect(c);
    
    removeFromArray(c.input.connections, c);
    removeFromArray(c.output.connections, c);
}

//Create an output with the specified options and events for the node
function Output(node, single, color, onConnect, onDisconnect) {
    this.element = $('<div class="output input-output"></div>');
    this.node = node;
    this.single = single;
    this.onConnect = onConnect;
    this.onDisconnect = onDisconnect;
    this.connections = [];
    
    if(color)
        this.element.css("background-color", color);
    
    this.element.on('mousedown', (e) => {
        let point = getCenter(this.element);
        beginConnection(this, false, point);
        
        e.preventDefault();
        return false;
    });
    
    //Create a connection when the mouse is released on the node while dragging a new connection
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
        //Remove other connections if single
        if(this.single && this.connections.length >= 1) {
            removeConnection(this.connections[0]);
            this.connections = [];
        }
        
        //Call the onConnect events when connected
        this.connections.push(connection);
        if(this.onConnect) {
            this.onConnect(connection);
        }
    };
}

//Create an input with the specified options and events for the node
function Input(node, single, color, onConnect, onDisconnect) {
    this.element = $('<div class="input input-output"></div>');
    this.node = node;
    this.single = single;
    this.onConnect = onConnect;
    this.onDisconnect = onDisconnect;
    this.connections = [];
    
    if(color)
        this.element.css("background-color", color);
    
    this.element.on('mousedown', (e) => {
        let point = getCenter(this.element);
        beginConnection(this, true, point);
        
        e.preventDefault();
        return false;
    });
    
    //Create a connection when the mouse is released on the node while dragging a new connection
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
        //Remove other connections if single
        if(this.single && this.connections.length >= 1) {
            removeConnection(this.connections[0]);
            this.connections = [];
        }
        
        //Call the onConnect events when connected
        this.connections.push(connection);
        if(this.onConnect) {
            this.onConnect(connection);
        }
    };
}

//Redraw all the connections for the inputs and outputs of a node
function redrawNodeConnections(node) {
    node.inputs.forEach( (i) => redrawConnections(i.connections));
    node.outputs.forEach( (o) => redrawConnections(o.connections));
}

//Create a new node at the specified position with the specified callbacks and add it to the canvas
function Node(name, pos, callbacks) {
    let element = $($("#template-node").html());
    let canvas = $("#canvas-transform");
    
    //Dragging
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
    
    //Starting position
    element.css({ left: pos.x, top: pos.y });
    
    //Name
    let name_input = element.find('.node-name');
    name_input.val(name);
    name_input.on("change", () => {
        if(this.onNameChange) this.onNameChange(name_input.val());
    });
    
    //Delete button
    element.find('.delete').on("click", (e) => {
        this.remove();
    });
    
    //Copy button
    element.find('.copy').on("click", (e) => {
        if(this.onCopy) this.onCopy();
    });
    
    element.appendTo(canvas);
    
    //Initialization of the node and callbacks
    this.element = element;
    this.inputs = [];
    this.outputs = [];
    this.onCopy= callbacks.onCopy;
    this.onDelete = callbacks.onDelete;
    this.onNameChange = callbacks.onNameChange;
    this.onPositionChange = callbacks.onPositionChange;
    
    //Methods on the node to add and remove inputs and outputs
    this.addInput = (info) => {
        let input = new Input(this, info.single, info.color, info.onConnect, info.onDisconnect);
        this.inputs.push(input);
        
        this.element.find(".node-inputs").append(input.element);
        
        return input;
    };
    
    this.addOutput = (info) => {
        let output = new Output(this, info.single, info.color, info.onConnect, info.onDisconnect);
        this.outputs.push(output);
        
        this.element.find(".node-outputs").append(output.element);
        
        return output;
    };
    
    this.clearInputs = () => {
        this.inputs.forEach( (i) => {
            while(i.connections.length) {
                removeConnection(i.connections[i.connections.length - 1]);
            }
        });
        
        this.inputs = [];
        this.element.find(".node-inputs").clear();
    };
    
    this.clearOutputs = () => {
        this.outputs.forEach( (o) => {
            while(o.connections.length) {
                removeConnection(o.connections[o.connections.length - 1]);
            }
        });
        
        this.outputs = [];
        this.element.find(".node-outputs").empty();
    };
    
    //Operations on the nodes
    this.setName = (name) => {
        this.element.find(".node-name").val(name);
    };
    
    this.setColor = (color) => {
        this.element.css("border-color", color);
    };
    
    this.body = () => {
        return element.find(".node-body");
    };
    
    this.hideButtons = () => {
        element.find(".node-buttons").css("display", "none");
    };
    
    this.remove = () => {
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
    };
    
}

function Point(x, y) {
    this.x = x;
    this.y = y;
}

//Create an svg element with a path element that draws the spline specified by control points a b c d, when clicked the connection can be moved
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

//Add a spline specified by start and end position, control points are computed based on the distance of the points
function addSpline(a, b, connection) {
    //Clamp the delta if negative or the spline looks bad
    let delta = Math.abs(Math.max(-600, b.x - a.x));
    let c1 = a.x + delta * 0.5;
    let c2 = b.x - delta * 0.5;
    return addSplineFromControlPoints(a, new Point(c1, a.y), new Point(c2, b.y), b, connection);
}

//Update the css properties of the canvas transform
function updateCanvasTransform() {
    $("#canvas-transform").css("transform", "translate(" + canvasOffset.x + "px, " + canvasOffset.y +"px) scale(" + canvasScale + ")");
}

//Update offset and scale of the canvas
function setCanvasOffsetAndScale(offset, scale) {
    canvasOffset = offset;
    canvasScale = scale;
    updateCanvasTransform();
}

//Return the center of the canvas in canvas space
function getCanvasCenter() {
    let canvas_rect = $("#node-canvas")[0].getBoundingClientRect();
    let x = window.pageXOffset + canvas_rect.left + canvas_rect.width / 2;
    let y = window.pageYOffset + canvas_rect.top + canvas_rect.height / 2;
    let p = viewToCanvas(new Point(x, y));
    
    return p;
}

//Return a point on the top left of the canvas, if a node is already there then return a point slightly lower-right
function getNextAvailablePoint() {
    let canvas_rect = $("#node-canvas")[0].getBoundingClientRect();
    let x = window.pageXOffset + canvas_rect.left + 20;
    let y = window.pageYOffset + canvas_rect.top + 20;
    let p = viewToCanvas(new Point(x, y));
    p.x = Math.trunc(p.x);
    p.y = Math.trunc(p.y);
    
    //Try up to 50 times
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

//Clear the whole canvas
function clearCanvas() {
    $("#canvas-transform").empty();
}

$( () => {
    let canvas = $("#node-canvas");
    
    //Dragging of a new connection on the canvas
    canvas.on("mousemove", (e) => {
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
    
    //Begin a drag operation on the canvas
    canvas.on("mousedown", (e) => {
        if(e.target == canvas[0]) {
            canvasDragOffset = new Point(canvasOffset.x, canvasOffset.y);
            canvasDragPosition = new Point(e.pageX, e.pageY);
            e.preventDefault();
        }
    });
    
    //Drag the canvas
    canvas.on("mousemove", (e) => { 
        if(canvasDragPosition) {
            let delta = new Point(canvasDragPosition.x - e.pageX, canvasDragPosition.y - e.pageY);
            canvasOffset = new Point(canvasDragOffset.x - delta.x, canvasDragOffset.y - delta.y);
            updateCanvasTransform();
        }
    });
    
    //Change the canvas scale on wheel event
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
    
    //Stop the current connection if the mouse cursor is released anywhere in the document
    $(document).on("mouseup", (e) => {
        if(currentConnection) {
            endConnection();
        }
        
        canvasDragOffset = null;
        canvasDragPosition = null;
    });
});