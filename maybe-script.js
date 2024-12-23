// This runs where the script is included.
// So at the top of the document.
console.log("maybe-script.js running")


function main() {
    document.addEventListener("DOMContentLoaded", () => { console.log("DOMContentLoaded")})
    window.addEventListener("load", () => { console.log("load")})

    createRegister()

    customElements.define("maybe-script", MaybeScript)

    setUpScriptStateReporting()
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

    if (!isRegisterSetUp()) {
        throw MaybeScriptRegisterNotSetUp()
    }

    const performanceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
            if (entry.initiatorType === "script") {
                window.maybeScript.registerScriptStatus(entry.name, entry.responseStatus)
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
        console.log("Registering custom element", maybeScript)

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

        // If we already have a status, we update the new element with that.
        if (entry.status !== undefined) {
            maybeScript.updateForScriptStatus(entry.status)
        }
    }

    registerScriptStatus(scriptURL, status) {
        console.log("Reporting script status", scriptURL, status)

        let entry = this.map.get(scriptURL)
        if (entry === undefined) {
            entry = new RegisterEntry()
        }
        entry.status = status
        this.map.set(scriptURL, entry)

        entry.elements.forEach((ce) => ce.updateForScriptStatus(status))
    }

    getAbsoluteSource(maybeScript){
        const src = maybeScript.getAttribute("src")
        if (!src) return

        const documentURL = new URL(document.URL)
        const srcURL = new URL(src, documentURL.origin)

        return srcURL.href
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

        this.runAttributeAction("on:init")

        if (!isRegisterSetUp()) {
            throw MaybeScriptRegisterNotSetUp()
        }

        window.maybeScript.registerCustomElement(this)
    }

    runAttributeAction(attr) {
        console.log("Updating custom element with attribute", this, attr)
        const value = this.getAttribute(attr)
        if (value == null) {
            console.debug(`No state defined for ${attr}`, this)
            return
        } else if (value == "hide") {
            this.hide()
        } else if (value == "show") {
            this.show()
        } else {
            throw InvalidAttributeValue()
        }
    }

    updateForScriptStatus(status) {
        console.log("Updating custom element for script status", this, status)

        if (responseStatusOk(status)) {
            this.runAttributeAction("on:success")

            window.addEventListener("load", () => {this.handleLoadAfterSuccess()})
        } else {
            this.runAttributeAction("on:failure")
        }
    }

    handleLoadAfterSuccess() {
        console.log("Load after success", this)
        this.runAttributeAction("on:load-after-success")
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


class InvalidAttributeValue extends Error {
    constructor(message, options) {
        super(message, options);
    }
}


(() => {main()})();

