var selectedStoryButton = null;
var loadedStory = null;
var editorDirty = false;

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

function addActivityElement(activity, container, mission) {
    let activity_div = $($("#template-activity").html());
    
    linkInputToProperty(activity, "name", activity_div.find(".activity-name"));
    
    let del = activity_div.find(".activity-del");
    del.on("click", () => {
        let index = mission.activities.indexOf(activity);
        if(index != -1) {
            mission.activities.splice(index, 1);
        }
        activity_div.remove();
        editorDirty = true;
        
        updateAllUpDownButtons(container, ".activity-up", ".activity-down");
    });
    
    let copy = activity_div.find(".activity-copy");
    copy.on("click", () => {
    });
    
    
    let i = mission.activities.indexOf(activity);
    
    let up = activity_div.find(".activity-up");
    up.prop("disabled", i == 0);
    up.on("click", () => {
        editorDirty = true;
        
        let array = mission.activities;
        let index = array.indexOf(activity);
        
        let tmp = array[index];
        array[index] = array[index - 1];
        array[index - 1] = tmp;
        
        //order the widgets in the editor
        activity_div.insertBefore(activity_div.prev());
        
        updateAllUpDownButtons(container, ".activity-up", ".activity-down");
    });
    
    let down = activity_div.find(".activity-down");
    down.prop("disabled", i == mission.activities.length - 1);
    down.on("click", () => {
        editorDirty = true;
        
        let array = mission.activities;
        let index = array.indexOf(activity);
        
        //order the activities in the story object
        let tmp = array[index];
        array[index] = array[index + 1];
        array[index + 1] = tmp;
        
        //order the widgets in the editor
        activity_div.insertAfter(activity_div.next());
        
        updateAllUpDownButtons(container, ".activity-up", ".activity-down");
    });
    
    let contents = activity_div.find(".contents-div");
    activity.contents.forEach((c) => addContentElement(c, contents, activity));
    
    let add_text = activity_div.find(".add-text");
    add_text.on("click", () => {
        editorNewContent({type: "text", text:""}, contents, activity);
        updateAllUpDownButtons(contents, ".content-up", ".content-down");
    });
    
    let add_image = activity_div.find(".add-image");
    add_image.on("click", () => {
        editorNewContent({type: "image", url:""}, contents, activity);
        updateAllUpDownButtons(contents, ".content-up", ".content-down");
    });
    
    let add_video = activity_div.find(".add-video");
    add_video.on("click", () => {
        editorNewContent({type: "video", url:""}, contents, activity);
        updateAllUpDownButtons(contents, ".content-up", ".content-down");
    });
    
    activity_div.appendTo(container);
}

function colorFromMissionIndex(i) {
    if(!i) {
        return "#FFFFFF";
    } else {
        return loadedStory.missions[i].color;
    }
}

function addActivityNode(activity) {
    let n = new Node(activity.name, activity.position, {
        onCopy:  () => {
            console.log("Copied");
        }, 
        
        onDelete: () => {
            editorDirty = true;
            removeFromArray(loadedStory.activities, activity);
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
    
    n.addOutput({ 
        single: true, 
        onConnect: (c) => {
            console.log("Output Connect!");
        },
        onDisconnect: (c) => {
            console.log ("Output Disconnect!");
        }
    });
    
    n.addInput({
        single: false,
        onConnect: (c) => console.log("Input Connect!"),
        onDisconnect: (c) => console.log ("Input Disconnect!"),
    });
}

function editorNewActivity() {
    editorDirty = true;
    let activity = {
        name: "Nuova attività",
        contents: [],
        mission_index: null, //Assigned to no mission when created
        position: getNextAvailablePoint()
    };
    
    console.log(activity);
    loadedStory.activities.push(activity);
    addActivityNode(activity);
}


function addMissionElement(mission) {
    let mission_div = $($("#template-mission").html());
    
    linkInputToProperty(mission, "name", mission_div.find(".mission-name"));
    linkInputToProperty(mission, "color", mission_div.find(".mission-col"));
    
    let del = mission_div.find(".mission-del");
    del.on("click", () => {
        let index = loadedStory.missions.indexOf(mission);
        if(index != -1) {
            loadedStory.missions.splice(index, 1);
        }
        
        mission_div.remove();
        editorDirty = true;
    });
    
    let copy = mission_div.find(".mission-copy");
    copy.on("click", () => {
        console.log("copy");
    });
    
    /*
    let activities_div = mission_div.find(".activities-div");
    mission.activities.forEach((a) => addActivityElement(a, activities_div, mission));
    
    let new_activity = mission_div.find(".new-activity");
    new_activity.on("click", () => editorNewActivity(mission, activities_div));
    */
    
    
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
            
            clearCanvas();
            setCanvasOffsetAndScale(loadedStory.canvas_offset, loadedStory.canvas_scale);
            loadedStory.activities.forEach((a) => {
                addActivityNode(a);
            });
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
            console.log(data.url);
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
    console.log("Action: " + action + " on story: " + id);
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