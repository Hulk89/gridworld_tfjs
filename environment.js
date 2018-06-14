class GameObject {
  constructor(x, y, color_idx) {
    this.x = x;
    this.y = y;
    this.color_idx = color_idx;
  }

  getPos() {
    return [this.x, this.y];
  }

  setPos(x, y) {
    this.x = x;
    this.y = y;
  }
  getColor() {
    return this.color_idx;
  }
}


class Environment {
  constructor(width, height, num_enemy=1, locs) {
    this.width = width;
    this.height = height;
    this.num_enemy = num_enemy;
    this.end_frame = 30;
    //reward
    this.gameover_reward = -2
    this.finish_reward = 10
    this.step_reward = -0.01
    this.time_over_reward = -2
    
    this.locs = locs;

    this.data = zeros2D(this.height, this.width)
    this.initializeGame()
  }

  initialize_display() {
    for( var i=0 ; i < this.width ; i++) {
      for( var j=0 ; j < this.height ; j++) {
        this.data[j][i] = 0
      }
    }
  }
  
  
  
  initializeGame() {
    this.frame = 0;
    this.initialize_display()
    // 정해진 게임을 계속 돌림
    var locs = this.locs
    this.agent = new GameObject(locs[0][0], locs[0][1], 3)
    this.goal =  new GameObject(locs[1][0], locs[1][1], 2)
    this.enemies = []
    for (var i = 0 ; i < this.num_enemy ; i++){
      var enemy = new GameObject(locs[2+i][0], locs[2+i][1], 1)
      this.enemies.push(enemy)
    }
    
    this.end = false
    this.objectsToData()
  }
  
  objectToData(obj) {
    var pos = obj.getPos()
    this.data[pos[1]][pos[0]] = obj.getColor()
  }
  objectsToData() {
    this.initialize_display()

    this.objectToData(this.goal)
    this.enemies.forEach( e => {
      this.objectToData(e)
    })
    this.objectToData(this.agent)
  }
  isSamePos(pos1, pos2) {
    if (pos1[0] == pos2[0] && pos1[1] == pos2[1]) {
      return true
    }
    else {
      return false
    }
  }
  next_state(action) {
    var actions = {"up":[0, -1], "down":[0, 1], "left":[-1, 0],"right":[1, 0]}
    
    /* new position 구하기 */
    var new_pos = this.agent.getPos()
    new_pos[0] += actions[action][0]
    new_pos[1] += actions[action][1]
    new_pos[0] = Math.min(Math.max(0, new_pos[0]), this.width-1)
    new_pos[1] = Math.min(Math.max(0, new_pos[1]), this.height-1)

    /* 위치 이동 */
    this.agent.setPos(new_pos[0], new_pos[1])

    /* rendering */
    this.objectsToData()


    /* game end 조건 */
    if (this.isSamePos(this.agent.getPos(), this.goal.getPos())){
      console.log("Game clear")
      this.end = true;
      return this.finish_reward
    }
    for(var i=0 ; i < this.enemies.length ; i++){
      if (this.isSamePos(this.agent.getPos(), 
                         this.enemies[i].getPos())){
        console.log("Game over")
        this.end = true;
        return this.gameover_reward
      }
    }
    if ( this.frame >= this.end_frame){
      console.log("Game over with frame overflow")
      this.end = true;
      return this.time_over_reward
    }
    /* next frame */
    this.frame += 1
    return this.step_reward
  }

  step(action) {
    var reward = this.next_state(action)
    /* return next_state */
    return {"reward": reward, 
            "state": this.data,
            "done": this.end,
            "frame": this.frame}
  }
}

