class MaybeScript extends HTMLElement {
    constructor() {
        // Super constructor returns a reference to the element itself.
        super()
        console.log("Custom element constructed", this)
    }

    connectedCallback() {
        console.log("Custom element connected", this)
        this.hide()
    }

    hide() {
        console.log("Hiding", this)
        this.setAttribute("hidden", "")
    }
}

customElements.define("maybe-script", MaybeScript)


