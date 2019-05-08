exports.pushMany = (arr, key, value) => {
    if (arr) {
        arr.forEach(x => {
            key.push(x);
            handlePulled = async()=> {
                await value.save();
            }
        });
        handlePulled();
    }
}
exports.pullMany = (arr, key, value) => {
    if (arr) {
        arr.forEach(x => {
            key.pull(x);
            handlePulled = async()=> {
                await value.save();
            }
        });
        handlePulled();
    }
}

exports.pushOne = async(obj, key, value) => {
    if (obj) {
        key.push(obj);
        await value.save();
    }
}
exports.pullOne = async(obj, key, value) => {
    if (obj) {
        key.pull(obj);
        await value.save();
    }
}