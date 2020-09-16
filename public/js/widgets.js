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
    