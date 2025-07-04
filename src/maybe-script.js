// This runs where the script is included.
// So at the top of the document.
console.debug("maybe-script.js running")


function main() {
    document.addEventListener("DOMContentLoaded", () => { console.debug("DOMContentLoaded")})
    window.addEventListener("load", () => { console.debug("load")})

    const default_expected_script_url = document.currentScript.dataset.expect
    if (!default_expected_script_url) {
        throw Error("No expected script source defined.")
    }
    console.debug("Default expected script source:", default_expected_script_url)

    window.maybe_script = new Controller(default_expected_script_url)
    customElements.define("maybe-script", MaybeScript)
}


/*
 * Get controller or throw an error.
 */
function get_controller_or_throw(){
    if (!(window.maybe_script instanceof Controller)) {
        throw Error("Controller not available as window.maybeScript")
    }
    return window.maybe_script
}


/*
 * Check if the given status code is consider a successful loading state for a script.
 */
function is_status_code_indicating_successful_script_loading(status_code) {
    return status_code >= 200 && status_code <300
}


/*
 * Controller to inform maybe-script custom elements about script loading states.
 *
 * This controller needs to be available as `window.maybe_script`.
 * Custom `<maybe-script>` elements register themselves with that controller.
 * The controller ensures that the element is updated once a loading state for
 * its expected script has been determined.
 * The updating of the custom element might happen directly during the
 * registration, if the script loading state is already known, or it will
 * happen as soon as the script finishes loading.
 */
class Controller {
    constructor(default_expected_script_url) {
        this.default_expected_script_url = default_expected_script_url

        this.register = new Map()

        this.set_up_handling_of_script_loading_status()
    }

    /*
     * Set up handling of loading states for scripts.
     *
     * This sets up the tracking of loading statuses of script resources.
     * The tracking is set up, so that the loading status change handler is called
     * as soon as the information is available.
     *
     * The tracking of loading statuses is enabled for all script resources, regardless
     * if any custom elements have them as "expected scripts" or not.
     *
     * The benefit here is that we can configure this before any custom elements are created.
     */
    set_up_handling_of_script_loading_status() {
        console.debug("Setting up handling of script loading state changes.")

        // Configure a performance observer with a callback that calls the loading state
        // handler method on the controller for each new performance entry related to script resources.
        const performance_observer = new PerformanceObserver((list) => {
            list.getEntriesByType("resource").forEach((entry) => {
                // Performance entries related to resources contain the response status code for
                // the loading response of the resource.
                // This can tell us if the script loaded successfully or not.
                if (entry.initiatorType === "script") {
                    this.handle_script_loading_status(entry.name, entry.responseStatus)
                }
            })
        })
        // The `buffered` option means that we run the handler even for
        // resource entries that exist when we start observing.
        performance_observer.observe({type: "resource", buffered: true})

        console.debug("Setting up handling of script loading state changes -- DONE.")
    }

    /*
     * Handle the loading state change of the given script URL.
     *
     * Updates the registry and all elements that are registered as expecting this script URL.
     * We register the script loading states, so that we can look up the loading state later,
     * when an element that expects the script is added after the loading state
     * change has already been handled.
     */
    handle_script_loading_status(script_url, status_code) {
        const entry = this.register_script_loading_status(script_url, status_code)
        entry.elements.forEach(
            maybe_script_element => {
                maybe_script_element.handle_expected_script_loading_status(status_code)
            }
        )
    }

    /*
     * Register loading status for a given script URL.
     *
     * Creates or updates a register entry for the given script with the supplied status.
     * Returns the updated record.
     *
     * We need to "get or create" because we don't know if the script status is
     * registered first, or if some elements have already registered themselves
     * as expecting the script.
     */
    register_script_loading_status(script_url, status_code) {
        console.debug("Registering script status", script_url, status_code)

        const entry = this.get_or_create_register_entry(script_url)
        entry.status = status_code
        this.register.set(script_url, entry)

        return entry
    }

    /*
     * Handle a maybe-script element being connected to the DOM.
     *
     * We register the custom element as expecting a certain script (its own or the default).
     *
     * If we already have the loading state for that script, we let the element handle that
     * loading state.
     *
     * The custom element is registered so that we can update the element
     * as soon as the loading state of its expected script is known.
     */
    handle_maybe_script_element_connected(maybe_script_element) {
        const entry = this.register_maybe_script_element(maybe_script_element)

        // If we already have a status, we update the new element with that.
        if (entry.status !== null) {
            maybe_script_element.handle_expected_script_loading_status(entry.status)
        }
    }

    /*
     * Register the maybe-script element.
     *
     * The custom element is registered so that we can update the element
     * as soon as the loading state of its expected script is known.
     *
     * If the custom element does not define an expected script itself,
     * it will be registered for the default expected script of the
     * controller.
     *
     * Returns the created or updated entry.
     */
    register_maybe_script_element(maybe_script_element) {
        console.debug("Registering maybe-script element", maybe_script_element)

        const expected_script_url = this.get_expected_script_url_for_maybe_script_element(maybe_script_element)

        // Convert the script URL to an absolute URL.
        // This is needed because the performance entries are reported for absolute URLs.
        const expected_script_absolute_url = this.get_absolute_url(expected_script_url)

        // Add the custom element to the array of elements interested in this scriptURL.
        const entry = this.get_or_create_register_entry(expected_script_absolute_url)
        entry.elements.push(maybe_script_element)
        this.register.set(expected_script_absolute_url, entry)

        return entry
    }

    /* Get the RegisterEntry for a script URL, creating it if needed. */
    get_or_create_register_entry(script_url) {
        let entry = this.register.get(script_url)
        if (entry === undefined) {
            console.debug("Creating new RegisterEntry for script URL", script_url)
            entry = new RegisterEntry()
        }
        return entry
    }

    /*
     * Get the expected script source from the custom element.
     *
     * If the custom element has a `src` attribute, that is used.
     * Otherwise, the default expected script source of this controller is used.
     */
    get_expected_script_url_for_maybe_script_element(maybe_script_element) {
        let expected_script_url = maybe_script_element.getAttribute("src")
        if (!expected_script_url) {
            expected_script_url = this.default_expected_script_url
        }
        return expected_script_url
    }

    /*
     * Convert the given URL to an absolute URL on the current document.
     *
     * If the given URL is already absolute, the URL is returned as is.
     */
    get_absolute_url(url){
        const absolute_url = new URL(url, document.URL)

        return absolute_url.href
    }
}


/*
 * Represents a single script entry in the controller's register.
 */
class RegisterEntry {
    constructor(status = null, elements = []) {
        this.status = status
        this.elements = elements
    }
}


class MaybeScript extends HTMLElement {
    constructor() {
        // Super constructor returns a reference to the element itself.
        super()
        console.debug("Custom element constructed", this)

        this.controller = get_controller_or_throw()
        this.timeout = 3000
    }

    connectedCallback() {
        console.debug("Maybe-script element connected", this)

        // Set initial visibility.
        this.set_initial_visibility()

        // Create a cut-off point for how long we wait for the loading state of the
        // expected script to be reported. The element can be configured to a
        // specific visibility at the cut-off time. By default, the visibility of
        // the failure case is used.
        this.setUpTimeout()

        // Let the controller know of this element, so that the controller can
        // inform the element once the expected script loading state is known.
        // TODO: Consider other options for this two way communication. This
        //       two-way coupling feels dirty somehow.
        this.controller.handle_maybe_script_element_connected(this)
    }

    /*
     * Handle the status code of the loading of the expected script.
     */
    handle_expected_script_loading_status(status_code) {
        console.debug("maybe-script element is handling script status", this, status_code)

        if (is_status_code_indicating_successful_script_loading(status_code)) {
            this.handle_expected_script_loading_success()

            // If the script was successful, it might need to so some work before this element should
            // change visibility. We set up a handler for the document load event that can be used
            // to define the visibility after the load event.
            window.addEventListener("load", () => {this.handleLoadAfterSuccess()})
        } else {
            this.handleFailure()
        }

        // We already got our result. No need to wait anymore.
        this.clearTimeout()
    }

    /*
     * Set the initial visibility of the element.
     *
     * Note: this is already the second step. This step only runs when JS is available.
     * To configure the immediate visibility for the no-JS case, directly apply (or not)
     * the `hidden` attribute to the element.
     */
    set_initial_visibility() {
        console.debug("Setting initial visibility of maybe-script element...", this)
        this.runAttributeAction("on:init")
    }

    handle_expected_script_loading_success() {
        console.debug("Expected script loaded successfully. Handling it...", this)
        this.runAttributeAction("on:success")
    }

    /*
     * Handle the load event after successful loading of a script.
     *
     * This may be helpful when an action should be delayed until the script has not only been loaded,
     * but also had time to run.
     */
    handleLoadAfterSuccess() {
        console.debug("Document loaded after expected script was successfully loaded. Handling it...", this)
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


class InvalidAttributeValue extends Error {
}


main();

