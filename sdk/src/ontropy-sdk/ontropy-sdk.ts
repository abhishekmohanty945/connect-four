import { ethers } from "ethers";
import Schnorrkel, {
  Key,
  PublicNonces,
  Signature,
  SignatureOutput,
} from "../Schnorrkel";
import OntropySigner from "../Schnorrkel/OntropySigner";
import {
  EncodedMsg,
  NewGameMetadata,
  ProofOutput,
  SchnorrSignature,
} from "../interface";
import { MerkleTreeWrapper } from "../utils/merkletree-wrapper";
import { generateGameId, generateRoundId } from "../utils";

export const _generateOntropyKey = (): OntropySigner => {
  const KeyPair = new OntropySigner(0);
  return KeyPair;
};

export const _startNewGame = (): NewGameMetadata => {
  const gameId = generateGameId();
  const roundId = generateRoundId(gameId);
  const ontropyKey = _generateOntropyKey();
  return {
    gameId: gameId,
    roundId: roundId,
    signer: ontropyKey,
  };
};

export const _startNewRound = (gameId: string): string => {
  return generateRoundId(gameId);
};

export const _getGroupPublicKey = (key: Key, otherKeys: Buffer[]): Key => {
  const keyObjects: Key[] = otherKeys.map((key) => new Key(key));
  return Schnorrkel.getCombinedPublicKey(keyObjects.concat(key));
};

export const _createOntropySignature = (
  msg: string,
  signer: OntropySigner,
  nonces: PublicNonces[],
  otherKeys: Buffer[]
): SignatureOutput => {
  const publicKeys = otherKeys.map((key) => new Key(key));
  return signer.multiSignMessage(
    msg,
    publicKeys.concat(signer.getPublicKey()),
    nonces
  );
};

export const _computeSchnorrSignature = (
  signatures: Signature[],
  combinedPublicKey: Key,
  challenge: Buffer
): string => {
  const sSummed = Schnorrkel.sumSigs(signatures);
  const px = ethers.utils.hexlify(combinedPublicKey.buffer.slice(1, 33));
  const parity = combinedPublicKey.buffer[0] - 2 + 27;
  const abiCoder = new ethers.utils.AbiCoder();
  return abiCoder.encode(
    ["bytes32", "bytes32", "bytes32", "uint8"],
    [px, challenge, sSummed.buffer, parity]
  );
};

export const _generateMerkleProof = (
  signatures: SchnorrSignature[],
  encodedMsgs: EncodedMsg[],
  merkleTree: MerkleTreeWrapper
): ProofOutput => {
  const dataHash = ethers.utils.solidityKeccak256(
    ["string", "string"],
    [signatures, encodedMsgs]
  );
  const dataHashArray = ethers.utils.arrayify(dataHash);
  const dataHashBuffer = Buffer.from(dataHashArray.buffer);
  merkleTree.addLeaves([dataHashBuffer]);
  const proof = merkleTree.generateProof(dataHashBuffer);
  return {
    merkleTree: merkleTree,
    proofs: proof,
    leafData: dataHashBuffer,
  };
};
