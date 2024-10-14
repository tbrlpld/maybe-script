function main() {
    const body = document.querySelector("body")
    if (!body) return

    console.log("Hello")
}

console.log("main.js running")

document.addEventListener("DOMContentLoaded", main)
