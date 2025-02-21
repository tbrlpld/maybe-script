// This runs where the script is included.
// So at the top of the document.
console.debug("maybe-script.js running")


function main() {
    document.addEventListener("DOMContentLoaded", () => { console.debug("DOMContentLoaded")})
    window.addEventListener("load", () => { console.debug("load")})

    createRegister()

    customElements.define("maybe-script", MaybeScript)

    setUpScriptStateReporting()
}


function createRegister() {
    if (!isRegisterSetUp()) {
        console.debug("Setting up register")
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
    console.debug("Setting up reporting of script loading states")
    // The performance observer will run the registered handler for resources added before this point and for new ones.
    // This means we can set this up immediately.

    if (!isRegisterSetUp()) {
        throw MaybeScriptRegisterNotSetUp()
    }

    const performanceObserver = new PerformanceObserver((list) => {
        list.getEntriesByType("resource").forEach((entry) => {
            if (entry.initiatorType === "script") {
                window.maybeScript.registerScriptStatus(entry.name, entry.responseStatus)
            }
        })
    })
    // Buffered makes sure we get historic entries
    performanceObserver.observe({type: "resource", buffered: true})

    console.debug("Setting up reporting of script loading states -- DONE")
}


class Register {
    constructor() {
        this.map = new Map()
    }

    registerCustomElement(maybeScript) {
        console.debug("Registering custom element", maybeScript)

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
        console.debug("Reporting script status", scriptURL, status)

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


// noinspection JSUnusedGlobalSymbols
class MaybeScript extends HTMLElement {
    constructor() {
        // Super constructor returns a reference to the element itself.
        super()
        console.debug("Custom element constructed", this)

        this.timeout = 3000
    }

    connectedCallback() {
        console.debug("Custom element connected", this)

        if (!isRegisterSetUp()) {
            throw MaybeScriptRegisterNotSetUp()
        }

        this.handleInit()

        this.setUpTimeout()

        window.maybeScript.registerCustomElement(this)
    }

    updateForScriptStatus(status) {
        console.debug("Updating custom element for script status", this, status)

        if (responseStatusOk(status)) {
            this.handleSuccess()

            window.addEventListener("load", () => {this.handleLoadAfterSuccess()})
        } else {
            this.handleFailure()
        }

        // We already got our result. No need to wait anymore.
        this.clearTimeout()
    }

    handleInit() {
        console.debug("Custom element initialized. Handling it...", this)
        this.runAttributeAction("on:init")
    }

    handleSuccess() {
        console.debug("Awaited script loaded successfully. Handling it...", this)
        this.runAttributeAction("on:success")
    }

    /*
     * Handle the load event after successful loading of a script.
     *
     * This may be helpful when an action should be delayed until the script has not only been loaded,
     * but also had time to run.
     */
    handleLoadAfterSuccess() {
        console.debug("Document loaded after awaited script was successfully loaded. Handling it...", this)
        this.runAttributeAction("on:load-after-success")
    }

    handleFailure() {
        console.debug("Awaited script failed to load. Handling it...", this)
        this.runAttributeAction("on:failure")
    }

    handleTimeout() {
        console.log("Timeout reached. Handling it...", this)
        const timeoutAttr = "on:timeout"
        if (this.hasAttribute(timeoutAttr)) {
            this.runAttributeAction(timeoutAttr)}
        else {
            this.runAttributeAction("on:failure")
        }
    }

    setUpTimeout() {
        const timeout = this.getAttribute("timeout")
        if (timeout !== null) {
            this.timeout = timeout
        }
        this.timer = setTimeout(() => {this.handleTimeout()}, this.timeout)
    }

    clearTimeout() {
        if (!this.timer) return
        clearTimeout(this.timer)
    }

    runAttributeAction(attr) {
        console.debug("Updating custom element with attribute action...", this, attr)
        const value = this.getAttribute(attr)
        if (value == null) {
            console.debug(`No action defined for ${attr}`, this)
        } else if (value === "hide") {
            this.hide()
        } else if (value === "show") {
            this.show()
        } else {
            throw InvalidAttributeValue()
        }
    }

    hide() {
        console.debug("Hiding", this)
        this.setAttribute("hidden", "")
    }

    show() {
        console.debug("Showing", this)
        this.removeAttribute("hidden")
    }
}


class MaybeScriptRegisterNotSetUp extends Error {
}


class InvalidAttributeValue extends Error {
}


main();

