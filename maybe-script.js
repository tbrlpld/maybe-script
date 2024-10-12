class MaybeScript extends HTMLElement {
    constructor() {
        // Super constructor returns a reference to the element itself.
        super()
        console.log("Custom element constructed", this)
    }

    connectedCallback() {
        console.log("Custom element connected", this)
        this.hide()
        this.showAfterDOMandDelay()
    }

    hide() {
        console.log("Hiding", this)
        this.setAttribute("hidden", "")
    }

    show() {
        console.log("Showing", this)
        this.removeAttribute("hidden")
    }

    showAfterDelay()  {
        setTimeout(() => this.show(), 2000)
    }

    showAfterDOMandDelay() {
        document.addEventListener("DOMContentLoaded", () => this.showAfterDelay())
    }

}

customElements.define("maybe-script", MaybeScript)


