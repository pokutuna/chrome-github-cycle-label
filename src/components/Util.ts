function delegate(
    selector: string,
    handler: (event: Event) => any
): (event: Event) => any {
    return function(event: Event) {
        if (event && event.target) {
            if ((<HTMLElement>event.target).matches(selector)) {
                handler.apply(this, arguments);
            }
        }
    }
}

// like the jQuery.serializeArray()
const submittableElement  = /^(?:input|select|textarea)/i;
const notSubmittableTypes = /^(?:submit|button|image|reset|file)$/i;
const checkableTypes      = /^(?:checkbox|radio)$/i;
function serializeArray(elem: Element, params: [string, string][] = []): [string, string][] {

    // TODO add test, care fieldset
    const submittable = !elem.matches(':disabled') &&
        submittableElement.test(elem.nodeName) &&
        !notSubmittableTypes.test((<any>elem).type) &&
        ((<any>elem).checked || !checkableTypes.test((<any>elem).type));

    // why CRLF is https://www.w3.org/TR/html401/interact/forms.html#h-17.13.4.1
    if (submittable)
        params.push([(<any>elem).name, (<any>elem).value.replace(/\r?\n/g, '\r\n')]);

    const nodes = elem.childNodes;
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].nodeType === Node.ELEMENT_NODE) serializeArray(<Element>nodes[i], params);
    }

    return params;
}

const Util = {
    delegate: delegate,
    serializeArray: serializeArray
};

export { Util };
