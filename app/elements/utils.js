function formatAmount(val) {
    val = Math.floor(val)+'';
    return val.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
}

module.exports = {
    formatAmount : formatAmount
}