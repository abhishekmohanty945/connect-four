import m from "mithril";
import classNames from "../classnames.js";
class Header {
    view() {
        return (
            "div#game",
            [
                m("div.header", [
                    m("img.logo[src='./icons/logo-white.webp']", "Logo Text"),
                ])
            ]
        )
      }
}
export default Header;