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

const Util = {
    delegate: delegate,
};

export { Util };
