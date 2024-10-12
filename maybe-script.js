class MaybeScript extends HTMLElement {
    constructor() {
        // Super constructor returns a reference to the element itself.
        self = super()
        console.log("Custom element constructed")
    }

    connectedCallback() {
        console.log("Custom element connected")
        // When this element itself (the parent) is added to the DOM, the children are not constructed yet.
        // Thus, we need to wait for the DOM to be loaded.
        document.addEventListener("DOMContentLoaded", this.handleDOMLoaded)
    }

    handleDOMLoaded(event) {
        console.log("Element responds to DOM is loaded.", self)
        // Hide the child elements
        for (const child of self.children) {
            console.log(child.tagName)
        }
    }
}

customElements.define("maybe-script", MaybeScript)


