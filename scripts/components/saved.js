import m from "mithril";
class SavedComponent {
    oninit({ attrs: { game, session } }) {
        this.game = game;
        this.session = session;
    }
    view() {
        return (
            this.game.inProgress
            ? m("div.text-parent", [
                m("div.text", "You just saved 3 clicks, 7 seconds, and $.02"),
                m("div.textfinal", "In total, You saved 10 clicks, 18 seconds, and $.12"),
                m("button[type=submit].verify", "Verify")
            ])
            : null
        );
      }
}
export default SavedComponent;