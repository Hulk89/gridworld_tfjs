function makeInput(data) {
    var input = tf.tensor3d(data, [1, this.height, this.width])
    var flatten = input.reshape([1, this.width*this.height])
    input.dispose()
    return flatten
}

function makeBatchInput(data, batch_size=64) {
    var input = tf.tensor4d(data, [batch_size, 1, this.height, this.width])
    var transposed = input.reshape([batch_size, this.width*this.height])
    input.dispose()
    return transposed
}

function make_model(lr) {
    const model = tf.sequential();
    
    model.add(tf.layers.dense({
        inputShape: [this.width*this.height],
        units: 64,
        activation: 'relu',
        kernelInitializer: 'varianceScaling'
    }));
    model.add(tf.layers.dense({
        units: 64,
        activation: 'relu',
        kernelInitializer: 'varianceScaling'
    }));
    model.add(tf.layers.dense({
        units: 64,
        activation: 'relu',
        kernelInitializer: 'varianceScaling'
    }));
    model.add(tf.layers.dense({
        units:4,
        kernelInitializer: 'VarianceScaling', 
        activation: 'linear'
    }))
    model.compile({loss: 'meanSquaredError', optimizer: tf.train.adam(lr)});
    return model
}


class DQNAgent {
    constructor(width, height, batch_size=32) {
        this.discount_factor = 0.99
        this.learning_rate = 0.001
        
        this.epsilon_decay = 0.9999
        this.epsilon_min = 0.01
        this.epsilon = 1.0
        //////////////make model////////////////
        this.width = width
        this.height = height
        this.model = make_model(this.learning_rate)
        this.target_model = make_model(this.learning_rate)
        this.update_target_model()
        ////////////////////////////////////////
        this.batch_size = batch_size
        this.replay_buffer = new ReplayBuffer(2000, this.batch_size)
        this.train_start = 1000
        this.num_batch = 0
    }

    update_target_model() {
        this.target_model.setWeights(this.model.getWeights())
    }
    
    async get_action(state) {
        if (Math.random() <= this.epsilon) {
            return this.get_random_action()
        }
        else {
            var input_data = makeInput(state)
            var result = this.model.predict(input_data);
            
            var action = (await result.argMax(1).data())[0]
            
            input_data.dispose()
            result.dispose()
            return action
        }
    }
    async get_actions(state) {
        if (Math.random() <= this.epsilon) {
            var actions = [0,0,0,0]
            actions[this.get_random_action()] = 1
            return {type: "random", actions: actions}
        }
        else {
            var input_data = makeInput(state)
            var result = this.model.predict(input_data);
            
            var actions = (await result.data())  //Float32 Array with 4
            actions = Array.from(actions);
            //console.log("before softmax: " + actions)
            actions = softmax(actions, 0.1)
            //console.log("after softmax: " + actions)
            input_data.dispose()
            result.dispose()
            return {type: "network_output", actions: actions}
        }
    }
    async train_model() {
        if (this.epsilon > this.epsilon_min) {
            this.epsilon *= this.epsilon_decay
        }
        var mini_batch = this.replay_buffer.get()
  
        var states      = mini_batch["state"]
        var next_states = mini_batch["next_state"]
        var rewards     = mini_batch["reward"]
        var actions     = mini_batch["action"]
        var dones       = mini_batch["done"]

        states = makeBatchInput(states, this.batch_size)
        
        next_states = makeBatchInput(next_states, this.batch_size)

        var targets = this.model.predict(states)
        var target_vals = this.target_model.predict(next_states)
        
        var q_res = await targets.data()
        var target_max_rewards = await target_vals.max(1).data()
        
        // q의 value update
        var qs = []
        for (var i=0; i < this.batch_size ; i++) {
            var res = [q_res[4*i], q_res[4*i+1], q_res[4*i+2], q_res[4*i+3]]
            if (dones[i]) {
                res[actions[i]] = rewards[i]
            }
            else {
                res[actions[i]] = rewards[i] + this.discount_factor * target_max_rewards[i]
            }
            
            qs.push(res)
        }
        qs = tf.tensor2d(qs)
        
        const h = await this.model.fit(states, 
                                       qs, 
                                       {batchSize: this.batch_size,
                                        epochs:    1})
        this.num_batch += 1
        if (this.num_batch % 100 == 0) {
            log_area.innerHTML += "loss: " + h.history.loss[0] + "\n"
            log_area.scrollTop = log_area.scrollHeight;
        }
        states.dispose()
        next_states.dispose()
        targets.dispose()
        target_vals.dispose()
        qs.dispose()
        
    }
    get_random_action() {
        var i = Math.random()
        if (i < 0.25) {
            return 0
        }else if (i < 0.5) {
            return 1
        }
        else if (i < 0.75) {
            return 2
        }
        else {
            return 3
        }
    }
    add(state, action, reward, next_state, done) {
        this.replay_buffer.add(state, action, reward, next_state, done)
    }
    is_start_train() {
        if (this.replay_buffer.length() >= this.train_start) {
            return true
        }
        else {
            return false
        }
    }
}


  
  async function train(agent, width, height, num_enemies, locs) {
    var env = new Environment(width, height, num_enemies, locs)
    var data = env.data
    var num_ep = 5000;
  
    for (var i_ep=0; i_ep < num_ep ; i_ep++){
      env.initializeGame();
      data = env.data
      var state = [arrayClone(data)]
      var action, res
      var next_state;
      var done = false;
      var reward = 0;
      var score = 0;
  
      while (!done) {
        action = await agent.get_action(state)
        res = env.step(translateAction(action))
        data   = res["state"]
        reward = res["reward"]
        done   = res["done"]
        
        next_state = [arrayClone(data)]
        
        agent.add(state, action, reward, next_state, done)
  
        if (agent.is_start_train()) {
          await agent.train_model()
        }
        state = [arrayClone(data)]
        score += reward
        if (done) {
          agent.update_target_model()
        }
        await tf.nextFrame();
      }
      log_area.innerHTML += i_ep + "th episode ended. score: " + score.toFixed(3) + "\n"
      log_area.scrollTop = log_area.scrollHeight;
    }
    //save_result = await model.save('localstorage://my-model');
  }
  