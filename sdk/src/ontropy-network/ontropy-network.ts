import { PublicNonces, Signature } from "../Schnorrkel";
import OntropySigner from "../Schnorrkel/OntropySigner";
import { EncodedMsg, Proof, SchnorrSignature } from "../interface";

export const _exchangeKeys = (key: Buffer): Buffer[] => {
  // todo keys from other players
  return [Buffer.from("")];
};

export const _exchangeNonces = (signer: OntropySigner): PublicNonces[] => {
  const nonce = signer.getPublicNonces();
  // todo nonces from other players
  return [nonce];
};

export const _exchangeSignatures = (signature: Signature): Signature[] => {
  // todo signatures from other players
  return [signature];
};

export const _exchangeSchnorrSignatures = (
  signature: SchnorrSignature,
  encodedMsg: string
): [SchnorrSignature[], EncodedMsg[]] => {
  // todo schnorr signatures from each group
  return [[signature], [encodedMsg]];
};

export const _verifySchnorrSignature = (
  signature: SchnorrSignature,
  msgHash: string,
  groupAddress: string
): boolean => {
  // todo solidity contract verification
  return true;
};

export const _verifyMerkleProof = (
  root: string,
  leaf: Buffer,
  proof: Proof[]
): boolean => {
  // todo solidity contract verification
  return true;
};
