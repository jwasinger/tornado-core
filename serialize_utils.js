const bigInt = require('snarkjs').bigInt
const { fq_toMontgomery } = require("./bn128.js")

function reverse_hex_str_endianess(str) {
    let elements = []

    if (str.length % 2 != 0) {
        console.trace("bad length");
        throw ""
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
        debugger
        console.trace("tried to zero-fill a string that was longer than the target length... probably indicates an overflow")
        throw ""
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

function zero_fill(str, length, append) {
    let zero_fill_len = length - str.length
    let result;

    if (str.length > length) {
        console.trace("tried to zero-fill a string that was longer than the target length... probably indicates an overflow")
        throw ""
    }
    
    if (append) {
        result = str + "0".repeat(zero_fill_len)
    } else {
        result = "0".repeat(zero_fill_len) + str
    }

    return result
}

function num_to_hex(num) {
    return zeroFill(BigInt(num).toString(16), 64)
}

function num_to_hex_fq(num) {
    // zero fill but don't reverse the endianess.  need to refactor this code
    let num_be_hex = zero_fill(BigInt(num).toString(16), 64)

    let hex_num = fq_toMontgomery(BigInt('0x'+num_be_hex)).toString(16)
    return zeroFill(hex_num, 64)
}

module.exports = {
    reverse_hex_str_endianess,
    zeroFill,
    num_to_hex_fq,
    num_to_hex
}
