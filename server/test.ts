// 1v1 game against computer
// no network usage

import { EncodedMsg, RoundResult } from "../sdk/src/interface";
import { OntropySDK } from "../sdk/src/ontropy-sdk";
import OntropySigner from "../sdk/src/Schnorrkel/OntropySigner";

const playerEthereumAddress = "0xabcd";
const ontropy = new OntropySDK(playerEthereumAddress);

const gameData = ontropy.startNewGame();
console.log("New game metadata: ", gameData);

// opponent's signer
const opponentSigner = new OntropySigner(0);
ontropy.addPlayer(opponentSigner.getPublicKey().buffer);

// start game and structure result of round 1
const roundResult: RoundResult = {
  gameId: gameData.gameId,
  roundId: gameData.roundId,
  players: [
    {
      player: gameData.signer.getPublicKey().toHex(),
      outcome: "10",
    },
    {
      player: opponentSigner.getPublicKey().toHex(),
      outcome: "10",
    },
  ],
};

console.log("Round result: ", roundResult);

// encode message
const encodedMessage: EncodedMsg = ontropy.encodeMessage(roundResult);

// exchange nonces without network
const noncesThisRound = [
  gameData.signer.getPublicNonces(),
  opponentSigner.getPublicNonces(),
];
console.log("Nonces collected for this round: ", noncesThisRound);

// create player signature
const ontropySignature = ontropy.createOntropySignature(
  gameData.signer,
  noncesThisRound,
  encodedMessage
);
console.log("player signature output: ", ontropySignature);

// create opponent signature
const opponentOntropySignature = ontropy.createOntropySignature(
  opponentSigner,
  noncesThisRound,
  encodedMessage
);

// exchange signatures
const signaturesThisRound = [
  ontropySignature.signature,
  opponentOntropySignature.signature,
];
console.log("signatures collected this round: ", signaturesThisRound);

// get combined public key
const combinedPublicKey = ontropy.getGroupPublicKey(gameData.signer);
console.log("combined public key: ", combinedPublicKey);

// compute schnorr signature
const schnorrSignature = ontropy.computeSchnorrSignature(
  signaturesThisRound,
  combinedPublicKey,
  ontropySignature
);

console.log("Schnorr Signature: ", schnorrSignature);

// skipped step: verification

// start a new round and repeat the process of signature generation
// to get a new schnorr signature for the results of this round
const newRoundId = ontropy.startNewRound(gameData.gameId);

// when you are done with the game session, let ontropy know and get back the merkle tree along with the leaf data
const merkleData = ontropy.endGame();
console.log("Game ended");
console.log("final merkle data: ", merkleData.leafMetadata);
