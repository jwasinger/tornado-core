let bigInt = require('snarkjs').bigInt

const { num_to_hex, reverse_hex_str_endianess, zeroFill } = require('./serialize_utils.js')

function serialize_f1(num) {
    if (num.length == 3)  {
        return num_to_hex(num[0]) + num_to_hex(num[1]) + num_to_hex(num[2])
    } else if (num.length == 2) {
        return num_to_hex(num[0]) + num_to_hex(num[1])
    } else {
        throw "F1 element must either have two or three components"
    }
}

function serialize_f2(num) {
    return serialize_f1(num[0]) + serialize_f1(num[1]) + num_to_hex(num[2][0], 64) + num_to_hex(num[2][1], 64)
}

function serialize_groth16_proof(vk, proof) {
    // vk_a + vk_b + vk_g + vk_d + proof_a + proof_b + proof_c + ics + public_inputs
    let vk_serialized = serialize_f1(vk['vk_alfa_1']) + serialize_f2(vk['vk_beta_2']) + serialize_f2(vk['vk_gamma_2']) + serialize_f2(vk['vk_delta_2']);

    let proof_serialized = serialize_f1(proof['pi_a']) + serialize_f2(proof['pi_b']) + serialize_f1(proof['pi_c'])

   hex_num_ic = bigInt(vk['IC'].length).toString(16)

   // TODO: de-hack :)
   if (hex_num_ic.length == 1) {
       hex_num_ic = '0' + hex_num_ic
   }

   let serialized_num_inputs = zeroFill(hex_num_ic, 8, true);
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
