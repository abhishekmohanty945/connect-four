import m from "mithril";
class OverlayComponent {
  oninit({ attrs: { game, verifyFunction } }) {
    this.game = game;
    this.verifyFunction = verifyFunction;
    if (this.game.transactionLink === '') {
      this.verifyFunction();
    }
  }

  view() {
    return m("div.overlay", [
      m("div.textfinal", `In total, You saved ${this.game.turns * 3} clicks, ${this.game.turns * 7} seconds, and ${this.game.turns * 0.05} dollars`),
      m("div.transaction-link", [
        "Checkout the round proof verification results on chain ",
        m("a", { href: this.game.transactionLink }, "here")
      ])    
    ]);
  }
}

class SavedComponent {
  oninit({ attrs: { game, session } }) {
    this.game = game;
    this.session = session;
    this.waiting = false;
    this.verifiedForTurn2 = false;
  }

  verifyFunction() {
    this.waiting = true;
    console.log("Round Proof verification in progress");
    this.game.sdk.verifySchnorrSignature(this.game.schnorrSignature, this.game.encodedMessage).then((res) => {
      console.log("Round proof verified:");
      console.log(res[0]);
      console.log("Transaction link:");
      console.log(res[1].toString());
      this.game.transactionLink = res[1].toString();
      this.waiting = false;
    });
  }

  view() {
    if (this.game.turns === 2 && !this.verifiedForTurn2) {
      this.verifyFunction();
      this.verifiedForTurn2 = true;
    }
    return m("div", [
      this.game.inProgress
        ? m("div.text-parent", [
            m("div.text", "You save 3 clicks, 7 seconds, and 2 cents every turn"),
            m("div.textfinal", `In total, You saved ${this.game.turns * 3} clicks, ${this.game.turns * 7} seconds, and ${this.game.turns * 0.05} dollars`),
            m(
              "button[type=submit].verify",
              { onclick: () => this.verifyFunction() },
              this.waiting ? 'Verifying...' : 'Verify'
            )
          ])
        : null,
      this.game.gameEnded ? m(OverlayComponent, { game: this.game, verifyFunction: this.verifyFunction.bind(this) }) : null
    ]);
  }
}
export default SavedComponent;