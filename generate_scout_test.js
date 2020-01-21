const fs = require('fs')
const MerkleTree = require('./lib/MerkleTree')
const circomlib = require('circomlib')
const snarkjs = require('snarkjs')
const bigInt = snarkjs.bigInt
const websnarkUtils = require('websnark/src/utils')
const crypto = require('crypto')
const hasherImpl = require('./lib/MiMC')
const hasher = new hasherImpl()
const buildGroth16 = require('websnark/src/groth16')

const rbigint = (nbytes) => snarkjs.bigInt.leBuff2int(crypto.randomBytes(nbytes))
const pedersenHash = (data) => circomlib.babyJub.unpackPoint(circomlib.pedersenHash.hash(data))[0]

const TREE_DEPTH = 20;
const prefix = "test";

const circuit = require('./build/circuits/withdraw.json')
const proving_key = fs.readFileSync('./build/circuits/withdraw_proving_key.bin').buffer

let mixer = {}

let deposit_tree = new MerkleTree(
    TREE_DEPTH,
    null,
    prefix)

let withdrawal_tree = new MerkleTree(
    TREE_DEPTH,
    null,
    prefix)

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

function serialize_merkle_proof(proof) {
    let root = zeroFill(bigInt(proof.root).toString(16), 64)
    let witness_count = zeroFill(bigInt(proof.path_elements.length).toString(16), 16, true)
    let path_elements = "";
    let selectors = "";

    for (let i = 0; i < proof.path_elements.length; i++) {
        path_elements += zeroFill(bigInt(proof.path_elements[i]).toString(16), 64)
        selectors += zeroFill(bigInt(proof.path_index[i]).toString(16), 2)
    }

    let leaf = zeroFill(bigInt(proof.element).toString(16), 64);
    return root + witness_count + selectors + path_elements + leaf;
}

async function get_deposit_proof(index) {
    let withdrawal_root = await withdrawal_tree.root()
    let deposit_root = await deposit_tree.root()

    let mixer_root = hasher.hash(null, bigInt(deposit_root), bigInt(withdrawal_root));
    mixer_root = zeroFill(bigInt(mixer_root).toString(16), 64);

    withdrawal_root = zeroFill(bigInt(withdrawal_root).toString(16), 64);
    deposit_proof = await deposit_tree.path(index)
    deposit_proof = serialize_merkle_proof(deposit_proof)

    return mixer_root + withdrawal_root + deposit_proof;
}

async function generate_withdrawal_proof(deposit, commitment_index) {
  // Decode hex string and restore the deposit object
  //let buf = Buffer.from(note.slice(2), 'hex')
  // let deposit = generateDeposit(bigInt.leBuff2int(buf.slice(0, 31)), bigInt.leBuff2int(buf.slice(31, 62)))

  groth16 = await buildGroth16()

  // Compute merkle proof of our commitment
  // const { root, path_elements, path_index } = await generateMerkleProof(contract, deposit)
  const deposit_index = deposit_tree.getIndexByElement(deposit.commitment)

  // assert that the nullifier hash is not in the withdraw tree

  // insert the nullifier hash into the withdrawal tree

  let nullifier_hash_index = withdrawal_tree.totalElements
  await withdrawal_tree.insert(deposit.nullifierHash)

  const withdraw_merkle_proof = await withdrawal_tree.path(nullifier_hash_index);
  const deposit_proof = await deposit_tree.path(deposit_index)

  // Prepare circuit input
  const input = {
    // Public snark inputs
    root: bigInt(deposit_proof.root),
    nullifierHash: deposit.nullifierHash,
    /*
    recipient: bigInt(recipient),
    relayer: bigInt(relayer),
    fee: bigInt(fee),
    refund: bigInt(refund),
    */

    // Private snark inputs
    nullifier: deposit.nullifier,
    secret: deposit.secret,
    pathElements: deposit_proof.path_elements,
    pathIndices: deposit_proof.path_index,
  }

  console.log('Generating SNARK proof')
  console.time('Proof time')
  const proofData = await websnarkUtils.genWitnessAndProve(groth16, input, circuit, proving_key)
  debugger
  console.timeEnd('Proof time')
}

function generateDeposit() {
  let deposit = {
    secret: bigInt("146454714220269882021034249230549840417444180517621996217387968827117019017"),
    nullifier: bigInt("193635023168929246146232520005846616617464778638251361296279116026781503437"),
  }

  const preimage = Buffer.concat([deposit.nullifier.leInt2Buff(31), deposit.secret.leInt2Buff(31)])
  deposit.commitment = pedersenHash(preimage)
  deposit.nullifierHash = pedersenHash(deposit.nullifier.leInt2Buff(31))

  return deposit
}

async function main() {
    let deposit = generateDeposit();

    const empty_root = await deposit_tree.root()
    await deposit_tree.insert(deposit.commitment)

    /*
    const proof = await deposit_tree.path(0)
    serialized_m_proof = serialize_merkle_proof(proof);
    */

    let serialized_deposit_proof = await get_deposit_proof(0)
    console.log("deposit proof")
    console.log(serialized_deposit_proof)

    let withdrawal_proof = await generate_withdrawal_proof(deposit, 0);
    console.log("withdrawal proof")

    debugger

    // serialize a proof
}

main()
