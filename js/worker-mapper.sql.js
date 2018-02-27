var sqlJSWorkerMapper = function (worker) {
    var _id = 2;
    var _cb = {};
    var timeout = 30 * 1000;
    var timer = setInterval(function () {
        var i, time = new Date().valueOf();
        for (i in _cb) {
            if (_cb[i].time + timeout < time) {
                delete _cb[i];
            }
        }
    }, 1000);
    worker.onmessage = function (ev) {
        if (ev.data && ev.data.id) {
            if (ev.data.id in _cb) {
                _cb[ev.data.id].callback(
                    ev.data.error ? Error(ev.data.error) : undefined,
                    ev.data.result
                );
            }
        }
    };
    var workerTask = function (action, data, cb) {
        var id = ++_id;
        _cb[id] = {
            time : new Date().valueOf(),
            callback : cb || console.log
        };
        worker.postMessage({
            id : id,
            action : action,
            params : data
        });
        return id;
    };
    return {
        worker : function () {
            return worker;
        },
        create_function : function (name, parts, callback) {
            return workerTask(
                "create_function",
                {
                    name : name,
                    parts: parts
                },
                callback
            );
        },
        open : function (buffer, callback) {
            return workerTask(
                "open",
                {
                    buffer : buffer
                },
                callback
            );
        },
        close : function (callback) {
            return workerTask(
                "close",
                {},
                callback
            );
        },
        run : function (sql, callback) {
            return workerTask(
                "run",
                {
                    sql : sql
                },
                callback
            );
        },
        exec : function (sql, callback) {
            return workerTask(
                "exec",
                {
                    sql : sql
                },
                callback
            );
        },
        each : function (sql, params, callback, done) {
            return workerTask(
                "each",
                {
                    sql : sql,
                    params : params
                },
                function (err, data) {
                    if (err) {
                        return console.error(err);
                    }

                    if (data.finished) {
                        if (done) done();
                    } else {
                        callback(data.row)
                    }
                }
            );
        }
    };
};