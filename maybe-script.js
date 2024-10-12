class MaybeScript extends HTMLElement {
    constructor() {
        // Super constructor returns a reference to the element itself.
        super()
        console.log("Custom element constructed", this)
    }

    connectedCallback() {
        console.log("Custom element connected", this)
        this.hide()
        this.showAfterDelay()
        this.cancelShow()
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
        console.log("Set up to show after delay", this)
        this.showTimeout = setTimeout(
            () => {
                console.log("Showing after delay", this)
                this.show()
            },
            2000,
        )
    }

    cancelShow() {
        console.log("Don't show after delay anymore", this)
        if (!this.showTimeout) return

        clearTimeout(this.showTimeout)
    }
}

customElements.define("maybe-script", MaybeScript)


