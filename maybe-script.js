class MaybeScript extends HTMLElement {
    constructor() {
        // Super constructor returns a reference to the element itself.
        super()
        console.log("Custom element constructed", this)
        // this.delay = 2000
    }

    connectedCallback() {
        console.log("Custom element connected", this)
        this.hide()

        // Get absolute URL from the `src` attribute.
        // This is needed because the performance entries use the absolute URL.
        this.src = this.getAttribute("src")
        if (!this.src) return

        const documentURL = new URL(document.URL)
        const srcURL = new URL(this.src, documentURL.origin)
        this.srcURL = srcURL.href

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

        // this.updateScriptFromAttribute()
        // this.showOnLoadingError()

        // this.updateDelayFromAttribute()
        // this.showAfterDelay()
        // this.cancelShow()
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
        return statusCode >= 200 && statusCode <300
    }

    getScriptStatus() {
        return window.maybeScript.states[this.srcURL]
    }

    // showOnLoadingError() {
    //     if (!this.script) {
    //         console.log("No `<script>` with corresponding `src` found: ", this.getAttribute("src"))
    //         this.show()
    //         return
    //     }

    //     console.log("Adding script event listeners")
    //     this.script.addEventListener(
    //         "error",
    //         (event) => {
    //             console.log("Loading failed", event)
    //             this.show()
    //         }
    //     )
    //     this.script.addEventListener(
    //         "load",
    //         (event) => {
    //             console.log("Loading success", event)
    //         }
    //     )
    // }

    // showAfterDelay()  {
    //     console.log("Set up to show after delay", this, this.delay)
    //     this.showTimeout = setTimeout(
    //         () => {
    //             console.log("Showing after delay", this)
    //             this.show()
    //         },
    //         this.delay,
    //     )
    // }

    // cancelShow() {
    //     console.log("Don't show after delay anymore", this)
    //     if (!this.showTimeout) return

    //     clearTimeout(this.showTimeout)
    // }

    // updateScriptFromAttribute() {
    //     const src = this.getAttribute("src")
    //     console.log(src)

    //     const script = document.querySelector(`script[src="${src}"]`)
    //     console.log(script)

    //     this.script = script
    // }

    // updateDelayFromAttribute() {
    //     const value = this.getAttribute("delay")
    //     if (!value) return

    //     const delay = Number(value)
    //     if (!delay && delay !== 0) return

    //     this.delay = delay
    // }
}


(() => {
    console.log("maybe-script.js running")

    customElements.define("maybe-script", MaybeScript)

    document.addEventListener("DOMContentLoaded", () => {
        console.log("DOM Content Loaded")
    })

    if (window.maybeScript === undefined) {
        window.maybeScript = {
            states: new Map()
        }
    }

    window.addEventListener("load", () => {
        console.log("Everything Loaded")

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




