const fs = require("fs");

let dest = "dist/";

let fileList = [
    "package.json",
    ".gitignore",
    "package-lock.json",
    "README.md",
];

for (let file of fileList) {
    console.log("Copy", dest + file)
    fs.copyFileSync(file,  dest + file)
}


