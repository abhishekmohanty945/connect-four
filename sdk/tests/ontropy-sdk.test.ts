import { OntropySDK } from "../src/ontropy-sdk";
import OntropySigner from "../src/Schnorrkel/OntropySigner";
import { Challenge, FinalPublicNonce, Key, Signature } from "../src/Schnorrkel";
import { Outcome, Player } from "../src/interface";
import { ethers } from "ethers";

describe("OntropySDK", () => {
  let mockSigner: OntropySigner;
  const otherPlayer = new OntropySigner(0);
  const otherPlayers = [otherPlayer.getPublicKey().buffer];
  const mockPlayerAddress = "0xabcd";
  const mockAmount = "100";
  const ontropy = new OntropySDK(mockPlayerAddress);

  test("should buy into the network", async () => {
    const buyInSpy = jest
      .spyOn(ontropy.network, "buyIn")
      .mockResolvedValue(true);
    const result = await ontropy.buyIn(mockAmount);

    expect(buyInSpy).toHaveBeenCalledWith(mockAmount);
    expect(result).toBe(true);
  });

  test("should get balance of the player", async () => {
    const getBalanceSpy = jest
      .spyOn(ontropy.network, "getBalance")
      .mockResolvedValue(mockAmount);
    const result = await ontropy.getBalance();

    expect(getBalanceSpy).toHaveBeenCalled();
    expect(result).toBe(mockAmount);
  });

  test("should start the game", () => {
    const result = ontropy.startNewGame();
    mockSigner = result.ontropyKey;
    expect(mockSigner).toBeInstanceOf(OntropySigner);
    expect(typeof result.gameId).toBe("string");
    expect(typeof result.roundId).toBe("string");
  });

  test("should exchange ontropy keys", async () => {
    const exchangeKeysSpy = jest
      .spyOn(ontropy.network, "exchangeKeys")
      .mockResolvedValue(otherPlayers);
    const result = await ontropy.exchangeOntropyKeys(mockSigner);

    expect(exchangeKeysSpy).toHaveBeenCalledWith(
      mockSigner.getPublicKey().buffer
    );
    expect(result).toEqual(otherPlayers);
    expect(ontropy.otherPlayerKeys).toEqual(otherPlayers);
  });

  // test("should encode message", () => {
  //   const mockResults = new Map<Player, Outcome>();
  //   mockResults.set(mockSigner.getPublicKey().toHex(), "score:10");
  //   const key = new Key(otherPlayers[0]);
  //   mockResults.set(key.toHex(), "score:20");
  //   const result = ontropy.encodeMessage(mockResults);
  //   expect(result).toBe(
  //     JSON.stringify([
  //       { key: mockSigner.getPublicKey().toHex(), outcome: "score:10" },
  //       { key: key.toHex(), outcome: "score:20" },
  //     ])
  //   );
  // });

  test("should update player keys", () => {
    const newKey = ontropy.generateOntropyKey();
    expect(newKey).toBeInstanceOf(OntropySigner);
    expect(ontropy.ontropyKeysInSession).toContain(newKey);
  });

  test("should create ontropy signature", () => {});

  test("should exchange signatures", async () => {
    const mockSignature = new Signature(Buffer.from("mock signature"));
    const mockChallenge = new Challenge(Buffer.from(""));
    const mockPublicNonce = new FinalPublicNonce(Buffer.from(""));
    const exchangeSignaturesSpy = jest
      .spyOn(ontropy.network, "exchangeSignatures")
      .mockResolvedValue([mockSignature]);
    const result = await ontropy.exchangeSignatures({
      signature: mockSignature,
      challenge: mockChallenge,
      finalPublicNonce: mockPublicNonce,
    });
    expect(exchangeSignaturesSpy).toHaveBeenCalledWith(mockSignature);
    expect(result).toEqual([mockSignature]);
  });

  test("should generate group public key", () => {
    const groupPublicKey = ontropy.getGroupPublicKey(mockSigner);
    expect(groupPublicKey).toBeDefined();
    expect(ontropy.groupPublicAddress).toBe(
      "0x" +
        groupPublicKey
          .toHex()
          .slice(
            groupPublicKey.toHex().length - 40,
            groupPublicKey.toHex().length
          )
    );
  });

  test("should compute Schnorr signature", async () => {});

  test("should verify Schnorr Signature", async () => {
    const mockSignature = "mock signature";
    const mockEncodedMsg = "mock message";
    const verifySchnorrSignatureSpy = jest
      .spyOn(ontropy.network, "verifySchnorrSignature")
      .mockResolvedValue(true);
    const result = await ontropy.verifySchnorrSignature(
      mockSignature,
      mockEncodedMsg
    );
    expect(verifySchnorrSignatureSpy).toHaveBeenCalledWith(
      mockSignature,
      ethers.utils.solidityKeccak256(["string"], [mockEncodedMsg]),
      ontropy.groupPublicAddress
    );
    expect(result).toBe(true);
  });

  test("should exchange Schnorr Signatures", async () => {
    const mockSignature = "mock signature";
    const mockEncodedMsg = "mock message";
    const exchangeSchnorrSignaturesSpy = jest
      .spyOn(ontropy.network, "exchangeSchnorrSignatures")
      .mockResolvedValue([[mockSignature], [mockEncodedMsg]]);
    const result = await ontropy.exchangeSchnorrSignatures(
      mockSignature,
      mockEncodedMsg
    );
    expect(exchangeSchnorrSignaturesSpy).toHaveBeenCalledWith(
      mockSignature,
      mockEncodedMsg
    );
    expect(result).toEqual([[mockSignature], [mockEncodedMsg]]);
  });

  test("should generate merkle proof", () => {});

  test("should verify merkle proof", async () => {
    const mockProofs = ["mock proof 1", "mock proof 2"];
    const mockLeaf = Buffer.from("mock leaf");
    const verifyMerkleProofSpy = jest
      .spyOn(ontropy.network, "verifyMerkleProof")
      .mockResolvedValue(true);
    const result = await ontropy.verifyMerkleProof(mockProofs, mockLeaf);
    expect(verifyMerkleProofSpy).toHaveBeenCalledWith(
      ontropy.merkleTree.root,
      mockLeaf,
      mockProofs
    );
    expect(result).toBe(true);
  });

  test("should start a new round", () => {
    const startNewRoundSpy = jest.spyOn(ontropy, "startNewRound");
    ontropy.startNewRound();
    expect(startNewRoundSpy).toHaveBeenCalled();
  });

  test("should end game", () => {
    const endGameSpy = jest.spyOn(ontropy, "endGame");
    ontropy.endGame();
    expect(endGameSpy).toHaveBeenCalled();
  });
});
