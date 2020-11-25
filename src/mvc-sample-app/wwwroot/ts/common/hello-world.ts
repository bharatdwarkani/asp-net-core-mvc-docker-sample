class Alertbox {
    constructor() {
        let btn = document.getElementById("button");
        btn.addEventListener("click", (e: Event) => this.btnClickHandler());
    }
    btnClickHandler() {
        alert("Hello world loaded from typescript");
        console.log("Hello world loaded from typescript");
    }
}

// start the app
new Alertbox();