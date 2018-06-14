function makeInput(data) {
    var input = tf.tensor3d(data, [1, this.height, this.width])
    var flatten = input.reshape([1, this.width*this.height])
    input.dispose()
    return flatten
}

function make_model(lr) {
    const model = tf.sequential();
    
    model.add(tf.layers.dense({
        inputShape: [this.width*this.height],
        units: 128,
        activation: 'relu',
        kernelInitializer: 'varianceScaling'
    }));
    model.add(tf.layers.dense({
        units: 128,
        activation: 'relu',
        kernelInitializer: 'varianceScaling'
    }));
    model.add(tf.layers.dense({
        units: 128,
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


class DeepSarsaAgent {
    constructor(width, height) {
        this.discount_factor = 0.9
        this.learning_rate = 0.001
        
        this.epsilon_decay = 0.9998
        this.epsilon_min = 0.01
        this.epsilon = 1.0
        //////////////make model////////////////
        this.width = width
        this.height = height
        this.model = make_model(this.learning_rate)
        ////////////////////////////////////////
        this.num_frame = 0
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
            actions = softmax(actions, 0.1)
            
            input_data.dispose()
            result.dispose()
            return {type: "network_output", actions: actions}
        }
    }
    async train_model(state, action, reward, next_state, next_action, done) {
        if (this.epsilon > this.epsilon_min) {
            this.epsilon *= this.epsilon_decay
        }

        state = makeInput(state)
        next_state = makeInput(next_state)

        var target = this.model.predict(state)
        var target_val = this.model.predict(next_state)
        
        var q_res = await target.data()
        var target_reward = (await target_val.data())
        target_reward = target_reward[next_action]
        if (done){
            q_res[action] = reward
        }
        else {
            q_res[action] = reward + this.discount_factor * target_reward
        }
        
        // q의 value update
        var res = Array.from(q_res);
        var q = tf.tensor2d(res, [1, 4])
        
        const h = await this.model.fit(state, q, {epoch: 1})
        
        this.num_frame += 1
        if (this.num_frame % 100 == 0) {
            log_area.innerHTML += "loss: " + h.history.loss[0] + "\n"
            log_area.scrollTop = log_area.scrollHeight;    
        }
        state.dispose()
        next_state.dispose()
        target.dispose()
        target_val.dispose()
        q.dispose()
        
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
}

  
async function train(agent, width, height, num_enemies, locs) {
    var env = new Environment(width, height, num_enemies, locs)
    var data = env.data
    var num_ep = 5000;
  
    for (var i_ep=0; i_ep < num_ep ; i_ep++){
      env.initializeGame();
      data = env.data
      var state = [arrayClone(data)]
      var result, action, res
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
        next_action = await agent.get_action(next_state)
  
        await agent.train_model(state, action, reward, next_state, next_action, done)
        
        state = [arrayClone(data)]
        score += reward

        await tf.nextFrame();
      }
      
      log_area.innerHTML += i_ep + "th episode ended. score: " + score.toFixed(3) + "\n"
      log_area.scrollTop = log_area.scrollHeight;
    }
    //save_result = await model.save('localstorage://my-model');
  }
  
