//Widget LCD
function setCharAt(str,index,chr) {
    if(index > str.length-1) return str;
    return str.substring(0,index) + chr + str.substring(index+1);
}

function onLCDButtonClick(index, up) {
    let input = $("#input-num");
    let str = String(input.val()).padStart(4, "0");
    let new_char = (Number(str.charAt(index)) + (up ? 1 : 9)) % 10;
    let new_str = setCharAt(str, index, String(new_char));
    
    input.val(new_str);
}

function onLCDNumberChange() {
    let input = $("#input-num");
    let val = Number(input.val());
    val = Math.max(val, 0);
    val = val % 10000;
    input.val(String(val).padStart(4, "0"));
}
   
//Widget scanner
$(document).on('change', '.scan-immagine-input', function () {
    let src = (window.URL ? URL : webkitURL).createObjectURL($('#input-immagine')[0].files[0]);
    $('#scan-window').css({
        'background-image': 'url(' + src + ')',
        'height': '50vh',
        'background-position': 'center',
        'background-repeat': 'no-repeat',
        'background-size': 'contain'
    });

    lineAnimation();
    blinkWord('#o-word p');
    blinkWord('#k-word p');
//    $('#scan-line').remove();
//    $('#scan-window').append('<div id="scan-line"></div>')
});

//Make the notification mark blink
function blinkWord(selector) {
    var element = $(selector);
    setInterval(function () {
        element.fadeIn(1000, function () {
            element.fadeOut(1000, function () {
                element.fadeIn(1000);
            });
        });
    }, 2000);
}

$(document).on('click', '.widget-scan-label', function () {
    //Button like behaviour
    $(this).css('border-style', 'inset');
    setTimeout(function () { $('.widget-scan-label  ').css('border-style', 'outset') }, 150);
});

function lineAnimation() {
    $('#scan-line').remove();
    $('#scan-window').append('<div id="scan-line"></div>')
    var reverse = false;
    var line = $('#scan-line');
    var pos = line.offset().left;
    var start = pos;
    var end_pos = pos + $('#scan-window table').width() - 5;
    setInterval(function () {
        if (reverse) {
            pos -= 1;
            line.css('left', pos + 'px');
            if (line.offset().left < start) {
                reverse = false;
            }
        } else {
            pos += 1;
            line.css('left', pos + 'px');
            if (line.offset().left > end_pos) {
                reverse = true;
            }
        }
    }, 10);

}