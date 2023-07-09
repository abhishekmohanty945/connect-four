import OntropySigner from "../Schnorrkel/OntropySigner";
import {
  EncodedMsg,
  EndGameMetadata,
  NewGameMetadata,
  Outcome,
  Player,
  Proof,
  ProofOutput,
  RoundResult,
  SchnorrSignature,
} from "../interface";
import { MerkleTreeWrapper } from "../utils/merkletree-wrapper";
import {
  _computeSchnorrSignature,
  _createOntropySignature,
  _generateMerkleProof,
  _generateOntropyKey,
  _getGroupPublicKey,
  _startNewGame,
  _startNewRound,
} from "./ontropy-sdk";
import { OntropyNetwork } from "../ontropy-network";
import { Key, PublicNonces, Signature, SignatureOutput } from "../Schnorrkel";
import { ethers } from "ethers";

export class OntropySDK {
  readonly PLAYER_WALLET_ADDRESS: string;

  public network: OntropyNetwork;
  public ontropyKeysInSession: OntropySigner[] = [];
  public merkleTree: MerkleTreeWrapper;
  public leafMetadata: Buffer[] = [];
  public otherPlayerKeys: Buffer[] = [];
  public groupPublicAddress: string = "";

  /**
   * Initializes a new instance of the OntropySDK class.
   *
   * @param playerAddress - The player's wallet address.
   */
  constructor(playerAddress: string) {
    this.PLAYER_WALLET_ADDRESS = playerAddress;
    this.network = new OntropyNetwork(playerAddress);
    this.merkleTree = new MerkleTreeWrapper([]);
  }

  /**
   * Buys into the Ontropy network.
   *
   * @param amount - The amount to buy in.
   * @returns A promise that resolves to a boolean indicating the success of the operation.
   */
  public buyIn(amount: string): Promise<boolean> {
    return this.network.buyIn(amount);
  }

  /**
   * Gets the balance of the player.
   *
   * @returns A promise that resolves to a string representing the player's balance.
   */
  public getBalance(): Promise<string> {
    return this.network.getBalance();
  }

  /**
   * Lists other players in the network.
   *
   * @returns An array of other players.
   */
  public listOtherPlayers() {
    return this.otherPlayerKeys;
  }

  /**
   * Generates an Ontropy key.
   *
   * @returns A OntropySigner instance representing the Ontropy key.
   */
  public generateOntropyKey(): OntropySigner {
    const key = _generateOntropyKey();
    this.ontropyKeysInSession.push(key);
    return key;
  }

  /**
   * Gets the group public key.
   *
   * @param signer - The signer to get the public key from.
   * @returns The group public key.
   */
  public getGroupPublicKey(signer: OntropySigner) {
    const combinedPublicKey = _getGroupPublicKey(
      signer.getPublicKey(),
      this.otherPlayerKeys
    );
    const px = ethers.utils.hexlify(
      ethers.utils.arrayify(combinedPublicKey.buffer).slice(1, 33)
    );
    this.groupPublicAddress = "0x" + px.slice(px.length - 40, px.length);
    return combinedPublicKey;
  }

  /**
   * Buys out from the Ontropy network.
   *
   * @param amount - The amount to buy out.
   * @returns A promise that resolves to a boolean indicating the success of the operation.
   */
  public buyOut(amount: string) {
    return this.network.buyOut(amount);
  }

  /**
   * Starts a new game.
   *
   * @returns A NewGameMetadata instance representing game's metadata.
   */
  public startNewGame(): NewGameMetadata {
    return _startNewGame();
  }

  /**
   * Exchanges Ontropy keys and returns keys of all players in the group.
   *
   * @param signer - The signer to exchange keys with.
   * @returns A promise that resolves to an array of keys of all players in the group.
   */
  public async exchangeOntropyKeys(signer: OntropySigner): Promise<Buffer[]> {
    const publicKey = signer.getPublicKey().buffer;
    const otherPlayers = await this.network.exchangeKeys(publicKey);
    this.otherPlayerKeys = otherPlayers;
    return otherPlayers;
  }

  public async addPlayer(key: Buffer) {
    this.otherPlayerKeys.push(key);
  }

  /**
   * Ends a game.
   */
  public endGame(): EndGameMetadata {
    const endGameMetadata: EndGameMetadata = {
      merkleTree: this.merkleTree,
      leafMetadata: this.leafMetadata,
    };

    // Clear the data from memory
    this.merkleTree.clear();
    this.leafMetadata = [];

    // Optionally, you can also delete the otherPlayerKeys and groupPublicAddress properties if needed
    this.otherPlayerKeys = [];
    this.groupPublicAddress = "";

    return endGameMetadata;
  }

  /**
   * Starts a new round.
   */
  public startNewRound(gameId: string) {
    return _startNewRound(gameId);
  }

  /**
   * Encodes a message containing the results of a game round.
   *
   * @param results - A map of players to their outcomes.
   * @returns A string representing the encoded message.
   */
  public encodeMessage(results: RoundResult): string {
    return JSON.stringify(results);
  }

  /**
   * Creates an Ontropy signature for the round results.
   *
   * @param signer - The signer to use for creating the signature.
   * @param nonces - The public nonces.
   * @param msg - The encoded message.
   * @returns A SignatureOutput instance representing the signature and other metadata.
   */
  public createOntropySignature(
    signer: OntropySigner,
    nonces: PublicNonces[],
    msg: EncodedMsg
  ): SignatureOutput {
    return _createOntropySignature(msg, signer, nonces, this.otherPlayerKeys);
  }

  /**
   * Exchanges signatures with the network.
   *
   * @param signatureOutput - The output of the signature creation.
   * @returns A promise that resolves to an array of all signatures in the group.
   */
  public async exchangeSignatures(
    signatureOutput: SignatureOutput
  ): Promise<Signature[]> {
    return this.network.exchangeSignatures(signatureOutput.signature);
  }

  /**
   * Computes a Schnorr signature from the group signatures.
   *
   * @param signatures - The group signatures.
   * @param combinedPublicKey - The combined public key of the group.
   * @param signatureOutput - The output of the signature creation.
   * @returns A promise that resolves to the computed Schnorr signature.
   */
  public computeSchnorrSignature(
    signatures: Signature[],
    combinedPublicKey: Key,
    signatureOutput: SignatureOutput
  ) {
    return _computeSchnorrSignature(
      signatures,
      combinedPublicKey,
      signatureOutput.challenge.buffer
    );
  }

  /**
   * Exchanges nonces with the network.
   *
   * @param signer - The signer to exchange nonces with.
   * @returns A promise that resolves to an array of all public nonces in the group.
   */
  public async exchangeNonces(signer: OntropySigner): Promise<PublicNonces[]> {
    return await this.network.exchangeNonces(signer);
  }

  /**
   * Verifies a schnorr signature.
   *
   * @param signature - The schnorr signature to verify.
   * @param encodedMsg - The encoded message that was signed.
   * @returns A promise that resolves to a boolean indicating the validity of the signature.
   */
  public async verifySchnorrSignature(
    signature: SchnorrSignature,
    encodedMsg: EncodedMsg
  ): Promise<boolean> {
    const msgHash = ethers.utils.solidityKeccak256(["string"], [encodedMsg]);
    return this.network.verifySchnorrSignature(
      signature,
      msgHash,
      this.groupPublicAddress
    );
  }

  /**
   * Exchanges Schnorr signatures with the network.
   *
   * @param signature - The Schnorr signature to exchange.
   * @param encodedMsg - The encoded message that was signed.
   * @returns A promise that resolves to an array of all Schnorr signatures and their corresponding encoded messages in the group.
   */
  public async exchangeSchnorrSignatures(
    signature: SchnorrSignature,
    encodedMsg: EncodedMsg
  ): Promise<[SchnorrSignature[], EncodedMsg[]]> {
    return this.network.exchangeSchnorrSignatures(signature, encodedMsg);
  }

  /**
   * Generates a Merkle proof for the Schnorr signatures and their corresponding encoded messages.
   *
   * @param signatures - The Schnorr signatures.
   * @param encodedMsgs - The encoded messages.
   * @returns A ProofOutput instance representing the Merkle proof and other metadata.
   */
  public generateMerkleProof(
    signatures: SchnorrSignature[],
    encodedMsgs: EncodedMsg[]
  ): ProofOutput {
    const result = _generateMerkleProof(
      signatures,
      encodedMsgs,
      this.merkleTree
    );
    this.merkleTree = result.merkleTree;
    this.leafMetadata.push(result.leafData);
    return result;
  }

  /**
   * Verifies a Merkle proof.
   *
   * @param proof - The Merkle proof to verify.
   * @param leaf - The leaf to verify the proof against.
   * @returns A promise that resolves to a boolean indicating the validity of the proof.
   */
  public async verifyMerkleProof(proof: Proof[], leaf: Buffer) {
    return this.network.verifyMerkleProof(this.merkleTree.root, leaf, proof);
  }
}
