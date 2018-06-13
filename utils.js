function zeros2D(rows, cols) {
  var array = [], row = [];
  while (cols--) row.push(0);
  while (rows--) array.push(row.slice());
  return array;
}

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

function getLocations(num, width, height) {
  var spaces = []
  for(var i=0 ; i< width ; i++) {
    for(var j=0 ; j < height; j++) {
      spaces.push([i, j])
    }
  }
  return getRandomSubarray(spaces, num)
}

function argMax(array) {
  return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
}


function arrayClone( arr ) {
  var i, copy;
  if( Array.isArray( arr ) ) {
      copy = arr.slice( 0 );
      for( i = 0; i < copy.length; i++ ) {
          copy[ i ] = arrayClone( copy[ i ] );
      }
      return copy;
  } else if( typeof arr === 'object' ) {
      throw 'Cannot clone array containing an object!';
  } else {
      return arr;
  }
}

function translateAction(action) {
  if (action == 0) {
    return 'left'
  }else if (action == 1) {
    return "down"
  }else if (action == 2) {
    return "up"
  }else{
    return "right"
  }
}

function softmax(logits, temperature) {
  var max_val = Math.max.apply(null, logits)
  var exp_sum = 0;
  for (var i = 0 ; i < logits.length ; i++) {
      exp_sum += Math.exp((logits[i]-max_val)/temperature)
  }
  var exps = []
  for (var i = 0 ; i < logits.length ; i++) {
      exps.push(Math.exp((logits[i]-max_val)/temperature)/exp_sum)
  }
  return exps
}
