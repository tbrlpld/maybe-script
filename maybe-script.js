class MaybeScript extends HTMLElement {
    constructor() {
        // Super constructor returns a reference to the element itself.
        super()
        console.log("Custom element constructed", this)
        this.delay = 2000
    }

    connectedCallback() {
        console.log("Custom element connected", this)
        this.hide()
        this.updateDelayFromAttribute()

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
        console.log("Set up to show after delay", this, this.delay)
        this.showTimeout = setTimeout(
            () => {
                console.log("Showing after delay", this)
                this.show()
            },
            this.delay,
        )
    }

    cancelShow() {
        console.log("Don't show after delay anymore", this)
        if (!this.showTimeout) return

        clearTimeout(this.showTimeout)
    }

    updateDelayFromAttribute() {
        const value = this.getAttribute("delay")
        if (!value) return

        const delay = Number(value)
        if (!delay && delay !== 0) return

        this.delay = delay
    }
}

customElements.define("maybe-script", MaybeScript)


