function main() {
    const body = document.querySelector("body")
    if (!body) return

    console.log("Hello from main() function")
}

console.log("main.js script running")

document.addEventListener("DOMContentLoaded", main)
