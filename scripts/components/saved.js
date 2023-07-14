import m from "mithril";
class SavedComponent {
  oninit({ attrs: { game, session } }) {
    this.game = game;
    this.session = session;
  }

  verifyFunction() {
    console.log("Round Proof verification in progress");
    this.game.sdk.verifySchnorrSignature(this.game.schnorrSignature, this.game.encodedMessage).then((res) => {
      console.log("Round proof verified:");
      console.log(res[0]);
      console.log("Transaction link:");
      console.log(res[1].toString());
    });
  }

  view() {
    return this.game.inProgress
      ? m("div.text-parent", [
          m("div.text", "You just saved 3 clicks, 7 seconds, and $.02"),
          m(
            "div.textfinal",
            "In total, You saved 10 clicks, 18 seconds, and $.12"
          ),
          m(
            "button[type=submit].verify",
            { onclick: () => this.verifyFunction() },
            "Verify"
          )
        ])
      : null;
  }
}
export default SavedComponent;