const mask = BigInt('0xffffffffffffffffffffffffffffffff')
const inv = BigInt('211173256549385567650468519415768310665')
const r_squared = BigInt('3096616502983703923843567936837374451735540968419076528771170197431451843209')
const field_modulus = BigInt('0x30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47')

function mulmodmont(x,y) {
    let result512 = x * y
    let k0 = (inv * result512) & mask
    let res2 = ((k0 * field_modulus) + result512) >> BigInt(128)
    let k1 = (res2 * inv) & mask
    let res3 = ((k1 * field_modulus) + res2) >> BigInt(128)
    return res3
}

function fq_toMontgomery(num) {
    let mont_form = mulmodmont(num, r_squared);
    return mont_form
}

function le_to_be(str) {
    if (str.startsWith("0x")) {
        str = str.slice(2)
    }

    let slices = []
    for (let i = 0; i < str.length - 1; i += 2) {
        slices.push(str.slice(i, i + 2))
    }

    slices.reverse()
    return slices.join("")
}

let be = le_to_be('ce035d81260fc7a9aa7989c61a4ace24e12ec921c24471961f9fa18e3957db27')
let mont_form_be = mulmodmont(BigInt('0x' + be), r_squared).toString(16)

if (mont_form_be.length == 63) {
    mont_form_be = "0" + mont_form_be
} else if (mont_form_be.length != 64) {
    console.log("invalid length from montgomery conversion", mont_form_be.length)
}

debugger
console.log(le_to_be(mont_form_be));

module.exports = { fq_toMontgomery }
