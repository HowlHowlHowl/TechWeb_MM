//Button for the current selected story.
var selectedStoryButton = null;

//Story that is currently being edited
var loadedStory = null;

//Flag used to mark that a change has been made and we need to save before quitting the editor.
var editorDirty = false;

//This array contains all the nodes currently in the canvas and is kept in sync with the array of activities in the loaded story 
//so that the node at position i is related to the activity at position i in the loadedStory.activities array.
var nodesArray = [];

function modalSave() {
    saveSelectedStory();
}

function modalDiscard() {
    editorDirty = false;
    clearSelectedStory();
}

function editorNameChange(element) {
    if(loadedStory.name != element.value) {
        loadedStory.name = element.value;
        editorDirty = true;
    }
}

function editorAccessibleChange(element) {
    loadedStory.accessible = element.checked;
    editorDirty = true;
}

function updateAllUpDownButtons(container, up_class, down_class) {
    up_array = container.find(up_class);
    for (i = 0; i < up_array.length; i++) {
        $(up_array[i]).prop("disabled", i == 0);
    }
    
    down_array = container.find(down_class); 
    for (i = 0; i < down_array.length; i++) {
        $(down_array[i]).prop("disabled", i == down_array.length - 1);
    }
}

function linkInputToProperty(object, name, input) {
    //Clear previous handlers
    input.off("change");
    
    input.val(object[name]);
    input.on("change", () => {
        editorDirty = true;
        object[name] = input.val();
    });
}

function addContentElement(content, container, activity) {
    let content_div = $($("#template-content").html());
    
    let item_div = content_div.find(".content-item");
    switch(content.type) {
        case "text": {
            let textarea = $(document.createElement("textarea"));
            textarea.appendTo(item_div);
            linkInputToProperty(content, "text", textarea);
        } break;
        
        case "image": {
            let image_div = $($("#template-content-image").html());
            
            let image = image_div.find("img");
            let input = image_div.find("input");
            let name = image_div.find(".file-upload-name");
            
            if(content.url == "") {
                image.hide();
            } else {
                image.attr("src", content.url);
            }
            
            input.on("change", () => {
                editorDirty = true;
                name.text(input[0].files[0].name);
                image[0].src = URL.createObjectURL(input[0].files[0]);
                image.show();
                
                uploadFileAndStoreURL(input[0].files[0], content, "url");
            });
            
            image_div.appendTo(item_div);
            
        } break;
        
        case "video": {
            let video_div = $($("#template-content-video").html());
            
            let video = video_div.find("video");
            let source = video_div.find("source");
            let input = video_div.find("input");
            let name = video_div.find(".file-upload-name");
            
            if(content.url == "") {
                video.hide();
            } else {
                video.attr("src", content.url);
            }
            
            input.on("change", () => {
                editorDirty = true;
                name.text(input[0].files[0].name);
                source[0].src = URL.createObjectURL(input[0].files[0]);
                video[0].load();
                video.show();
                
                uploadFileAndStoreURL(input[0].files[0], content, "url");
            });
            
            video_div.appendTo(item_div);
        } break;
    }
    
    let del = content_div.find(".content-del");
    del.on("click", () => {
        let index = activity.contents.indexOf(content);
        if(index != -1) {
            activity.contents.splice(index, 1);
        }
        content_div.remove();
        editorDirty = true;
        
        updateAllUpDownButtons(container, ".content-up", ".content-down");
    });
    
    let i = activity.contents.indexOf(content);
    
    let up = content_div.find(".content-up");
    up.prop("disabled", i == 0);
    up.on("click", () => {
        editorDirty = true;
        
        //order the contents in the story object
        let array = activity.contents;
        let index = array.indexOf(content);
        let tmp = array[index];
        array[index] = array[index - 1];
        array[index - 1] = tmp;
        
        //order the widgets in the editor
        content_div.insertBefore(content_div.prev());
        
        updateAllUpDownButtons(container, ".content-up", ".content-down");
    });
    
    let down = content_div.find(".content-down");
    down.prop("disabled", i == activity.contents.length - 1);
    down.on("click", () => {
        editorDirty = true;
        
        let array = activity.contents;
        let index = array.indexOf(content);
        
        //order the contents in the story object
        let tmp = array[index];
        array[index] = array[index + 1];
        array[index + 1] = tmp;
        
        //order the widgets in the editor
        content_div.insertAfter(content_div.next());
        
        updateAllUpDownButtons(container, ".content-up", ".content-down");
    });
    
    content_div.appendTo(container);
}

function editorNewContent(content, container, activity)
{
    editorDirty = true;
    activity.contents.push(content);
    addContentElement(content, container, activity);
}

function colorFromMissionIndex(i) {
    if(i == null) {
        return "#FFFFFF";
    } else {
        return loadedStory.missions[i].color;
    }
}

function refreshOptions(options, activity) {
    options.find("button").each( (j, e) => {
        if(j == 0) {
            $(e).toggleClass("active", activity.mission_index == null);
        } else {
            $(e).toggleClass("active", (j - 1) == activity.mission_index);
        }
    });
}

function makeOutput(object, property, node) {
    if(object[property] === undefined) {
        object[property] = null;
    }
    
    let output = node.addOutput({
        single: true, 
        onConnect: (c) => {
            let new_index = nodesArray.indexOf(c.input.node);
            if(object[property] != new_index) {
                editorDirty = true;
                object[property] = new_index;
            }
        },
        onDisconnect: (c) => {
            if(object[property] != null) {
                editorDirty = true;
                object[property] = null;
            }
        }
    });
    
    let target_index = object[property];
    if(target_index !== null) {
        console.log(target_index);
        let input = nodesArray[target_index].inputs[0];
        
        let c = new Connection(input, output);
        input.addConnection(c);
        output.addConnection(c);
    }
}

function setNodeOutputs(activity, node) {
    let type = activity.input_type;
    let input = activity.input;
    
    node.clearOutputs();
    
    
    if(type == "none") {
        //add the 1 default output.
        makeOutput(input, "next_index", node);
    } else {
        switch(input.evaluation_type) {
            case "any":
                //add the 1 default output.
                makeOutput(input, "next_index", node);
                break;
            case "correct":
                //add 1 for each case and the default if present
                input.options.forEach( (o) => {
                    makeOutput(o, "next_index", node);
                });
                if(input.option_default) {
                    makeOutput(input.option_default, "next_index", node);
                }
                break;
                
            case "evaluator":
                //add 1 for correct and 1 for wrong
                makeOutput(input, "correct_next_index", node);
                makeOutput(input, "wrong_next_index", node);
                break;
        }
    }
}

function setInputElement(activity, node)
{
    let container = $("#activity-input-div");
    container.empty();
    
    let type = activity.input_type;
    
    if(type != "none") {
        //Evaluation options
        let label = $('<label for="input-evaluation-select">Tipologia di valutazione:</label>');
        let select = $('<select class="custom-select" id="input-evaluation-select"></select>');
        
        select.empty();    
        let options = [ 
            { text: "Qualsiasi", value: "any"},
            { text: "Corretta", value: "correct"},
            { text: "Valutata", value: "evaluator"},
        ];
        if(type == "photo") {
            removeFromArray(options, options[1]);
        }
        
        options.forEach( (o) => {
            let option = $('<option value="' + o.value + '" >' + o.text + '</option>');
            option.prop("selected", o.value == activity.input.evaluation_type);
            select.append(option);
        });
        
        select.on("change", (e) => {
            editorDirty = true;
            activity.input = { evaluation_type: select.val() };
            setNodeOutputs(activity, node);
        });
        
        container.append(label);
        container.append(select);
    }
    
    setNodeOutputs(activity, node);
}


function openActivityEditor(activity, node) {
    let editor = $("#activity-modal");
    
    //Activity name
    let name = editor.find(".activity-name");
    name.off("change");
    name.val(activity.name);
    name.on("change", (e) => {
        editorDirty = true;
        activity.name = name.val();
        node.setName(name.val());
    });
    
    //Mission
    let select = editor.find(".select-mission");
    select.text(activity.mission_index == null ? "Nessuna missione" : loadedStory.missions[activity.mission_index].name);
    let options = editor.find(".mission-options");
    options.empty();
    
    let none = $('<button class="dropdown-item" type="button">Nessuna missione</button>');
    none.toggleClass("active", activity.mission_index == null);
    none.on("click", () => {
        if(activity.mission_index != null) {
            editorDirty = true;
            activity.mission_index = null;
            node.setColor(colorFromMissionIndex(activity.mission_index));
            select.text("Nessuna missione");
            refreshOptions(options, activity);
        }
    });
    
    none.appendTo(options);
    let divider = $('<div class="dropdown-divider"></div>');
    divider.appendTo(options);
    
    for(let i = 0; i < loadedStory.missions.length; i++) {
        let m = loadedStory.missions[i];
        let button = $('<button class="dropdown-item" type="button">' + m.name + '</button>');
        button.toggleClass("active", i == activity.mission_index);
        
        button.on("click", () => {
            if(activity.mission_index != i) {
                editorDirty = true;
                activity.mission_index = i;
                node.setColor(colorFromMissionIndex(activity.mission_index));
                select.text(m.name);
                refreshOptions(options, activity);
            }
        });
        button.appendTo(options);
    }
    
    //Contents
    let contents = editor.find(".contents-div");
    contents.empty();
    
    activity.contents.forEach((c) => addContentElement(c, contents, activity));
    
    let add_text = editor.find(".add-text");
    add_text.off("click");
    add_text.on("click", () => {
        editorNewContent({type: "text", text:""}, contents, activity);
        updateAllUpDownButtons(contents, ".content-up", ".content-down");
    });
    
    let add_image = editor.find(".add-image");
    add_image.off("click");
    add_image.on("click", () => {
        editorNewContent({type: "image", url:""}, contents, activity);
        updateAllUpDownButtons(contents, ".content-up", ".content-down");
    });
    
    let add_video = editor.find(".add-video");
    add_video.off("click");
    add_video.on("click", () => {
        editorNewContent({type: "video", url:""}, contents, activity);
        updateAllUpDownButtons(contents, ".content-up", ".content-down");
    });
    
    //Input
    let input_types = ["text", "number", "photo", "none"];
    input_types.forEach((type) => {
        let input = editor.find(".input-" + type);
        input.toggleClass("active", activity.input_type == type);
        input.off("click");
        input.on("click", () => {
            if(activity.input_type != type) {
                editorDirty = true;
                activity.input_type = type;
                
                activity.input = {};
                if(type != null) {
                    activity.input.evaluation_type = "any";
                }
                activity.input.next_index = null;
                
                setInputElement(activity, node);
            }
        });
    });
    
    setInputElement(activity, node);
    
    editor.modal();
}

function deleteActivity(activity) {
    let index = loadedStory.activities.indexOf(activity);
    if(index != -1) {
        loadedStory.activities.splice(index, 1);
        nodesArray.splice(index, 1);
    }
}

function addActivityNode(activity) {
    let n = new Node(activity.name, activity.position, {
        onCopy:  () => {
            console.log("Copied");
        }, 
        
        onDelete: () => {
            editorDirty = true;
            deleteActivity(activity);
        },
        
        onNameChange: (name) => {
            editorDirty = true;
            activity.name = name;
        },
        
        onPositionChange: (pos) => {
            editorDirty = true;
            activity.position = pos;
        }
    });
    
    n.setColor(colorFromMissionIndex(activity.mission_index));
    
    let modify = $('<button class="btn btn-success btn-sm">Modifica</button>');
    modify.on("click", (e) => openActivityEditor(activity, n));
    n.body().append(modify);
    
    n.addInput({
        single: false,
        onConnect: (c) => console.log("Input Connect!"),
        onDisconnect: (c) => console.log ("Input Disconnect!"),
    });
    
    nodesArray.push(n);
}

function editorNewActivity() {
    editorDirty = true;
    let activity = {
        name: "Nuova attività",
        contents: [],
        mission_index: null, //Assigned to no mission when created
        input_type: "none",
        input: {
            evaluation_type: "none",
            next_index: null
        },
        position: getNextAvailablePoint()
    };
    
    loadedStory.activities.push(activity);
    addActivityNode(activity);
}


function addMissionElement(mission) {
    let mission_div = $($("#template-mission").html());
    
    linkInputToProperty(mission, "name", mission_div.find(".mission-name"));
    let color = mission_div.find(".mission-col");
    linkInputToProperty(mission, "color", color);
    color.on("change", () => {
        loadActivities();
    });
    
    let del = mission_div.find(".mission-del");
    del.on("click", () => {
        editorDirty = true;
        mission_div.remove();
        
        let index = loadedStory.missions.indexOf(mission);
        loadedStory.missions.splice(index, 1);
        
        loadedStory.activities.forEach( (a) => {
            if(a.mission_index == index) {
                a.mission_index = null;
            } else if(a.mission_index > index) {
                a.mission_index--;
            }
        });
        
        loadActivities();
    });
    
    let copy = mission_div.find(".mission-copy");
    copy.on("click", () => {
    });
    
    mission_div.appendTo("#editor-missions");
}

function editorNewMission() {
    editorDirty = true;
    let mission = {
        name: "Nuova missione",
        color: "#EEEEEE"
    };
    loadedStory.missions.push(mission);
    addMissionElement(mission);
}

function clearSelectedStory() {
    if(selectedStoryButton) {
        selectedStoryButton.removeClass("active");
    }
    selectedStoryButton = null;
    loadedStory = null;
    editorDirty = false;
    $("#editor-placeholder").removeClass("d-none");
    $("#editor-area-activities").addClass("d-none");
    $("#editor-area-missions").addClass("d-none");
}

function loadActivities() {
    clearCanvas();
    nodesArray = [];
    loadedStory.activities.forEach((a) => {
        addActivityNode(a);
    });
    
    //After we created all nodes we create all outputs and make the connections
    loadedStory.activities.forEach((a, index) => {
        setNodeOutputs(a, nodesArray[index]);
    });
}

function selectStory(id) {
    $.ajax({
        accepts: 'application/json',
        url: '/stories/' + id,
        success: function(data) {
            editorDirty = false;
            loadedStory = data;
            $("#editor-placeholder").addClass("d-none");
            $("#editor-area-activities").removeClass("d-none");
            $("#editor-area-missions").removeClass("d-none");
            $("#editor-name").val(loadedStory.name);
            $("#editor-accessible").prop("checked", loadedStory.accessible);
            
            $("#editor-missions").empty();
            loadedStory.missions.forEach((m) => {
                addMissionElement(m);
            });
            
            setCanvasOffsetAndScale(loadedStory.canvas_offset, loadedStory.canvas_scale);
            loadActivities();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(xhr.status + ' - ' + thrownError);
        }
    });
}


function addStoryElement(s) {
    let story_div = $($("#template-story").html());
    
    let item = story_div.find(".list-group-item");
    item.text(s.name);
    item.on("click", () => {
        if(editorDirty) {
            $("#save-modal").modal();
            return;
        }
        
        if(selectedStoryButton) {
            selectedStoryButton.removeClass("active");
        }
        selectedStoryButton = item;
        item.addClass("active");
        selectStory(s.id);
    });
    
    if(loadedStory && loadedStory.id == s.id) {
        selectedStoryButton = item;
        item.addClass("active");
    }
    
    let qr = story_div.find(".story-qr");
    
    let del = story_div.find(".story-del");
    del.on("click", (event) => {
        $("#modal-delete-message").html("Sicuro di voler eliminare la storia: <b>" + s.name + "</b>?");
        $("#modal-delete-button").attr("delete-id", s.id);
        $("#delete-modal").modal();
    });
    
    
    let swap = story_div.find(".story-swap");
    swap.on("click", () => actionOnStory(s.id, s.published ? "archive" : "publish"));
    
    let dup = story_div.find(".story-dup");
    dup.on("click", () => actionOnStory(s.id, "duplicate"));
    
    if(s.published) {
        $('#stories-published').append(story_div);
    } else {
        $('#stories-archived').append(story_div);
    }
}


function uploadFileAndStoreURL(file, object, name)
{   
    let fd = new FormData();
    fd.append(file.name, file);
    
    $.ajax({
        accepts: 'application/json',
        url: '/upload',
        data: fd,
        type: 'POST',
        contentType: false,
        processData: false,
        
        success: function(data) {
            object[name] = data.url;
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(xhr.status + ' - ' + thrownError);
        }
    });
}


function updateStories() {
    $.ajax({
        accepts: 'application/json',
        url: '/stories',
        success: function(data) {
            $('#stories-published').empty();
            $('#stories-archived').empty();
            
            data.forEach(addStoryElement);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(xhr.status + ' - ' + thrownError);
        }
    });
}

function newStory(published)
{
    let story = {
        name: "Nuova storia",
        accessible: false,
        published: published,
        canvas_offset: { x: 0, y: 0 },
        canvas_scale: 1.0,
        missions: [],
        activities: [],
    };
    
    $.ajax({
        url: '/stories',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(story),
        
        success: function(data) {
            updateStories();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(xhr.status + ' - ' + thrownError);
        }
    });
}

function saveSelectedStory()
{
    if(loadedStory)
    {
        editorDirty = false;
        let id = loadedStory.id;
        loadedStory.canvas_offset = canvasOffset;
        loadedStory.canvas_scale = canvasScale;
        
        $.ajax({
            url: '/stories/' + id,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(loadedStory),
            
            success: function(data) {
                updateStories();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert(xhr.status + ' - ' + thrownError);
            }
        });
    }
}

function actionOnStory(id, action) {
    $.ajax({
        url: '/stories/' + id,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ action: action}),
        
        success: function(data) {
            if(action == "delete" && loadedStory && loadedStory.id == id) {
                clearSelectedStory();
            }
            updateStories();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(xhr.status + ' - ' + thrownError);
        }
    });
}

$(() => {
    //Load stories
    updateStories();
});