let bigInt = require('snarkjs').bigInt

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

function serialize_f1(num) {
    if (num.length == 3)  {
        return num_to_hex(num[0], num[1], num[2])
    } else if (num.length == 2) {
        return num_to_hex(num[0], num[1])
    } else {
        throw "F1 element must either have two or three components"
    }
}

function serialize_f2(num) {
    return serialize_f1(num[0]) + serialize_f1(num[1]) + num_to_hex(num[2][0], 64) + num_to_hex(num[2][1], 64)
}

function serialize_groth16_proof(vk, proof) {
    // vk_a + vk_b + vk_g + vk_d + proof_a + proof_b + proof_c + ics + public_inputs
    debugger
    let vk_serialized = serialize_f1(vk['vk_alfa_1']) + serialize_f2(vk['vk_beta_2']) + serialize_f2(vk['vk_gamma_2']) + serialize_f2(vk['vk_delta_2']);

    let proof_serialized = serialize_f1(proof['pi_a']) + serialize_f2(proof['pi_b']) + serialize_f1(proof['pi_c'])

   let serialized_num_inputs = zeroFill(vk['IC'].length, 8, true);
   let serialized_ics = "";
   let serialized_inputs = "";

   for (let i = 0; i < vk['IC'].length; i++) {
       serialized_ics += serialize_f1(vk['IC'][i]);

       if (i < vk['IC'].length - 1) {
           serialized_inputs += num_to_hex(proof['publicSignals'][i]);
       }
   }

    let inputs_serialized = serialized_num_inputs + serialized_ics + serialized_inputs;

    return vk_serialized + proof_serialized + inputs_serialized;
}

module.exports = serialize_groth16_proof;
