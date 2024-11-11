function main() {
    const body = document.querySelector("body")
    if (!body) return

    console.log("Hello from main() function")
    Component.init()
    Disclosure.init()
}


class Component {
    static init() {
        console.debug("Initializing")
        const elems = document.querySelectorAll(this.selector)
        console.debug(elems)
        elems.forEach((elem) => {console.debug(elem)})
    }
}


class Disclosure extends Component {
    static selector = "[data-disclosure]"

}

console.log("main.js script running")

document.addEventListener("DOMContentLoaded", main)
