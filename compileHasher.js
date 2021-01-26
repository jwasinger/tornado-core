// Generates Hasher artifact at compile-time using Truffle's external compiler
// mechanism
const path = require('path')
const fs = require('fs')
const genContract = require('circomlib/src/mimcsponge_gencontract.js')
const assert = require('assert')

// where Truffle will expect to find the results of the external compiler
// command
const outputPath = path.join(__dirname, 'build', 'Hasher.json')

function evm384 (path) {
  const deployed = fs.readFileSync(path).toString().replace('\n', '').replace('0x', '')
  let length = deployed.length.toString(16)
  assert(length.length == 4)
  return '0x38600c60003961' + length + '6000f3' + deployed
}

function main () {
  const contract = {
    contractName: 'Hasher',
    abi: genContract.abi,
    bytecode: evm384('./mimc_cipher.hex')
    //bytecode: genContract.createCode('mimcsponge', 220)
  }

  fs.writeFileSync(outputPath, JSON.stringify(contract))
}

main()
