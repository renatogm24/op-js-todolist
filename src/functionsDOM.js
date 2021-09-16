function createDOM(name, attrs) {
    if (name == "text") {
        const element = document.createTextNode(attrs);
        return element;
    }
    const element = document.createElement(name);
    if (!_.isEmpty(attrs)) {
        for (var key in attrs) {
            if (key == "textContent") {
                element.textContent = attrs[key];
            } else if (/\s/.test(attrs[key])) {
                let classes = attrs[key].split(" ");
                for (let index = 0; index < classes.length; index++) {
                    element.classList.add(key, classes[index]);
                }
            } else {
                element.setAttribute(key, attrs[key]);
            }
        }
    }
    return element;
}

function appendDOMs(element, array) {
    for (let index = 0; index < array.length; index++) {
        element.appendChild(array[index]);
    }
    return element;
}

export{createDOM, appendDOMs};