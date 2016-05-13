var cache = {};
var limit = 20000;

function get(id) {
    var item = cache[id];
    if( item ) {
        if( item.type === 'object' ) {
            return JSON.parse(item.value);
        }
        return item.value;
    }
    return null;
}

function set(id, value) {
    var type = typeof value;
    if( type === 'object' ) {
        value = JSON.stringify(value);
    }
    
    cache[id] = {
        type : type,
        value : value,
        time : new Date().getTime()
    }
}

function clear() {
    var keys = Object.keys(cache);
    
    if( keys.length <= limit ) {
        return;
    }
    
    var tmp = [];
    for( var key in cache ) {
        tmp.push({
            key : key,
            time : cache[key].time
        });
    }
    
    tmp.sort(function(a, b){
        if( a.time < b.time ) return 1;
        if( a.time > b.time ) return -1;
        return 0;
    });
    
    for( var i = limit; i < tmp.length; i++ ) {
        delete cache[tmp[i].key];
    }
}

module.exports = {
    get : get,
    set : set,
    clear : clear
}