//Button for the current selected story.
var selectedStoryButton = null;

//Story that is currently being edited
var loadedStory = null;

//Flag used to mark that a change has been made and we need to save before quitting the editor.
var editorDirty = false;

//Clipboard for copied activitiy and mission
var copiedActivity = null;
var copiedMissionData = null;

//This array contains all the nodes currently in the canvas and is kept in sync with the array of activities in the loaded story 
//so that the node at position i is related to the activity at position i in the loadedStory.activities array.
var nodesArray = [];



/*  Utility function to create and open a modal with the specified title, text, body and buttons

Example options:
    {
        title: "title",
        text: "text",
        body: $('<p>Body</p>'),
        buttons: 
        [
            {
                text: "",
                onclick: () => console.log("hello");
                secondary: true
            }
        ]
    }
*/
function openModal(opt) {    
    $("#mod-title").text(opt.title || "");
    $("#mod-text").html(opt.text || "");
    $("#mod-body").empty();
    if(opt.body) {
        $("#mod-body").append(opt.body);
    }
    
    let buttons = $("#mod-buttons");
    buttons.empty();
    for(let b of opt.buttons) {
        let button = $('<button type="button" class="btn" data-dismiss="modal">' + b.text + '</button>');
        button.addClass(b.secondary ? "btn-secondary" : "btn-primary");
        if(b.onclick) 
            button.on('click', b.onclick);
        buttons.append(button);
    }
    
    $("#mod").modal();
}

//Change the accessibility boolean of the story
function editorStoryAccessibleChange(element) {
    loadedStory.accessible = element.checked;
    editorDirty = true;
}

//Make all the up and down buttons of given class in a container disabled if they are the first or last respectively
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

//Set the input value to the property of the object specified by name, also set the handler to update the property on input change
function linkInputToProperty(object, name, input) {
    //Clear previous handlers
    input.off("change");
    
    input.val(object[name]);
    input.on("change", () => {
        editorDirty = true;
        object[name] = input.val();
    });
}

//Add the html element to edit the content to the container for the specified activity
function addContentElement(content, container, activity) {
    let content_div = $($("#template-content").html());
    
    //Add the correct elements based on the content type
    let item_div = content_div.find(".content-item");
    switch(content.type) {
        case "text": {
            let textarea = $(document.createElement("textarea"));
            textarea.addClass("form-control");
            textarea.attr("rows", "4");
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
            
            linkInputToProperty(content, "description", image_div.find("textarea"));
            
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
            
            
            linkInputToProperty(content, "description", video_div.find("textarea"));
            
            video_div.appendTo(item_div);
        } break;
    }
    
    //Side buttons to delete or move the content
    let del = content_div.find(".content-del");
    del.on("click", () => {
        removeFromArray(activity.contents, content);
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

//Add a new content to the activity and the respective elements to edit it
function editorNewContent(content, container, activity)
{
    editorDirty = true;
    activity.contents.push(content);
    addContentElement(content, container, activity);
}

//Get the color of the activity based on its mission index or its special attribute
function activityColor(a) {
    if(a.special) {
        return "#000000";
    } else if(a.mission_index == null) {
        return "#FFFFFF";
    } else {
        return loadedStory.missions[a.mission_index].color;
    }
}

//Add an output to the node and a connection if needed.
//The object's property will be updated automatically with the activity index or null
//when the node is connected or disconnected respectively
function makeOutput(object, property, node, color) {
    let output = node.addOutput({
        single: true, 
        color: color,
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
        let input = nodesArray[target_index].inputs[0];
        
        let c = new Connection(input, output);
        input.addConnection(c);
        output.addConnection(c);
    }
}

//Set all the node outputs based, 1 for normal activities, 2 for activities that can also be failed, 0 for the end activity.
function setNodeOutputs(activity, node) {
    let type = activity.input_type;
    let input = activity.input;
    
    if (activity.special != "end") {
        //Add the 1 default output.
        makeOutput(input, "next_index", node, "green");
        
        //Add the output for a wrong answer if needed
        if(input.wrong_next_index !== undefined) {
            makeOutput(input, "wrong_next_index", node, "red");
        }
    }
}

//Clear all the node outputs and then set them
function clearAndSetNodeOutputs(activity, node) {
    node.clearOutputs();
    setNodeOutputs(activity, node);
}

//Set the elements required to edit the case in which the player gives a wrong answer
function setWrongInputElement(activity, node) {
    let input = activity.input;
    
    let evaluation_type = input.evaluation_type;
    let wrong_div = $("#activity-input-wrong-div");
    if(evaluation_type != "correct") {
        wrong_div.toggle(false);
    } else {
        wrong_div.toggle(true);
        
        //Message displayed on wrong answer
        let wrong_message = $("#wrong-message");
        wrong_message.toggle(input.wrong_stay);
        
        let wrong_text = $("#wrong-text");
        if(input.wrong_stay)
            linkInputToProperty(input, "wrong_message", wrong_text);
        
        //Checkbox to decide if the player should continue trying or go the next activity in case of a wrong answer
        let wrong_checkbox = $("#wrong-stay");
        wrong_checkbox[0].checked = input.wrong_stay;
        wrong_checkbox.off();
        wrong_checkbox.on("change", (e) => {
            editorDirty = true;
            
            input.wrong_stay = wrong_checkbox[0].checked;
            wrong_message.toggle(input.wrong_stay);
            
            if(input.wrong_stay) {
                delete input.wrong_next_index;
                input.wrong_message = "";
                linkInputToProperty(input, "wrong_message", wrong_text);
            } else {
                delete input.wrong_message;
                input.wrong_next_index = null;
            }
            
            //if we already had values for next index we keep it in the new input object
            let old_next_index = input.next_index;
            node.clearOutputs();
            input.next_index = old_next_index;
            setNodeOutputs(activity, node);
        });
    }
}

//Set the elements required to edit the range or value for a correct number answer
function setNumberOption(element, option, checked) {
    element.find(".option-range").toggle(checked);
    element.find(".option-single").toggle(!checked);
    
    if(checked) {
        linkInputToProperty(option, "from", element.find(".option-from"));
        linkInputToProperty(option, "to", element.find(".option-to"));
    } else {
        let number = element.find(".option-number");
        number.val(option.from);
        
        number.off();
        number.on("change", (e) => {
            editorDirty = true;
            option.from = number.val();
            option.to = number.val();
        });
    }
}

//Set the elements required to edit the correct answers to an activity
function addCorrectOptionElement(activity, option) {
    let element;
    if(activity.input_type == "text") {
        element = $($("#template-option-text").html());
        let text = element.find(".option-text");
        linkInputToProperty(option, "text", text);
    } else {
        element = $($("#template-option-number").html());
        
        let range_checkbox = element.find(".option-range-checkbox");
        range_checkbox[0].checked = option.from != option.to;
        setNumberOption(element, option, range_checkbox[0].checked);
        
        range_checkbox.on("change", (e) => {
            editorDirty = true;
            let checked = e.target.checked;
            if(!checked) {
                option.to = option.from;
            }
            setNumberOption(element, option, checked);
        });
    }
    
    let points = element.find(".option-points");
    linkInputToProperty(option, "points", points);
    
    let del = element.find(".option-del");
    del.on("click", (e) => {   
        editorDirty = true;
        
        let options = activity.input.correct_options;
        removeFromArray(options, option);
        element.remove();
        
        $(".option-del").prop("disabled", options.length == 1);
    });
    
    $("#correct-options").append(element);
}

function setCorrectInputElement(activity) {
    let input = activity.input;
    
    let container = $("#activity-correct-div");
    if(input.evaluation_type != "correct") {
        container.toggle(false);
    } else {
        container.toggle(true);
        
        let options = $("#correct-options");
        options.empty();
        input.correct_options.forEach( (o) => {
            addCorrectOptionElement(activity, o);
        });
        $(".option-del").prop("disabled", input.correct_options.length == 1);
        
        let new_option = $("#correct-new");
        new_option.off();
        new_option.on("click", (e) => {
            editorDirty = true;
            
            let o = { points: 0 };
            if(activity.input_type == "text") {
                o.text = "";
            } else {
                o.from = 0;
                o.to = 0;
            }
            
            input.correct_options.push(o);
            addCorrectOptionElement(activity, o);
            
            $(".option-del").prop("disabled", input.correct_options.length == 1);
        });
    }
}

function setInputElement(activity, node)
{
    let type = activity.input_type;   
    
    let input_container = $("#activity-input-div");
    if(type == "none") {
        input_container.toggle(false);
    } else {
        input_container.toggle(true);
        
        //Style options
        $("#input-style-div div").each( (index, element) => {
            let div = $(element);
            div.toggle("input-style-" + type + "-div" == div.attr("id"));
            let select = div.find("select");
            select.val(activity.input.style || "");
            linkInputToProperty(activity.input, "style", select);
        });
    
        
        //Evaluation options
        let select = $("#input-evaluation-select");
        select.empty();
        select.off();
        
        let options = [ 
            { text: "Risposta qualsiasi", value: "any"},
            { text: "Risposta corretta", value: "correct"},
            { text: "Risposta valutata", value: "evaluator"},
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
            
            let evaluation_type = select.val();
            
            //if we already had values for next index we keep it in the new input object
            let old_next_index = activity.input.next_index;
            activity.input = {
                style: "",
                evaluation_type: evaluation_type,
                next_index: old_next_index
            };
            
            if(evaluation_type == "correct") {
                if(type == "text") {
                    activity.input.correct_options = [ { points : 0, text : "" } ];
                } else {
                    activity.input.correct_options = [ { points : 0, from : 0, to: 0 } ];
                }
                
                activity.input.wrong_stay = false;
                activity.input.wrong_next_index = null;
            }
            
            setCorrectInputElement(activity);
            setWrongInputElement(activity, node);
            clearAndSetNodeOutputs(activity, node);
        });
        
        setCorrectInputElement(activity);
        setWrongInputElement(activity, node);
    }
}

//Set the correct mission option as active based on the mission index
function refreshMissionOptions(options, activity) {
    options.find("button").each( (j, e) => {
        if(j == 0) {
            $(e).toggleClass("active", activity.mission_index == null);
        } else {
            $(e).toggleClass("active", (j - 1) == activity.mission_index);
        }
    });
}

//Open the modal window for the activity editor
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
            node.setColor(activityColor(activity));
            select.text("Nessuna missione");
            refreshMissionOptions(options, activity);
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
                node.setColor(activityColor(activity));
                select.text(m.name);
                refreshMissionOptions(options, activity);
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
        editorNewContent({type: "image", url:"", description: ""}, contents, activity);
        updateAllUpDownButtons(contents, ".content-up", ".content-down");
    });
    
    let add_video = editor.find(".add-video");
    add_video.off("click");
    add_video.on("click", () => {
        editorNewContent({type: "video", url:"", description: ""}, contents, activity);
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
                
                //if we already had values for next index we keep it in the new input object
                let old_next_index = activity.input.next_index;
                
                activity.input = {};
                if(type != "none") {
                    activity.input.evaluation_type = "any";
                }
                activity.input.next_index = old_next_index;
                
                setInputElement(activity, node);
                clearAndSetNodeOutputs(activity, node);
            }
        });
    });
    
    setInputElement(activity, node);
    
    //Don't show some elements if the activity is a begin or end activity
    $("#hide-input").toggle(activity.special ? false : true);
    $("#hide-mission").toggle(activity.special ? false : true);
    
    editor.modal();
}

//Update the property of an object when the activity at index has been deleted
function updateIndexAfterDelete(object, property, index) {
    if(object[property] !== null) {
        if(object[property] == index) {
            //Set null if the target has been deleted
            object[property] = null;
        } else if(object[property] > index) {
            //Decrement if the target has been shifted down in the array
            object[property] = object[property] - 1;
        }
    }
}

//Delete an activity
function deleteActivity(activity) {
    let index = loadedStory.activities.indexOf(activity);
    if(index != -1) {
        loadedStory.activities.splice(index, 1);
        nodesArray.splice(index, 1);
        
        loadedStory.activities.forEach( (a) => {
            updateIndexAfterDelete(a.input, "next_index", index);
            if(a.input.wrong_next_index !== undefined) {
                updateIndexAfterDelete(a.input, "wrong_next_index", index);
            }
        });
    }
}

//Paste an activity in the canvas
function editorPasteActivity() {
    if(copiedActivity) {
        editorDirty = true;
        
        let a = JSON.parse(copiedActivity);
        
        //Clear the mission
        a.mission_index = null;
        
        //Clear activity next indices
        if(a.input.next_index !== undefined) a.input.next_index = null;
        if(a.input.wrong_next_index !== undefined) a.input.wrong_next_index = null;
        a.position = getNextAvailablePoint();
        
        //Push the activity in the activities array and add a node for it
        loadedStory.activities.push(a);
        let node = addActivityNode(a);
        setNodeOutputs(a, node);
    }
}

//Add a node for an activity to the canvas
function addActivityNode(activity) {
    let n = new Node(activity.name, activity.position, {
        onCopy:  () => {
            copiedActivity = JSON.stringify(activity);
            $("#activity-paste").prop("disabled", false);
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
    
    if(activity.special)
        n.hideButtons();
    
    n.setColor(activityColor(activity));
    
    let modify = $('<button class="node-modify">Modifica attività</button>');
    modify.on("click", (e) => openActivityEditor(activity, n));
    n.body().append(modify);
    
    if(activity.special != "begin") {
        n.addInput({
            single: false
        });
    }
    
    nodesArray.push(n);
    
    return n;
}

//Create a new activity and add it to the story and the canvas
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
    let node = addActivityNode(activity);
    setNodeOutputs(activity, node);
}

//Paste a mission
function editorPasteMission() {
    if(copiedMission) {
        editorDirty = true;
        
        //Add the new mission
        let mission = JSON.parse(copiedMission.mission);
        let mission_index = loadedStory.missions.length;
        loadedStory.missions.push(mission);
        addMissionElement(mission);
        
        let new_base_index = loadedStory.activities.length;
        //Add the new activities
        copiedMission.activities.forEach( (a, i) => {
            let activity = JSON.parse(a.data);
            activity.mission_index = mission_index;
            let center = getCanvasCenter();
            activity.position.x += center.x - copiedMission.center.x + 20;
            activity.position.y += center.y - copiedMission.center.y + 20;
            loadedStory.activities.push(activity);
        });
        
        //Preserve the old connections that are internal to the mission
        for(let new_index = new_base_index; new_index < loadedStory.activities.length; new_index++) {
            let a = loadedStory.activities[new_index];
            
            let fixIndex = (property) => {
                if(a.input[property] !== undefined) {
                    let updated = false;
                    for(let other_index = 0; other_index < copiedMission.activities.length; other_index++) {
                        let other = copiedMission.activities[other_index];
                        //If the activity was connected to the other when copied
                        if(a.input[property] == other.old_index) {
                            //Update next index to the current index
                            a.input[property] = new_base_index + other_index;
                            updated = true;
                            break;
                        }
                    }
                    //If it's not connected to a node in the mission
                    if(!updated) {
                        a.input[property] = null;
                    }
                }
            };
            
            fixIndex("next_index");
            fixIndex("wrong_next_index");
        }
        
        //Add the nodes for the new activities
        for(let i = new_base_index; i < loadedStory.activities.length; i++) {
            let a = loadedStory.activities[i];
            addActivityNode(a);
        }
        //After we created all nodes we create all outputs and make the connections
        for(let i = new_base_index; i < loadedStory.activities.length; i++) {
            let a = loadedStory.activities[i];
            setNodeOutputs(a, nodesArray[i]);
        }
    }
}

//Delete a mission
function deleteMission(mission_div, mission) {
    mission_div.remove();
    
    let mission_index = loadedStory.missions.indexOf(mission);
    
    //Remove all activities of that mission
    for(let i = 0; i < nodesArray.length;) {
        let a = loadedStory.activities[i];
        let n = nodesArray[i];
        
        if(a.mission_index == mission_index) {
            n.remove();
        } else {
            i++; //Only increment if we did not remove
        }
    }
    
    //Remove the mission
    loadedStory.missions.splice(mission_index, 1);
    
    //Update all activities mission indices
    loadedStory.activities.forEach( (a) => {
        if(a.mission_index == mission_index) {
            a.mission_index = null;
        } else if(a.mission_index > mission_index) {
            a.mission_index--;
        }
    });
}

//Add an element for a mission
function addMissionElement(mission) {
    let mission_div = $($("#template-mission").html());
    
    //Name
    linkInputToProperty(mission, "name", mission_div.find(".mission-name"));
    
    //Color
    let color = mission_div.find(".mission-col");
    linkInputToProperty(mission, "color", color);
    color.on("change", () => {
        //Update the color of all nodes related to this mission
        for(let i = 0; i < loadedStory.activities.length; i++)
        {
            let a = loadedStory.activities[i];
            let n = nodesArray[i];
            
            let mission_index = loadedStory.missions.indexOf(mission);
            if(mission_index == a.mission_index) {
                n.setColor(color.val());
            }
        }
        
        mission_div.css("border-color", color.val());
    });
    mission_div.css("border-color", color.val());
    
    //Delete button
    let del = mission_div.find(".mission-del");
    del.on("click", () => {
        openModal({
            title: "Elimina missione",
            text: "Tutte le attività della missione saranno eliminate, procedere?",
            buttons: [ 
                {   
                    text: "Elimina", 
                    onclick: () => {
                        editorDirty = true;
                        deleteMission(mission_div, mission);
                    }
                },
                { 
                    text: "Annulla",
                    secondary: true
                }
            ]
        });
    });
    
    //Copy button
    let copy = mission_div.find(".mission-copy");
    copy.on("click", () => {
        copiedMission = {};
        copiedMission.mission = JSON.stringify(mission);
        copiedMission.activities = [];
        copiedMission.center = getCanvasCenter();
        
        let mission_index = loadedStory.missions.indexOf(mission);
        loadedStory.activities.forEach( (a, i) => {
            if(a.mission_index == mission_index) {
                copiedMission.activities.push( {
                    data: JSON.stringify(a),
                    old_index: i
                });
            }
        });
        
        $("#mission-paste").prop("disabled", false);
    });
    
    mission_div.appendTo("#editor-missions");
}

//Create a new mission for the story
function editorNewMission() {
    editorDirty = true;
    let mission = {
        name: "Nuova missione",
        color: "#EEEEEE"
    };
    loadedStory.missions.push(mission);
    addMissionElement(mission);
}

//Convert an RGB color in hex and an opacity value between 0 and 1 in a rgba(r,g,b,a) string
function convertHex(hex,opacity){
    hex = hex.replace('#','');
    let r = parseInt(hex.substring(0,2), 16);
    let g = parseInt(hex.substring(2,4), 16);
    let b = parseInt(hex.substring(4,6), 16);
    
    return 'rgba(' + r + ',' + g + ',' + b + ',' + opacity + ')';
}

//Update the preview of the story style
function updateStylePreview(style)
{
    //Story title
    let title = $("#preview-title");
    title.css("font-family", style.title_font);
    title.css("color", style.title_font_color);
    
    //Activity area
    let text = $("#preview-mission-title, #preview-activity-title, #preview-activity-text");
    text.css("font-family", style.text_font);
    text.css("color", style.text_font_color);
    
    let area = $("#preview-activity-area");
    area.css('background-color', convertHex(style.activity_area_color, style.activity_area_opacity));
    area.css('border-color', style.activity_area_border);
    
    //Buttons
    let button = $("#preview-button");
    button.css("background-color", style.buttons_color);
    button.css("color", style.buttons_text_color);
    
    //Background
    if(style.use_background_image) {
        $("#preview-body").css("background-color", 'transparent');
        if(style.background_image)
        {
            let url = 'url(\'' + style.background_image + '\')';
            $("#preview-body").css("background-image", url);
        }
    } else {
        $("#preview-body").css("background-color", style.background_color);
        $("#preview-body").css("background-image", '');
    }
    
    //Chat preview
    let chat_color;
    let chat_text_color;
    switch (style.chat_theme) {
        case 'dark':
            chat_color = '#575b5f';
            chat_text_color = 'white';
            break;
        case 'light':
            chat_color = 'white';
            chat_text_color = 'black';
            break;
        case 'pink':
            chat_color = '#9932CC';
            chat_text_color = 'white';
            break;
    }
    $("#preview-chat-header").css("color", chat_text_color);
    $("#preview-chat-header").css("background-color", chat_color);
}

//Open the modal window to edit the style of the story
function openStyleEditor() {
    let style = loadedStory.style;
    linkInputToProperty(style, "title_font",       $("#style-title-font"));
    linkInputToProperty(style, "title_font_color", $("#style-title-color"));
    
    linkInputToProperty(style, "text_font",        $("#style-text-font"));
    linkInputToProperty(style, "text_font_color",  $("#style-text-color"));
    
    linkInputToProperty(style, "activity_area_color",   $("#style-main-color"));
    linkInputToProperty(style, "activity_area_border",  $("#style-main-border-color"));
    linkInputToProperty(style, "activity_area_opacity", $("#style-main-opacity"));
    
    linkInputToProperty(style, "buttons_color",      $("#style-buttons-color"));
    linkInputToProperty(style, "buttons_text_color", $("#style-buttons-text-color"));
    
    linkInputToProperty(style, "chat_theme", $("#style-chat-theme"));
    
    //Background
    linkInputToProperty(style, "background_color", $("#style-background-color"));
    
    $("#style-background-color-div").toggle(!style.use_background_image);
    $("#style-background-image-div").toggle(style.use_background_image);
    
    let background_checkbox = $("#style-has-background");
    background_checkbox[0].checked = style.use_background_image;
    background_checkbox.off();
    background_checkbox.on("change", (e) => {
        editorDirty = true;
        style.use_background_image = background_checkbox[0].checked;
        $("#style-background-color-div").toggle(!style.use_background_image);
        $("#style-background-image-div").toggle(style.use_background_image);
    });
    
    //Upload of background image
    let upload = $("#style-background-upload");
    upload.off();
    upload[0].value = null; //clear the current value of the input
    upload.on("change", () => {
        editorDirty = true;
        let image_url = URL.createObjectURL(upload[0].files[0]);
        uploadFileAndStoreURL(upload[0].files[0], style, "background_image", (url) => {
            updateStylePreview(style);
        });
    });
    
    $("#style-modal").find("select, input").on("change", () => {
        updateStylePreview(style);
    });
    
    //make sure color and range inputs update also while dragging
    $("#style-modal").find('input[type="color"], input[type="range"]').on("input", (e) => {
        $(e.target).change();
    });
    
    updateStylePreview(style);
}

//Clear the selection of the current story
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

//Create nodes for all the existing activities and connect them
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

//Open the story with the selected id and initialize the editor and the node canvas
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
            $("#editor-accessible").prop("checked", loadedStory.accessible);
            
            //Story name
            linkInputToProperty(loadedStory, "name", $("#editor-name"));
            
            //Load missions
            $("#editor-missions").empty();
            loadedStory.missions.forEach((m) => {
                addMissionElement(m);
            });
            
            //Load canvas and nodes
            setCanvasOffsetAndScale(loadedStory.canvas_offset, loadedStory.canvas_scale);
            loadActivities();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            
        }
    });
}

//Add an element for a story in the story lister and initialize the dropdown buttons
function addStoryElement(s) {
    let story_div = $($("#template-story").html());
    
    //Story item
    let item = story_div.find(".list-group-item");
    item.text(s.name);
    let openStory = function () {
        if(selectedStoryButton) {
            selectedStoryButton.removeClass("active");
        }
        selectedStoryButton = item;
        item.addClass("active");
        selectStory(s.id);
    };
    
    item.on("click", () => {
        if(editorDirty) {
            openModal({
                title: "Modifiche non salvate",
                text: "Salvare le modifiche effettuate?",
                buttons: [ 
                    {   
                        text: "Salva", 
                        onclick: () => {
                            saveSelectedStory();
                            openStory();
                        }
                    },
                    { 
                        text: "Scarta", 
                        onclick: () => {
                            editorDirty = false;
                            openStory();
                        }
                    },
                    { 
                        text: "Annulla",
                        secondary: true
                    }
                ]
            });   
        } else {
            openStory();
        }
    });
    
    if(loadedStory && loadedStory.id == s.id) {
        selectedStoryButton = item;
        item.addClass("active");
    }
    
    //QR code button
    let qr = story_div.find(".story-qr");
    qr.on('click', () => {
        let qr = $(document.createElement('div'));
        qr.qrcode({
            'text' : window.location.origin + '/player?id=' + s.id,  // users will be redirected to this URL when scanning the QR-Code
            'size' : 150                                             // image width in pixel
        });
        
        openModal({
            title: "QR Code",
            text: 'QR Code per la storia <b>' + s.name + '</b>:',
            body: qr,
            buttons: [
                {   
                    text: "Scarica",
                    onclick: () => {                        
                        let canvas = qr.find('canvas')[0];
                        let dataUrl = canvas.toDataURL();
                        let a = document.createElement('a');
                        a.href = dataUrl;
                        a.download = 'qrcode.png';
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                    }
                },
                { 
                    text: "Annulla",
                    secondary: true
                }
            ]
        });
    });
    
    //Delete button
    let del = story_div.find(".story-del");
    del.on("click", (event) => {
        openModal( {
            title: "Eliminazione",
            text: 'Sicuro di voler eliminare la storia: <b>' + s.name + '</b>?',
            buttons: [ 
                {   
                    text: "Elimina", 
                    onclick: () => {
                        actionOnStory(s.id, 'delete');
                    }
                },
                { 
                    text: "Annulla",
                    secondary: true
                }
            ]
        });
    });
    
    //Archive/Pubblish button
    let swap = story_div.find(".story-swap");
    swap.on("click", () => actionOnStory(s.id, s.published ? "archive" : "publish"));
    let swap_publish = '<img class="story-icon" src="/public/images/icons/publish.png">Pubblica';
    let swap_archive = '<img class="story-icon" src="/public/images/icons/archive.png">Archivia';
    swap.html(s.published ? swap_archive : swap_publish);
    
    //Duplicate button
    let dup = story_div.find(".story-dup");
    dup.on("click", () => actionOnStory(s.id, "duplicate"));
    
    if(s.published) {
        $('#stories-published').append(story_div);
    } else {
        $('#stories-archived').append(story_div);
    }
}

//Upload a file and store the returned URL in object[name], also call the callback with the URL as parameter if given
function uploadFileAndStoreURL(file, object, name, callback)
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
            if(callback) {
                callback(data.url);
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
           
        }
    });
}

//Update the story lister
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
            
        }
    });
}

//Create a new story
function newStory(published)
{
    let story = {
        name: "Nuova storia",
        accessible: false,
        style: {
            title_font: "All The Roll",
            title_font_color: "#FFFFFF",
            text_font: "Serif",
            text_font_color: "#000000",
            activity_area_color: "#FFFFFF",
            activity_area_opacity: 1,
            buttons_color: "#FFFFFF",
            buttons_text_color: "#000000",
            chat_theme: "pink",
            use_background_image: false,
            background_color: "#9932CC",
            background_image: "",
            activity_area_border: "#9932CC"
        },
        published: published,
        canvas_offset: { x: 0, y: 0 },
        canvas_scale: 1.0,
        missions: [],
        activities: [
            {
                name: "Inizio",
                contents: [],
                mission_index: null,
                special: "begin",
                input_type: "none",
                input: {
                    evaluation_type: "none",
                    next_index: null
                },
                position: {x: 50, y: 50}
            },
            {
                name: "Fine",
                contents: [],
                mission_index: null,
                special: "end",
                input_type: "none",
                input: {
                    evaluation_type: "none",
                    next_index: null
                },
                position: {x: 250, y: 50}
            }
        ]
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
            
        }
    });
}

//Save the currently selected story
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
               
            }
        });
    }
}

//Execute the specified action on a story: duplicate, archive, pubblish or delete
function actionOnStory(id, action) {
    let action_url = action == "delete" ? "" : ("/" + action);
    let method = action == "delete" ? "DELETE" : "POST";
    
    $.ajax({
        url: '/stories/' + id + action_url,
        type: method,
        
        success: function(data) {
            if(action == "delete" && loadedStory && loadedStory.id == id) {
                clearSelectedStory();
            }
            updateStories();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            
        }
    });
}

//Load stories
$(() => {
    updateStories();
});

//Creates an alert if the user is leaving the page with unsaved changes
$(window).bind('beforeunload', function() {
   if(editorDirty)
   {
       return 'Ci sono modifiche non salvate, procedere ugualmente?';
   }
});

