import m from "mithril";
class Header {
    view() {
        return (
            "div#header",
            [
                m("div.header", [
                    m("img.logo[src='/assets/logo-white.webp']", "Logo Text"),
                ])
            ]
        )
      }
}
export default Header;