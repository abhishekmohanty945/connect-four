import OntropySigner from "./Schnorrkel/OntropySigner";
import { MerkleTreeWrapper } from "./utils/merkletree-wrapper";

export interface NewGameMetadata {
  gameId: string;
  roundId: string;
  signer: OntropySigner;
}

export interface EndGameMetadata {
  merkleTree: MerkleTreeWrapper;
  leafMetadata: Buffer[];
}

export interface ProofOutput {
  merkleTree: MerkleTreeWrapper;
  proofs: Proof[];
  leafData: Buffer;
}

export interface RoundResult {
  gameId: string;
  roundId: string;
  players: {
    player: string;
    outcome: string;
  }[];
}

export type SchnorrSignature = string;
export type Player = string;
export type Outcome = string;
export type EncodedMsg = string;
export type Proof = string;
