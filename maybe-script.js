// This runs where the script is included.
// So at the top of the document.
console.log("maybe-script.js running")


function main() {
    createRegister()

    customElements.define("maybe-script", MaybeScript)

    setUpScriptStateReporting()
}


function createRegister() {
    if (window.maybeScript === undefined) {
        window.maybeScript = new Register()
    }
}


function responseStatusOk(statusCode) {
    return statusCode >= 200 && statusCode <400
}


function setUpScriptStateReporting() {
    window.addEventListener("load", () => {
        console.log("Setting up reporting of script loading states")
        const performanceObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (entry.initiatorType === "script") {
                    window.maybeScript.reportScriptState(entry.name, entry.responseStatus)
                }
            })
        })
        // Buffered makes sure we get historic entires
        performanceObserver.observe({type: "resource", buffered: true})
    })
}


class Register {
    constructor() {
        this.map = new Map()
    }

    addCustomElement(maybeScript) {
        // Get absolute URL from the `src` attribute.
        // This is needed because the performance entries use the absolute URL.
        const src = maybeScript.getAttribute("src")
        if (!src) return

        const documentURL = new URL(document.URL)
        const srcURL = new URL(src, documentURL.origin)
        const absoluteSrcHref = srcURL.href


        let customElements = this.map.get(absoluteSrcHref)
        if (customElements === undefined) {
            customElements = []
        }
        customElements.push(maybeScript)
        this.map.set(absoluteSrcHref, customElements)
    }

    reportScriptState(scriptURL, status) {
        console.log("Reporting script status", scriptURL, status)

        const customElements = this.map.get(scriptURL)
        if (customElements === undefined) return

        customElements.forEach((ce) => ce.updateForScriptStatus(status))
    }
}


class MaybeScript extends HTMLElement {
    constructor() {
        // Super constructor returns a reference to the element itself.
        super()
        console.log("Custom element constructed", this)
    }

    connectedCallback() {
        console.log("Custom element connected", this)

        if (window.maybeScript === undefined) {
            console.error("No maybeScript register found.")
            return
        }

        this.hide()

        window.maybeScript.addCustomElement(this)
    }

    updateForScriptStatus(status) {
        console.log("Updating custom element for script status", this, status)

        // If the script loaded ok, we don't do anything
        if (responseStatusOk(status)) return


        this.show()
    }

    hide() {
        console.log("Hiding", this)
        this.setAttribute("hidden", "")
    }

    show() {
        console.log("Showing", this)
        this.removeAttribute("hidden")
    }
}


(() => {main()})();

