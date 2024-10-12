class MaybeScript extends HTMLElement {
    constructor() {
        super()
        console.log("Custom element constructed")
    }
}

customElements.define("maybe-script", MaybeScript)


