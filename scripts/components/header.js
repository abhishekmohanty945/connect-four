import m from "mithril";
import logo from "/assets/logo-white.png";

class Header {
    view() {
        return (
            "div#header",
            [
                m("div.header", [
                    m("img.logo[src='" + logo + "']", "Logo Text")
                ])
            ]
        );
      }
}
export default Header;