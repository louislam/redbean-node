# Work with Express

## Simple Task List

Express + RedBeanNode (SQLite)

Thanks, RunKit! You can try this web app on your browser. Scroll down to the **bottom right corner** for the **URL**.  

You can modify this script too! RunKit is amazing!

```javascript
// Loading the source code, please wait...
```

<div id="my-element"></div>

<script>
fetch("/example/express.txt")
    .then((res) => res.text())
    .then((src) => { 
        let notebook = RunKit.createNotebook({
            element: document.querySelector("#my-element"),
            source: src,
            mode: 'endpoint',
            onLoad: (arg) => {
                    document.querySelector("pre[data-lang=\"javascript\"]").remove();
            }
        });
        

        console.log("Loaded Source Code");
    })
</script>
