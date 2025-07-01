// This runs where the script is included.
// So at the top of the document.
console.debug("maybe-script.js running")


function main() {
    document.addEventListener("DOMContentLoaded", () => { console.debug("DOMContentLoaded")})
    window.addEventListener("load", () => { console.debug("load")})

    const controller = getOrCreateController()

    /*
     * Define MaybeScript subclass with added controller.
     *
     * All elements should make use of the same controller. This could be defined globally, on the window object,
     * but this way we can ensure the controller is set up before any custom element is defined.
     *
     */
    class ControlledMaybeScript extends MaybeScript {
        constructor() {
            super()
            this.controller = controller
        }

        connectedCallback() {
            super.connectedCallback()
            this.controller.registerCustomElement(this)
        }
    }

    customElements.define("maybe-script", ControlledMaybeScript)
}


function getOrCreateController(){
    if (!(window.maybeScript instanceof Controller)) {
        window.maybeScript = new Controller()
    }
    return window.maybeScript
}


function responseStatusOk(statusCode) {
    return statusCode >= 200 && statusCode <300
}


class Controller {
    constructor() {
        this.register = new Map()

        this.setUpScriptStateReporting()
    }

    setUpScriptStateReporting() {
        console.debug("Setting up reporting of script loading states")
        // The performance observer will run the registered handler for resources added before this point and for new ones.
        // This means we can set this up immediately.

        const performanceObserver = new PerformanceObserver((list) => {
            list.getEntriesByType("resource").forEach((entry) => {
                if (entry.initiatorType === "script") {
                    this.registerScriptStatus(entry.name, entry.responseStatus)
                }
            })
        })
        // Buffered makes sure we get historic entries
        performanceObserver.observe({type: "resource", buffered: true})

        console.debug("Setting up reporting of script loading states -- DONE")
    }

    registerCustomElement(maybeScript) {
        console.debug("Registering custom element", maybeScript)

        // Convert the `src` to an absolute URL.
        // This is needed because the performance entries use the absolute URL.
        const scriptURL = this.getAbsoluteSource(maybeScript)
        if (!scriptURL) return

        // Add the custom element to the array of elements interested in this scriptURL.
        const entry = this.getOrCreateRegisterEntry(scriptURL)
        entry.addElement(maybeScript)
        this.register.set(scriptURL, entry)

        // If we already have a status, we update the new element with that.
        if (entry.status !== undefined) {
            maybeScript.updateForScriptStatus(entry.status)
        }
    }

    registerScriptStatus(scriptURL, status) {
        console.debug("Reporting script status", scriptURL, status)

        const entry = this.getOrCreateRegisterEntry(scriptURL)
        entry.status = status
        this.register.set(scriptURL, entry)

        entry.elements.forEach((ce) => ce.updateForScriptStatus(status))
    }

    /* Get the RegisterEntry for a script URL, creating it if needed. */
    getOrCreateRegisterEntry(scriptURL) {
        let entry = this.register.get(scriptURL)
        if (entry === undefined) {
            entry = new RegisterEntry()
        }
        return entry
    }

    getAbsoluteSource(maybeScript){
        const src = maybeScript.getAttribute("src")
        if (!src) return

        const documentURL = new URL(document.URL)
        const srcURL = new URL(src, documentURL)

        return srcURL.href
    }
}


class RegisterEntry {
    constructor() {
        this.status = undefined
        this.elements = []
    }

    addElement(maybeScript) {
        this.elements.push(maybeScript)
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

        this.handleInit()

        this.setUpTimeout()
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


class MaybeScriptControllerNotSetUp extends Error {
}


class InvalidAttributeValue extends Error {
}


main();

