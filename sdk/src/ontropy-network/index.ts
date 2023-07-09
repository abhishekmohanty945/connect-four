import { PublicNonces, Signature } from "../Schnorrkel";
import OntropySigner from "../Schnorrkel/OntropySigner";
import { EncodedMsg, Proof, SchnorrSignature } from "../interface";
import {
  _exchangeKeys,
  _exchangeNonces,
  _exchangeSchnorrSignatures,
  _exchangeSignatures,
  _verifyMerkleProof,
  _verifySchnorrSignature,
} from "./ontropy-network";

export class OntropyNetwork {
  readonly PLAYER_ADDRESS;

  constructor(playerAddress: string) {
    this.PLAYER_ADDRESS = playerAddress;
  }

  public async buyIn(amount: string) {
    return true;
  }

  public async buyOut(amount: string) {
    return true;
  }

  public async getBalance() {
    return "";
  }

  public async exchangeKeys(key: Buffer): Promise<Buffer[]> {
    return _exchangeKeys(key);
  }

  public async exchangeNonces(key: OntropySigner): Promise<PublicNonces[]> {
    return _exchangeNonces(key);
  }

  public async exchangeSignatures(signature: Signature): Promise<Signature[]> {
    return _exchangeSignatures(signature);
  }

  public async exchangeSchnorrSignatures(
    signature: SchnorrSignature,
    encodedMsg: string
  ): Promise<[SchnorrSignature[], EncodedMsg[]]> {
    return _exchangeSchnorrSignatures(signature, encodedMsg);
  }

  public async verifySchnorrSignature(
    signature: SchnorrSignature,
    msgHash: string,
    groupAddress: string
  ): Promise<boolean> {
    return _verifySchnorrSignature(signature, msgHash, groupAddress);
  }

  public async verifyMerkleProof(
    root: string,
    leaf: Buffer,
    proof: Proof[]
  ): Promise<boolean> {
    return _verifyMerkleProof(root, leaf, proof);
  }
}
