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

        this.runAttributeAction("on:init")

        this.setUpTimeout()

        window.maybeScript.registerCustomElement(this)
    }


    runAttributeAction(attr) {
        console.debug("Updating custom element with attribute", this, attr)
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

    updateForScriptStatus(status) {
        console.debug("Updating custom element for script status", this, status)

        if (responseStatusOk(status)) {
            this.runAttributeAction("on:success")

            window.addEventListener("load", () => {this.handleLoadAfterSuccess()})
        } else {
            this.runAttributeAction("on:failure")
        }

        // We already got our result. No need to wait anymore.
        this.clearTimeout()
    }

    handleLoadAfterSuccess() {
        console.debug("Load after success", this)
        this.runAttributeAction("on:load-after-success")
    }

    setUpTimeout() {
        const timeout = this.getAttribute("timeout")
        if (timeout !== null) {
            this.timeout = timeout
        }
        this.timer = setTimeout(() => {this.handleTimeout()}, this.timeout)
    }

    handleTimeout() {
        console.log("Timeout reached. Handling it.", this)
        const timeoutAttr = "on:timeout"
        if (this.hasAttribute(timeoutAttr)) {
            this.runAttributeAction(timeoutAttr)}
        else {
            this.runAttributeAction("on:failure")
        }
    }

    clearTimeout() {
        if (!this.timer) return
        clearTimeout(this.timer)
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

