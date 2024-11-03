(() => {
    // This runs where the script is included.
    // So at the top of the document.
    console.log("maybe-script.js running")


    class Register {
        constructor() {
            this.map: new Map()
        }

        add(maybeScript) {
            // Get absolute URL from the `src` attribute.
            // This is needed because the performance entries use the absolute URL.
            const src = maybeScript.getAttribute("src")
            if (!src) return

            const documentURL = new URL(document.URL)
            const srcURL = new URL(src, documentURL.origin)
            const absoluteSrcHref = srcURL.href

            this.map[absoluteSrcHref] = maybeScript
        }
    }

    // Create register
    if (window.maybeScript === undefined) {
        window.maybeScript = new Register()
    }

    class MaybeScript extends HTMLElement {
        constructor() {
            // Super constructor returns a reference to the element itself.
            super()
            console.log("Custom element constructed", this)
        }

        connectedCallback() {
            console.log("Custom element connected", this)
            this.hide()


            // How do we make sure this runs after the event listenr that adds the statuses?
            // I guess we can use a custom event that is fired by  that status tracker.
            window.addEventListener("load", () => {
                console.log("Handling for elemnt after load", this)
                const scriptState = this.getScriptStatus()
                console.log(scriptState)
                if (!MaybeScript.responseOk(scriptState)) {
                    this.show()
                }
            })
        }

        hide() {
            console.log("Hiding", this)
            this.setAttribute("hidden", "")
        }

        show() {
            console.log("Showing", this)
            this.removeAttribute("hidden")
        }

        static responseOk(statusCode) {
            return statusCode >= 200 && statusCode <400
        }

        getScriptStatus() {
            return window.maybeScript.states[this.srcURL]
        }
    }

    customElements.define("maybe-script", MaybeScript)

    document.addEventListener("DOMContentLoaded", () => {
        console.log("DOM Content Loaded")
    })


    window.addEventListener("load", () => {
        console.log("Everything Loaded")

        console.log("Setting up script loading checks")
        const performanceObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (entry.initiatorType === "script") {
                    window.maybeScript.states[entry.name] = entry.responseStatus
                }
            })
        })
        performanceObserver.observe({type: "resource", buffered: true})
    })
})();

