import Emitter from 'tiny-emitter';
import Grid from './grid.js';
import HumanPlayer from './human-player.js';
import OnlinePlayer from './online-player.js';
import AIPlayer from './ai-player.js';
import Chip from './chip.js';

// A game between two players; the same Game instance is re-used for successive
// rounds
class Game extends Emitter {

  constructor({ grid = new Grid({ columnCount: 7, rowCount: 6 }), players = [], debug = false } = {}) {
    super();
    // The two-dimensional array representing the entire game grid
    this.grid = grid;
    // The list of all players for this game
    this.players = players;
    // The type of the current game (e.g. '1P', '2P', or 'online'); this is
    // reset to null when the game ends
    this.type = null;
    // The type of the current/last game; unlike this.type, this does not reset
    // when the game ends
    this.lastType = null;
    // The current player is null when a game is not in progress
    this.currentPlayer = null;
    // Whether or not the game is in progress
    this.inProgress = false;
    // The chip above the grid that is about to be placed
    this.pendingChip = null;
    // The winning player of the game
    this.winner = null;
    // The player who requests to end the game or start a new one
    this.requestingPlayer = null;
    // Keep track of the columns where chips are placed in debug mode (extremely
    // useful for creating new unit tests from real games)
    if (debug) {
      this.debug = true;
      this.columnHistory = [];
      this.activityHistory = [];
    } else {
      this.debug = false;
    }
    this.sdk = new window.ontropy.OntropySDK();
    this.gameData = this.sdk.startNewGame();
    this.opponentSigner = this.sdk.createSigner();
    this.sdk.addPlayer(this.opponentSigner.getPublicKey().buffer);
    this.schnorrSignature = "";
    this.encodeMessage = "";
    this.turns = 0;
    this.gameEnded = false;
    this.transactionLink = "";
  }

  startGame({ startingPlayer } = {}) {
    if (startingPlayer) {
      this.currentPlayer = startingPlayer;
    } else {
      this.currentPlayer = this.players[0];
    }
    this.inProgress = true;
    this.emit('game:start');
    this.startTurn();

    // ontropy.startnewgame
  }

  // End the game without resetting the grid
  endGame() {
    this.gameEnded = true;
    this.inProgress = false;
    this.currentPlayer = null;
    this.pendingChip = null;
    this.emit('game:end');
    this.type = null;
    if (this.debug) {
      this.columnHistory.length = 0;
      this.activityHistory.length = 0;
    }
    // ontropy.endgame() here
  }

  // Reset the game and grid completely without starting a new game (endGame
  // should be called somewhere before this method is called)
  resetGame() {
    this.winner = null;
    this.grid.resetGrid();
  }

  // Initialize or change the current set of players based on the specified game
  // type;
  setPlayers({ gameType, players = [], localPlayer = null }) {
    // Instantiate new players as needed (if user is about to play the first game
    // or if the user is switching modes)
    if (this.players.length === 0) {
      if (gameType === '1P') {
        // If user chose 1-Player mode, the user will play against the AI
        this.players.push(new HumanPlayer({ name: 'Human', color: 'red' }));
        this.players.push(new AIPlayer({ name: 'Computer', color: 'black' }));
      } else if (gameType === '2P') {
        // If user chooses 2-Player mode, the user will play against another
        // human
        this.players.push(new HumanPlayer({ name: 'Human 1', color: 'red' }));
        this.players.push(new HumanPlayer({ name: 'Human 2', color: 'blue' }));
      } else if (gameType === 'online' && players.length > 0 && localPlayer) {
        // If user chooses Online mode, the user will play against another human
        // on another machine
        this.players.push(...players.map((player) => {
          if (player.color === localPlayer.color) {
            return new HumanPlayer(player);
          } else {
            return new OnlinePlayer(player);
          }
        }));
      }
    } else if (gameType !== this.lastType) {
      // If user switches game type (e.g. from 1-Player to 2-Player mode),
      // recreate set of players
      this.players.length = 0;
      this.setPlayers({ gameType });
      return;
    }
    this.type = gameType;
    this.lastType = gameType;
  }

  // Retrieve the player that isn't the given player
  getOtherPlayer(basePlayer = this.currentPlayer) {
    return this.players.find((player) => player.color !== basePlayer.color);
  }

  // Start the turn of the current player
  startTurn() {
    this.pendingChip = new Chip({ player: this.currentPlayer });
    if (this.currentPlayer.getNextMove) {
      this.currentPlayer.getNextMove({ game: this }).then((nextMove) => {
        this.emit('async-player:get-next-move', {
          player: this.currentPlayer,
          nextMove
        });
      });
    }
  }

  // End the turn of the current player and switch to the next player
  endTurn() {
    if (this.inProgress) {
      // Switch to next player's turn
      this.currentPlayer = this.getOtherPlayer(this.currentPlayer);
      this.turns = this.turns + 1;
      this.startTurn();
    }
  }

  // Insert the current pending chip into the columns array at the given index
  placePendingChip({ column }) {
    let chip_row = this.grid.placeChip({
      chip: this.pendingChip,
      column
    });
    let activity = `${chip_row}${column}`;
    this.emit('player:place-chip', this.grid.lastPlacedChip);
    if (this.debug) {
      this.columnHistory.push(activity);
      // The column history will only be logged on non-production sites, so we
      // can safely disable the ESLint error
      // eslint-disable-next-line no-console
      // console.log(this.columnHistory.join(', '));
      if(this.columnHistory.length % 2 === 0){
        let playerTwoMove = this.columnHistory[this.columnHistory.length-1];
        let playerOneMove = this.columnHistory[this.columnHistory.length-2];
        // console.log("playerone move: ", playerTwoMove)

        this.activityHistory.push(
          {
            "gameId": this.gameData.gameId,
            "roundId": this.gameData.roundId,
            "players": [
              {
                "player": this.gameData.signer.getPublicKey().toHex(),
                "outcome": playerOneMove
              },
              {
                "player": this.opponentSigner.getPublicKey().toHex(),
                "outcome": playerTwoMove
              }
            ]
          }
        );
        let roundResult = this.activityHistory[this.activityHistory.length-1];
        console.log("Result for this round: ");
        console.log(roundResult);

        // TODO: Encoded message here
        this.encodedMessage = this.sdk.encodeMessage(roundResult);
        // console.log(encodedMessage);
        // Nonce for this round here
        let noncesThisRound = [
          this.gameData.signer.getPublicNonces(),
          this.opponentSigner.getPublicNonces()
        ];
        console.log("Nonces collected for this round: ");
        console.log(noncesThisRound[0].kPublic.toHex());
        console.log(noncesThisRound[1].kPublic.toHex());

        // ontropySignature here
        const ontropySignature = this.sdk.createOntropySignature(
          this.gameData.signer,
          noncesThisRound,
          this.encodedMessage
        );
        console.log("player signature output: ");
        console.log(ontropySignature.signature.toHex());

        // opponentOntropySignature
        const opponentOntropySignature = this.sdk.createOntropySignature(
          this.opponentSigner,
          noncesThisRound,
          this.encodedMessage
        );

        // signaturesThisRound
        const signaturesThisRound = [
          ontropySignature.signature,
          opponentOntropySignature.signature
        ];
        console.log("signatures collected this round:");
        console.log(signaturesThisRound[0].toHex());
        console.log(signaturesThisRound[1].toHex());
        // combinedPublicKey
        const combinedPublicKey = this.sdk.getGroupPublicKey(this.gameData.signer);
        console.log("combined public key: ");
        console.log(combinedPublicKey.toHex());
        // schnorrSignature here
        this.schnorrSignature = this.sdk.computeSchnorrSignature(
          signaturesThisRound,
          combinedPublicKey,
          ontropySignature
        );
        
        console.log("Round Proof generated: ", this.schnorrSignature);
        this.gameData.roundId = this.sdk.startNewRound(this.gameData.gameId);
      }
    }
    this.pendingChip = null;
    // Check for winning connections (i.e. four in a row)
    this.checkForWin();
    // Check if the grid is completely full
    this.checkForTie();
    // If the above checks have not ended the game, continue to next player's
    // turn
    this.endTurn();
  }

  // Check if the game has tied, and end the game if it is
  checkForTie() {
    if (this.grid.checkIfFull()) {
      this.emit('game:declare-tie');
      this.endGame();
    }
  }

  // Determine if a player won the game with four chips in a row (horizontally,
  // vertically, or diagonally)
  checkForWin() {
    if (!this.grid.lastPlacedChip) {
      return;
    }
    const connections = this.grid.getConnections({
      baseChip: this.grid.lastPlacedChip,
      minConnectionSize: Game.winningConnectionSize
    });
    if (connections.length > 0) {
      // Mark chips in only the first winning connection, and only mark the
      // first four chips of this connection (since only a connect-four is
      // needed to win
      connections[0].length = Game.winningConnectionSize;
      connections[0].forEach((chip) => {
        chip.winning = true;
      });
      this.winner = this.grid.lastPlacedChip.player;
      this.winner.score += 1;
      this.emit('game:declare-winner', this.winner);
      this.endGame();
    }
  }

  // Apply the given server game JSON to the current game instance, taking into
  // account which player is the local (human) player and which player is the
  // online player
  restoreFromServer({ game, localPlayer = {} }) {
    this.inProgress = game.inProgress;
    this.players.length = 0;

    this.setPlayers({
      gameType: 'online',
      players: game.players,
      localPlayer
    });
    // Remove the event listener for any leftover (unresolved)
    // OnlinePlayer.getNextMove() promise
    this.off('online-player:receive-next-move');
    this.off('online-player:receive-next-nonce');
    this.off('online-player:receive-next-signature');

    this.currentPlayer = this.players.find((player) => player.color === game.currentPlayer);
    this.requestingPlayer = this.players.find((player) => player.color === game.requestingPlayer);

    this.grid.restoreFromServer({
      grid: game.grid,
      players: this.players
    });
    // Restore the last position of the pending chip when the game state is
    // restored
    if (game.pendingChipColumn) {
      this.emit('grid:align-pending-chip-initially', { column: game.pendingChipColumn });
    }
    this.winner = null;

    if (this.inProgress && this.currentPlayer) {
      this.startTurn();
    }
    this.checkForWin();
    this.checkForTie();
  }

}

function roundResult (gameId, roundId, players){
  this.gameId = gameId;
  this.roundId = roundId;
  this.players = players;
}

function players (player1, player2){
  this.player1 = player1;
  this.player2 = player2;
}

// The minimum number of chips a connection must have to win the game
Game.winningConnectionSize = 4;

export default Game;
