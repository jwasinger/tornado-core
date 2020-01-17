const MerkleTree = require('./lib/MerkleTree')
const circomlib = require('circomlib')
const snarkjs = require('snarkjs')
const bigInt = snarkjs.bigInt
const websnarkUtils = require('websnark/src/utils')
const crypto = require('crypto')
const hasherImpl = require('./lib/MiMC')
const hasher = new hasherImpl()

const rbigint = (nbytes) => snarkjs.bigInt.leBuff2int(crypto.randomBytes(nbytes))
const pedersenHash = (data) => circomlib.babyJub.unpackPoint(circomlib.pedersenHash.hash(data))[0]

const TREE_DEPTH = 20;
const prefix = "test";

let mixer = {}

let deposit_tree = new MerkleTree(
    TREE_DEPTH,
    null,
    prefix)

let withdrawal_tree = new MerkleTree(
    TREE_DEPTH,
    null,
    prefix)

function zeroFill(str, length) {
    if (str.length == length) {
        return str;
    } else if (str.length > length) {
        throw "tried to zero-fill a string that was longer than the target length... probably indicates an overflow"
    }

    let zero_fill_len = length - str.length

    return "0".repeat(zero_fill_len) + str
}

function serialize_merkle_proof(proof) {
    let root = zeroFill(bigInt(proof.root).toString(16), 64)
    let witness_count = zeroFill(bigInt(proof.path_elements.length).toString(16), 16)
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
    mixer_root = bigInt(mixer_root).toString(16)

    withdrawal_root = bigInt(withdrawal_root).toString(16)
    deposit_proof = await deposit_tree.path(index)
    deposit_proof = serialize_merkle_proof(deposit_proof)

    return mixer_root + withdrawal_root + deposit_proof;
}

function generateDeposit() {
  let deposit = {
    secret: rbigint(31),
    nullifier: rbigint(31),
  }
  const preimage = Buffer.concat([deposit.nullifier.leInt2Buff(31), deposit.secret.leInt2Buff(31)])
  deposit.commitment = pedersenHash(preimage)
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
    debugger

    // serialize a proof
}

main()
