import { BarretenbergWasm } from '@noir-lang/barretenberg/dest/wasm';
import { SinglePedersen } from '@noir-lang/barretenberg/dest/crypto/pedersen';
import { acir_from_bytes } from '@noir-lang/noir_wasm';
import { setup_generic_prover_and_verifier, create_proof, verify_proof, StandardExampleProver, StandardExampleVerifier } from '@noir-lang/barretenberg/dest/client_proofs';
import { serialise_public_inputs } from '@noir-lang/aztec_backend';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { expect } from 'chai';
import { randomInt } from 'crypto';

const MAX_FIELD = 281474976710655.;

type PreimgHashProofInput = {
    x: number;
    y: number;
    out_x: string;
}

type DarkForestProofIput = {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    salt: number;
    hash_x1_y1: string;
    hash_x2_y2: string;
}

const numberToPaddedHex = (num: number) => {
  const numAsHexStr = num.toString(16);
  let padded_number_hex = numAsHexStr.length %2 == 0 ? "0x" + numAsHexStr : "0x0" + numAsHexStr;
  return Buffer.from(serialise_public_inputs([padded_number_hex]));
}

function path_to_uint8array(path: string) {
    let buffer = readFileSync(path);
    return new Uint8Array(buffer);
}

const bufferToHexString = (hash: Buffer) => '0x' + hash.toString('hex');


describe('Preimg tests using typescript wrapper', function() {
    let barretenberg: BarretenbergWasm;
    let pedersen: SinglePedersen;
    let acir: any;
    let prover: StandardExampleProver;
    let verifier: StandardExampleVerifier;

    before(async () => {
        barretenberg = await BarretenbergWasm.new();
        await barretenberg.init()
        pedersen = new SinglePedersen(barretenberg);

        let acirByteArray = path_to_uint8array(resolve(__dirname, '../circuits/preimg-hash/build/p.acir'));
        acir = acir_from_bytes(acirByteArray);
        [prover, verifier] = await setup_generic_prover_and_verifier(acir);
    });

    const createProofPreImgInput = (x: number, y: number): PreimgHashProofInput => {
      const xHashed = pedersen.compressInputs([numberToPaddedHex(x), numberToPaddedHex(y)]);
      console.log(xHashed);

      const hashAsStr = `0x` + xHashed.toString('hex');

      return {
        x,
        y,
        out_x: hashAsStr,
      }
    }

    it('verify hash pre img', async () => {
      const proofInput = createProofPreImgInput(1, 2);

      console.log('proofInput', proofInput)
      const proof = await create_proof(prover, acir, proofInput);
      console.log('proof: ' + proof.toString('hex'));

      const verified = await verify_proof(verifier, proof);

      expect(verified).eq(true)

    });

});

describe.only('DarkForest tests using typescript wrapper', function() {
    let barretenberg: BarretenbergWasm;
    let pedersen: SinglePedersen;
    let acir: any;
    let prover: StandardExampleProver;
    let verifier: StandardExampleVerifier;

    before(async () => {
        barretenberg = await BarretenbergWasm.new();
        await barretenberg.init()
        pedersen = new SinglePedersen(barretenberg);

        let acirByteArray = path_to_uint8array(resolve(__dirname, '../circuits/dark-forest/build/p.acir'));
        acir = acir_from_bytes(acirByteArray);
        [prover, verifier] = await setup_generic_prover_and_verifier(acir);
    });

    const createProofInputDarkForest = (x1: number, y1: number, x2: number, y2: number): DarkForestProofIput => {

      const salt = randomInt(MAX_FIELD);
      const hash_x1_y1 = bufferToHexString(pedersen.compressInputs([numberToPaddedHex(x1), numberToPaddedHex(y1), numberToPaddedHex(salt)]));
      const hash_x2_y2 = bufferToHexString(pedersen.compressInputs([numberToPaddedHex(x2), numberToPaddedHex(y2), numberToPaddedHex(salt)]));

      return {
        x1,
        y1,
        x2,
        y2,
        salt,
        hash_x1_y1,
        hash_x2_y2,
      }
    }

    it('DarkForest test', async () => {
      const proofInput = createProofInputDarkForest(1, 2, 3, 4);

      console.log('proofInput', proofInput)
      const proof = await create_proof(prover, acir, proofInput);
      console.log('proof: ' + proof.toString('hex'));

      const verified = await verify_proof(verifier, proof);

      expect(verified).eq(true)

    });

    it('DarkForest should fail', async () => {
      const proofInput = createProofInputDarkForest(0, 0, 8, 8);

      console.log('proofInput', proofInput)
      const proof = await create_proof(prover, acir, proofInput);
      console.log('proof: ' + proof.toString('hex'));

      const verified = await verify_proof(verifier, proof);

      expect(verified).eq(false)

    });

});
