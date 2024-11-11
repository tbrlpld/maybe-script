function main() {
    const body = document.querySelector("body")
    if (!body) return

    console.log("Hello from main() function")
    Disclosure.init()
}


class Component {
    static init() {
        console.debug("Initializing", this)
        const elems = document.querySelectorAll(this.selector())

        elems.forEach((elem) => {
            new this(elem)
        })
    }

    static selector () {
        return undefined
    }
}


class Disclosure extends Component {
    static selector () {return "[data-disclosure]"}

    constructor(elem) {
        super()

        this.button = elem
        const contentId = this.button.dataset.disclosureToggles
        const contentSelector = `[data-disclosure-content=${contentId}]`

        this.content = document.querySelector(contentSelector)
        if (!this.content) return

        this.button.addEventListener("click", () => {this.toggle()})
        this.hide()
    }

    toggle() {
        if (this.isHidden()) {
            this.show()
        } else {
            this.hide()
        }
    }

    hide () {
        console.debug("Hiding", this.content)
        this.content.setAttribute("hidden", "")
    }

    show () {
        console.debug("Showing", this.content)
        this.content.removeAttribute("hidden")
    }

    isHidden () {
        return this.content.getAttribute("hidden") !== null
    }
}

console.log("main.js script running")

document.addEventListener("DOMContentLoaded", main)
