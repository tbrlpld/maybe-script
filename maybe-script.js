class MaybeScript extends HTMLElement {
    constructor() {
        // Super constructor returns a reference to the element itself.
        super()
        console.log("Custom element constructed", this)
    }

    connectedCallback() {
        console.log("Custom element connected", this)
        // When this element itself (the parent) is added to the DOM, the children are not constructed yet.
        // Thus, we need to wait for the DOM to be loaded.
        document.addEventListener("DOMContentLoaded", () =>  this.hide())
    }

    hide() {
        console.log("Hiding", this)
        this.setAttribute("hidden", "")
    }
}

customElements.define("maybe-script", MaybeScript)


