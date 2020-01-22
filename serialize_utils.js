const bigInt = require('snarkjs').bigInt

function reverse_hex_str_endianess(str) {
    let elements = []

    if (str.length % 2 != 0) {
        throw "bad length";
    }

    for (let i = 0; i < str.length; i += 2) {
        elements.push(str.slice(i, i + 2));
    }

    elements.reverse()
    return elements.join("")
}

// TODO separate the endianess flipping out of this function
function zeroFill(str, length, append) {
    let zero_fill_len = length - str.length
    let result;

    if (str.length > length) {
        throw "tried to zero-fill a string that was longer than the target length... probably indicates an overflow"
    }
    
    if (append) {
        result = str + "0".repeat(zero_fill_len)
    } else {
        result = "0".repeat(zero_fill_len) + str
    }

    if (!append) {
        return reverse_hex_str_endianess(result);
    } else {
        return result;
    }
}

function num_to_hex(num) {
    let hex_num = bigInt(num).toString(16)
    return zeroFill(hex_num, 64)
}

module.exports = {
    reverse_hex_str_endianess,
    zeroFill,
    num_to_hex
}
