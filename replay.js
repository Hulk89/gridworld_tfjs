function getRandomSubarray(arr, size) {
    var shuffled = arr.slice(0), i = arr.length, temp, index;
    while (i--) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(0, size);
}
function getElements(arr, element) {
    // batch단위로 뽑아내기 위해..
    var list = []
    for (var i=0; i< arr.length ; i++) {
        list.push(arr[i][element])
    }
    return list
}
class ReplayBuffer {
    constructor(buffer_size = 1000,
                batch_size=64)                    
    {
        this.buffer_size = buffer_size
        this.buffer      = []
        this.batch_size  = batch_size
        
    }

    add(state, action, reward, next_state, done) {
        var element = {"state": state, 
                       "action": action, 
                       "reward": reward, 
                       "next_state": next_state,
                       "done": done}
        this.buffer.push(element)
        if (this.buffer.length > this.buffer_size) {
            this.buffer = this.buffer.slice(1)
        }
    }

    get() {
        var subArray = getRandomSubarray(this.buffer, this.batch_size)
        return {"state": getElements(subArray, "state"),
                "action": getElements(subArray, "action"),
                "reward": getElements(subArray, "reward"),
                "next_state": getElements(subArray, "next_state"),
                "done": getElements(subArray, "done")
                }
    }

    length() {
        return this.buffer.length
    }
}
/*
var reple = new ReplayBuffer(60, 32)
for (var i = 0 ; i < 180 ; i++){
    reple.add(1,1,i,2*i, true)
}

console.log(reple.buffer)
console.log(reple.get())
*/