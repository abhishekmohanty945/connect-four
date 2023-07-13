/* eslint-disable comma-dangle */
import m from "mithril";
import Session from "../models/session.js";
import GameComponent from "./game.js";
import UpdateNotificationComponent from "./update-notification.js";
import Header from "./header.js";

class AppComponent {
  oninit({ attrs = { roomCode: null } }) {
    this.session = new Session({
      url: window.location.origin,
      roomCode: attrs.roomCode,
    });
  }

  view({ attrs = { roomCode: null } }) {
    return m("div#app", [
      // The UpdateNotificationComponent manages its own visibility
      m(Header),
      m(UpdateNotificationComponent),
      m(GameComponent, { session: this.session, roomCode: attrs.roomCode }),
    ]);
  }
}

export default AppComponent;
