// This runs where the script is included.
// So at the top of the document.
console.log("maybe-script.js running")


function main() {
    document.addEventListener("DOMContentLoaded", () => { console.log("DOMContentLoaded")})
    window.addEventListener("load", () => { console.log("load")})

    createRegister()

    customElements.define("maybe-script", MaybeScript)

    // Setting up the reporting after content is loaded.
    // This is to make sure that the custom elements had time to register their interest.
    document.addEventListener("DOMContentLoaded", () => {setUpScriptStateReporting()})
}


function createRegister() {
    if (!isRegisterSetUp()) {
        console.log("Setting up register")
        window.maybeScript = new Register()
    }
}


function isRegisterSetUp() {
    try {
        return window.maybeScript instanceof Register
    } catch {
        return false
    }
}


function responseStatusOk(statusCode) {
    return statusCode >= 200 && statusCode <400
}


function setUpScriptStateReporting() {
    console.log("Setting up reporting of script loading states")
    // The performance observer will run the registerd handler for resources added before this point and for new ones.
    // This means we can set this up immediately.
    // TODO: What about custom elements that have not been added yet, when the status is reported?

    if (!isRegisterSetUp()) {
        throw MaybeScriptRegisterNotSetUp()
    }

    const performanceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
            if (entry.initiatorType === "script") {
                window.maybeScript.reportScriptState(entry.name, entry.responseStatus)
            }
        })
    })
    // Buffered makes sure we get historic entires
    performanceObserver.observe({type: "resource", buffered: true})

    console.log("Setting up reporting of script loading states -- DONE")
}


class Register {
    constructor() {
        this.map = new Map()
    }

    registerCustomElement(maybeScript) {
        // Convert the `src` to an absolute URL.
        // This is needed because the performance entries use the absolute URL.
        const scriptURL = this.getAbsoluteSource(maybeScript)
        if (!scriptURL) return

        // Add the custom element to the array of elements interested in this scriptURL.
        let entry = this.map.get(scriptURL)
        if (entry === undefined) {
            entry = new RegisterEntry()
        }
        entry.elements.push(maybeScript)
        this.map.set(scriptURL, entry)

        console.log("Registered custom element", maybeScript)
    }

    getAbsoluteSource(maybeScript){
        const src = maybeScript.getAttribute("src")
        if (!src) return

        const documentURL = new URL(document.URL)
        const srcURL = new URL(src, documentURL.origin)

        return srcURL.href
    }

    reportScriptState(scriptURL, status) {
        console.log("Reporting script status", scriptURL, status)

        let entry = this.map.get(scriptURL)
        if (entry === undefined) {
            entry = new RegisterEntry()
        }
        entry.status = status
        this.map.set(scriptURL, entry)

        entry.elements.forEach((ce) => ce.updateForScriptStatus(status))
    }
}


class RegisterEntry {
    constructor() {
        this.status = undefined
        this.elements = []
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

        if (!isRegisterSetUp()) {
            throw MaybeScriptRegisterNotSetUp()
        }

        this.hide()

        window.maybeScript.registerCustomElement(this)
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


class MaybeScriptRegisterNotSetUp extends Error {
    constructor(message, options) {
        super(message, options);
    }
}


(() => {main()})();

