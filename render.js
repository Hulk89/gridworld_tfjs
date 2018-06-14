function initializeView(data) {
  var canvas = d3.selectAll(".canvas")

  canvas.selectAll("div")
      .data(data)
      .enter()
      .append("div")
      .attr('class', function(d) {
        return 'raw'
      })
        .selectAll("div")
        .data(d => d)
        .enter()
        .append('div')
        .attr("class", function(d) {
          return color_classes[d]
        })
}

function draw(data) {
  var canvas = d3.selectAll(".canvas")

  canvas.selectAll(".raw")
      .data(data)
        .selectAll(".pixel")
        .data(d => d)
        .attr("class", function(d) {
          return color_classes[d]
        })
}

function initializePlot(actions) {
  var svg = d3.select(".plot")
              .append("svg")
                .attr("width", 256)
                .attr("height", 32)

  svg.selectAll('rect')
      .data(actions)
        .enter()
        .append("rect")
          .attr({
            x:      function(d, i) {return 64 * i + 1;},
            y:      function(d, i) {return 32 - Math.round(d*32)},
            width:  64-2,
            height: function(d, i) {return Math.round(d*32);},
            fill:   'green'
          })
  console.log(actions)
}

function plot(actions, action_type) {
  var color
  if (action_type == "random") {
    color = "red"
  } else {
    color = "green"
  }
  var svg = d3.select(".plot")
              .select("svg")
                
  svg.selectAll('rect')
      .data(actions)
      .transition().duration(100)
        .attr({
          x:      function(d, i) {return 64 * i + 1;},
          y:      function(d, i) {return 32 - Math.round(d*32)},
          width:  64-2,
          height: function(d, i) {return Math.round(d*32);},
          fill:   color
        })
}


/* agent 보여주기용... game.html외에 쓰인다. */
function viewModel(agent, locs) {
  var venv = new Environment(width, height, num_enemies, locs)
  venv.initializeGame()
  var data = venv.data
  var actions = [0, 0, 0, 0]
  initializeView(data)
  initializePlot(actions)
  var input_data = [arrayClone(data)]
  var done = false;
  var frame;

  function initialize() {
    venv.initializeGame()
    data = venv.data;
    draw(data)
    setTimeout(update, refresh_rate)
  }

  async function update() {
    input_data = [arrayClone(data)]
    var result = await agent.get_actions(input_data)
    actions = result.actions
    var action_type = result.type

    var action = argMax(actions)

    var res = venv.step(translateAction(action))
    data = res["state"]
    done = res["done"]
    frame = res["frame"]

    //UI update
    draw(data)
    plot(actions, action_type)
    // button들 조작..
    var buttons = document.getElementsByClassName("button")
    for( var i=0 ; i< 4 ; i++ ){
      buttons[i].classList.remove("selected")
    }
    var button = document.getElementById(translateAction(action))
    button.classList.add("selected")
    // epsilon
    var h3 = document.getElementById("eps")
    h3.innerHTML = "epsilon: " + agent.epsilon.toFixed(4)

    if (done) {  
      setTimeout(initialize, refresh_rate);
    }
    else {
      setTimeout(update, refresh_rate);
    }
  }
  setTimeout(initialize, refresh_rate);
}