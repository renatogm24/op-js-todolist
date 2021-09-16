function Event(name) {
    this._handlers = [];
    this.name = name;
}
Event.prototype.addHandler = function (handler) {
    this._handlers.push(handler);
};
Event.prototype.removeHandler = function (handler) {
    for (var i = 0; i < handlers.length; i++) {
        if (this._handlers[i] == handler) {
            this._handlers.splice(i, 1);
            break;
        }
    }
};
Event.prototype.fire = function (eventArgs) {
    this._handlers.forEach(function (h) {
        h(eventArgs);
    });
};

var eventAggregator = (function () {
    var events = [];

    function getEvent(eventName) {
        return events.filter(event => event.name === eventName)[0];
    }

    function publish(eventName, eventArgs) {
        var event = getEvent(eventName);

        if (!event) {
            event = new Event(eventName);
            events.push(event);
        }
        event.fire(eventArgs);
    }

    function subscribe(eventName, handler) {
        var event = getEvent(eventName);

        if (!event) {
            event = new Event(eventName);
            events.push(event);
        }

        event.addHandler(handler);
    }

    return { publish, subscribe };
})();

const publish = eventAggregator.publish;
const subscribe = eventAggregator.subscribe;

export { publish, subscribe };