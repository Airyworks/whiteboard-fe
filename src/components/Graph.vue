<template>
  <el-row :gutter="20" class="container">
    <div id="board-bar">
      <div class="jtk-demo-main">
        <div class="jtk-demo-canvas canvas-wide nn-map jtk-surface jtk-surface-nopan" id="board">
          <div v-for="node in nodes"
               :id="node.name"
               class="window node"
               :style="node.style || ''">
            <i class="el-icon-edit node-edit" @click="focusNode(node.name)"></i>
            {{ node.name }}
            <ul>
              <li v-for="(value, key) in node.param">{{key}}: {{value}}</li>
            </ul>
          </div>
        </div>
      </div> 
    </div>
    <div id="menu-bar">
      <el-col :span="24" id="main-menu" v-show="!subMenu.show">
        <div id="new-opration-group">
          <el-select v-model="selectedTemplate" filterable placeholder="Templates">
            <el-option
              v-for="(template, key) in templates"
              :key="template.name"
              :label="template.name"
              :value="key">
            </el-option>
          </el-select>
          <el-button id="new-opration-btn" type="primary" @click="initGraph" :disabled="false && !selectedTemplate">Initial</el-button>
          <br/><br/>
          <el-select v-model="selectedNodeType" filterable placeholder="Node type">
            <el-option
              v-for="item in nodeTypes"
              :key="item.label"
              :label="item.label"
              :value="item.value">
            </el-option>
          </el-select>
          <el-button id="new-opration-btn" type="primary" @click="addPoint" :disabled="!selectedNodeType">Add</el-button>
          <br/><br/>
          <el-select v-model="selectedLossFunction" filterable placeholder="Loss Function">
            <el-option
              v-for="item in lossFunctions"
              :key="item"
              :label="item"
              :value="item">
            </el-option>
          </el-select>
          <br><br>
          <el-select v-model="selectedDataset" filterable placeholder="Dataset">
            <el-option
              v-for="item in datasets"
              :key="item"
              :label="item"
              :value="item">
            </el-option>
          </el-select>
          <br><br>
          <el-form ref="form" :model="param" label-width="80px">
            <el-form-item
              v-for="(value, key) in param"
              :label="key"
              v-bind:data="value"
              v-bind:key="key"
              style="width: 290px;">
              <el-input v-model="param[key]"></el-input>
            </el-form-item>
          </el-form>
          <br><br>
          <el-button id="complete-network" type="primary" @click="submitNetwork">Submit Network</el-button>
        </div>
      </el-col>
      <el-col :span="24" id="sub-menu" v-show="subMenu.show">
        <br>
        <span>Editting: {{ subMenu.nowEdit.name }}</span>  
        <br><br>
        <el-form ref="form" :model="subMenu.nowEdit" label-width="100px">
          <el-form-item
            v-for="(value, key) in subMenu.nowEdit.param"
            :label="key"
            v-bind:data="value"
            v-bind:key="key">
            <el-input v-model="subMenu.nowEdit.param[key]"></el-input>
          </el-form-item>
        </el-form>
        <el-button type="success" @click="saveChange">Save</el-button>
        <el-button type="danger" @click="undoChange">Cancel</el-button>
        <br><br>
        <span>
          Add data flow
        </span>
        <br><br>
        <el-button-group>
          <el-button type="primary" icon="el-icon-arrow-left"></el-button>
          <el-button type="primary" icon="el-icon-arrow-right"></el-button>
          <el-button type="primary" icon="el-icon-arrow-up"></el-button>
          <el-button type="primary" icon="el-icon-arrow-down"></el-button>
        </el-button-group>
      </el-col>
    </div>
  </el-row>
</template>

<script>
import '../assets/jsplumb/style/jsplumbtoolkit-defaults.css'
import '../assets/jsplumb/style/main.css'
import '../assets/jsplumb/style/jsplumbtoolkit-demo.css'
import '../assets/jsplumb/style/demo.css'

const dcopy = require('deep-copy')
const jsPlumb = require("jsplumb")
const defaultParam = require('../assets/config/nn.param.json')
const templates = require('../assets/config/templates.json')
const nodetypes = require('../assets/config/nodetypes.json')
const configs = require('../assets/config/config.json')
const subMenu = {
        show: false,
        nowEditName: undefined,
        nowEdit: { param: {} }
      }

const nodeTypeSet = {
        init: ['conv2d', 'linear', 'dropout2d'],
        forward: ['max_pool2d', 'view'],
        others: ['input', 'output', 'relu', 'log_softmax']
      }

const defaultEndpoints = {top: [], left: [], right: [], bottom: []}

// import networks
templates.mnist.data = require('../assets/config/networks/mnist.json')

// attatch endpoint arr to nodes
for (let i in templates) {
  for (let j in templates[i].data.nodes) {
    templates[i].data.nodes[j].endpoints = dcopy(defaultEndpoints)
  }
}

export default {
  name: 'Graph',
  data () {
    return {
      templates: dcopy(templates),
      selectedTemplate: undefined,
      lossFunctions: Object.assign({}, configs.lossFunctions),
      selectedLossFunction: 'nll_loss',
      datasets: Object.assign({}, configs.dataset),
      selectedDataset: 'mnist',
      param: Object.assign({}, configs.param),
      connections: [],
      nodeTypes: dcopy(nodetypes),
      selectedNodeType: undefined,
      nodes: [],
      subMenu: dcopy(subMenu)
    }
  },
  methods: {
    addPoint (e) {
      if (this.selectedNodeType) {
        const group = this.selectedNodeType.split('.')[0]
        const type = this.selectedNodeType.split('.')[1]
        let count = 1
        for (let i = 0; i < this.nodes.length; i++) {
          if (type === this.nodes[i].type && count <= this.nodes[i].count) {
            count = this.nodes[i].count + 1
          }
        }
        const newNode = {
          name: `${type}_${count}`,
          type,
          count,
          param: Object.assign({}, )
        }
        console.log('created:', newNode)
        let newNodeIndex = this.nodes.push(newNode)
        setTimeout(() => {
          this.jsPlumbObj.instance.draggable(jsPlumb.getSelector(".nn-map #" + newNode.name))
          let leftEndpoint = this.jsPlumbObj.instance.addEndpoint(this.nodes[newNodeIndex - 1].name,
            this.jsPlumbObj.endPointStyle, {
            anchor: this.jsPlumbObj.defaultAnchors.left
          })
          let rightEndpoint = this.jsPlumbObj.instance.addEndpoint(this.nodes[newNodeIndex - 1].name,
            this.jsPlumbObj.endPointStyle, {
            anchor: this.jsPlumbObj.defaultAnchors.right
          })
          this.nodes[newNodeIndex - 1].endpoints.left.push(leftEndpoint)
          this.nodes[newNodeIndex - 1].endpoints.right.push(rightEndpoint)
        })
        this.selectedNodeType = undefined
      } else {
        // no selected opration
      }
    },
    focusNode (name) {
      console.log(name)
      if (!this.subMenu.show) {
        this.subMenu.show = true
        this.subMenu.nowEditName = name
        for (let i = 0; i < this.nodes.length; i++) {
          if (this.subMenu.nowEditName === this.nodes[i].name) {
            this.subMenu.nowEdit = Object.assign({}, this.nodes[i])
            this.subMenu.nowEdit.param = Object.assign({}, this.nodes[i].param)
          }
        }
      }
    },
    saveChange () {
      for (let i = 0; i < this.nodes.length; i++) {
        if (this.subMenu.nowEditName === this.nodes[i].name) {
          this.nodes[i].param = Object.assign({}, this.subMenu.nowEdit.param)
        }
      }
      this.subMenu = Object.assign({}, subMenu)
    },
    undoChange () {
      this.subMenu = Object.assign({}, subMenu)
    },
    initGraph () {
      this.connections = dcopy(this.templates[this.selectedTemplate].data.connections)
      const nodeList = dcopy(this.templates[this.selectedTemplate].data.nodes)
      const orderNodeList = []
      for (let i = 0; i < this.templates[this.selectedTemplate].data.connections.length; i++) {
        const nodeName = this.templates[this.selectedTemplate].data.connections[i].source
        for (let j = 0; j < nodeList.length; j++) {
          if (nodeList[j]['name'] == nodeName) {
            orderNodeList.push(nodeList[j])
            nodeList.splice(j, 1)
            break;
          }
        }
      }
      for (let i = 0; i < nodeList.length; i++) {
        orderNodeList.push(nodeList[i])
      }
      this.nodes = orderNodeList
      setTimeout(() => {
        this.jsPlumbObj.instance.draggable(jsPlumb.getSelector('.nn-map .node'))
      })
      let top = 10, left = 10, order = 1
      for (let i = 0; i < this.nodes.length; i++) {
        this.nodes[i].left = left
        this.nodes[i].top = top
        this.nodes[i].style = `top: ${top}px; left: ${left}px;`
        left += 200 * order
        if (left >= 900 || left <= 5) {
          left -= 200 * order
          order = -order
          top += 150
        }
        while (left >= 900 || left <= 5) {
          if (left >= 900) {
            left -= 200
          } else {
            left += 200 
          }
        }
      }
      setTimeout(() => {
        for(let i = 0; i < this.nodes.length; i++) {
          let leftEndpoint = this.jsPlumbObj.instance.addEndpoint(this.nodes[i].name, this.jsPlumbObj.endPointStyle, {
            anchor: this.jsPlumbObj.defaultAnchors.left
          })
          let rightEndpoint = this.jsPlumbObj.instance.addEndpoint(this.nodes[i].name, this.jsPlumbObj.endPointStyle, {
            anchor: this.jsPlumbObj.defaultAnchors.right
          })
          this.nodes[i].endpoints.left.push(leftEndpoint)
          this.nodes[i].endpoints.right.push(rightEndpoint)
        }
      })
      setTimeout(() => {
        for (let i = 0; i < this.connections.length; i++) {
          let source, target
          for (let j = 0; j < this.nodes.length; j++) {
            if (this.nodes[j].name == this.connections[i].source) {
              source = this.nodes[j]
            }
            if (this.nodes[j].name == this.connections[i].target) {
              target = this.nodes[j]
            }
          }
          if (source.left < target.left) {
            this.jsPlumbObj.instance.connect({
              source: source.endpoints.right[0],
              target: target.endpoints.left[0]
            })
          } else if (source.left > target.left) {
            this.jsPlumbObj.instance.connect({
              source: source.endpoints.left[0],
              target: target.endpoints.right[0]
            })
          } else {
            if (source.left < 500) {
              this.jsPlumbObj.instance.connect({
                source: source.endpoints.left[0],
                target: target.endpoints.left[0]
              })
            } else {
              this.jsPlumbObj.instance.connect({
                source: source.endpoints.right[0],
                target: target.endpoints.right[0]
              })
            }
          }
        }
      })
    },
    submitNetwork () {
      const data = {
        init: {},
        forward: {}
      }
      const connections = this.jsPlumbObj.instance.getAllConnections()
      let start = 'input_1', end = 'output_1'
      const flow = []
      while (start != end) {
        for (let i = 0; i < connections.length; i++) {
          if (connections[i].sourceId == start) {
            flow.push(connections[i].sourceId)
            start = connections[i].targetId
          }
          if (connections[i].targetId == end) {
            flow.push(connections[i].targetId)
          }
        }
      }
      data.flow = flow.join('>>')
      for (let i = 0; i < flow.length; i++) {
        for (let j = 0; j < this.nodes.length; j++) {
          if (flow[i] == this.nodes[j].name) {
            if (nodeTypeSet.init.indexOf(this.nodes[j].type) >= 0) {
              const order = configs.dataOrder[this.nodes[j].type],
                    orderParam = [this.nodes[j].type]
              for (let k = 0; k < order.length; k++) {
                orderParam.push(this.nodes[j].param[order[k]])
              }
              data.init[this.nodes[j].name] = orderParam.join(',')
            } else if (nodeTypeSet.forward.indexOf(this.nodes[j].type) >= 0) {
              const order = configs.dataOrder[this.nodes[j].type],
                    orderParam = [this.nodes[j].type]
              for (let k = 0; k < order.length; k++) {
                orderParam.push(this.nodes[j].param[order[k]])
              }
              data.forward[this.nodes[j].name] = orderParam.join(',')
            } else {
              // console.log('others', this.nodes[j].type)
            }
          }
        }
      }
      data.loss = this.selectedLossFunction
      data.dataset = this.selectedDataset
      data.param = `[global]
lr = ${this.param.lr}
momentum = ${this.param.momentum}
iter_num = ${this.param.iter_num}
batch_size = ${this.param.batch_size}`
      this.$http.post('http://localhost:12450/task', data, { credentials: true }).then(resp => {
        alert('Submit success')
        this.$router.push('/perform')
      })
    }
  },
  beforeRouteEnter (to, from, next) {
    next (vm => {
      vm.jsPlumbObj = {}
      function initJsPlumb() {
        jsPlumb.ready(function () {
          var instance = jsPlumb.getInstance({
            DragOptions: { cursor: 'pointer', zIndex: 2000 },
            PaintStyle: { stroke: '#666' },
            EndpointHoverStyle: { fill: "orange" },
            HoverPaintStyle: { stroke: "orange" },
            EndpointStyle: { width: 20, height: 16, stroke: '#666' },
            Endpoint: "Rectangle",
            Anchors: ["TopCenter", "TopCenter"],
            Container: "canvas",
            ConnectionOverlays: [
              [ "Arrow", {
                location:1,
                id:"arrow",
                length:8,
                foldback:1
              }]
            ]
          });
          window.instance = instance
          // suspend drawing and initialise.
          instance.batch(function () {

            // bind to connection/connectionDetached events, and update the list of connections on screen.
            instance.bind("connection", function (info, originalEvent) {
              // updateConnections(info.connection);
              // console.log(info.connection)
            });
            instance.bind("connectionDetached", function (info, originalEvent) {
              // updateConnections(info.connection, true);
              // console.log(info.connection)
            });

            instance.bind("connectionMoved", function (info, originalEvent) {
              //  only remove here, because a 'connection' event is also fired.
              // in a future release of jsplumb this extra connection event will not
              // be fired.
              // updateConnections(info.connection, true);
            });

            instance.bind("dblclick", function (component, originalEvent) {
              instance.deleteConnection(component)
            });

            // configure some drop options for use by all endpoints.
            var dropOptions = {
              tolerance: "touch",
              hoverClass: "dropHover",
              activeClass: "dragActive"
            };

            //
            // first example endpoint.  it's a 25x21 rectangle (the size is provided in the 'style' arg to the Endpoint),
            // and it's both a source and target.  the 'scope' of this Endpoint is 'exampleConnection', meaning any connection
            // starting from this Endpoint is of type 'exampleConnection' and can only be dropped on an Endpoint target
            // that declares 'exampleEndpoint' as its drop scope, and also that
            // only 'exampleConnection' types can be dropped here.
            //
            // the connection style for this endpoint is a Bezier curve (we didn't provide one, so we use the default), with a strokeWidth of
            // 5 pixels, and a gradient.
            //
            // there is a 'beforeDrop' interceptor on this endpoint which is used to allow the user to decide whether
            // or not to allow a particular connection to be established.
            //
            var connectorPaintStyle = {
              strokeWidth: 2,
              stroke: "#61B7CF",
              joinstyle: "round",
              outlineStroke: "white",
              outlineWidth: 2
            },
        // .. and this is the hover style.
            connectorHoverStyle = {
              strokeWidth: 3,
              stroke: "#216477",
              outlineWidth: 5,
              outlineStroke: "white"
            },
            endpointHoverStyle = {
              fill: "#216477",
              stroke: "#216477"
            }

            let endPointStyle = {
              endpoint: "Dot",
              paintStyle: {
                stroke: '#7AB02C',
                fill: "#7AB02C",
                radius: 7,
                strokeWidth: 1
              },
              isSource: true,
              reattach: true,
              scope: "blue",
              connector: ["Flowchart", {
                  stub: [0, 30], gap: 0, cornerRadius: 5, alwaysRespectStubs: true }
              ],
              connectorStyle: connectorPaintStyle,
              hoverPaintStyle: endpointHoverStyle,
              connectorHoverStyle: connectorHoverStyle,
              isTarget: true,
              beforeDrop: function (params) {
                return true
                return confirm("Connect " + params.sourceId + " to " + params.targetId + "?");
              },
              dropOptions: dropOptions
            }

            vm.jsPlumbObj.endPointStyle = endPointStyle

            // setup some DynamicAnchors for use with the blue endpoints
            // and a function to set as the maxConnections callback.
            let maxConnectionsCallback = function (info) {
              alert("Cannot drop connection " + info.connection.id + " : maxConnections has been reached on Endpoint " + info.endpoint.id);
            }
            

            // make .window divs draggable
            instance.draggable(jsPlumb.getSelector(".nn-map .window"));

            var hideLinks = jsPlumb.getSelector(".nn-map .hide");
            instance.on(hideLinks, "click", function (e) {
              instance.toggleVisible(this.getAttribute("rel"));
              jsPlumbUtil.consume(e);
            });

            var dragLinks = jsPlumb.getSelector(".nn-map .drag");
            instance.on(dragLinks, "click", function (e) {
              var s = instance.toggleDraggable(this.getAttribute("rel"));
              this.innerHTML = (s ? 'disable dragging' : 'enable dragging');
              jsPlumbUtil.consume(e);
            });

            var detachLinks = jsPlumb.getSelector(".nn-map .detach");
            instance.on(detachLinks, "click", function (e) {
              instance.detachAllConnections(this.getAttribute("rel"));
              jsPlumbUtil.consume(e);
            });

            instance.on(document.getElementById("clear"), "click", function (e) {
              instance.detachEveryConnection();
              showConnectionInfo("");
              jsPlumbUtil.consume(e);
            })
          })

          jsPlumb.fire("jsPlumbDemoLoaded", instance);

          vm.jsPlumbObj.instance = instance
          vm.jsPlumbObj.defaultAnchors = {
              top: [0.25, 0, 0, 0],
              bottom: [0.25, 1, 0, 1],
              left: [0, 0.25, 0, 0],
              right: [1, 0.25, 1, 0]
            }
        })
      }
      initJsPlumb()
      vm.jsPlumbObj.initJsPlumb = initJsPlumb
    })
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="stylus" scoped>

.jtk-demo-canvas
  overflow: auto !important
  &::-webkit-scrollbar-track
    background-color: #F5F5F5
  &::-webkit-scrollbar
    width: 10px
    height: 10px
    background-color: #F5F5F5
  &::-webkit-scrollbar-thumb
    background-color: rgb(96, 125, 139);	
    background-image: -webkit-linear-gradient(45deg,
                                              rgba(255, 255, 255, .2) 25%,
                          transparent 25%,
                          transparent 50%,
                          rgba(255, 255, 255, .2) 50%,
                          rgba(255, 255, 255, .2) 75%,
                          transparent 75%,
                          transparent) 

#board
  border: none !important
  background-size: 25px 25px
  background-color: white
  background-image: -webkit-linear-gradient(transparent 50%, rgba(183, 183, 183, .5) 50%, rgba(183, 183, 183, .5)),
                    -webkit-linear-gradient(0deg, transparent 50%, rgba(183, 183, 183, .5) 50%, rgba(183, 183, 183, .5))
  background-image: -moz-linear-gradient(transparent 50%, rgba(183, 183, 183, .5) 50%, rgba(183, 183, 183, .5)),
                    -moz-linear-gradient(0deg, transparent 50%, rgba(183, 183, 183, .5) 50%, rgba(183, 183, 183, .5))
  background-image: linear-gradient(transparent 50%, rgba(183, 183, 183, .5) 50%, rgba(183, 183, 183, .5)),
                    linear-gradient(90deg, transparent 50%, rgba(183, 183, 183, .5) 50%, rgba(183, 183, 183, .5))
  -pie-background: linear-gradient(transparent 50%, rgba(183, 183, 183, .5) 50%, rgba(183, 183, 183, .5)) 0 0 / 50px 50px,
                  linear-gradient(90deg, transparent 50%, rgba(183, 183, 183, .5) 50%, rgba(183, 183, 183, .5)) 0 0 / 50px 50px white
  & .jtk-node
    color: #666
  & .node
    position: absolute
    padding-top: 20px
    text-align: center
    & ul
      padding: 0
    & .node-edit
      position: absolute
      right: 5px
      top: 5px

#menu-bar
  width: 350px
  float: right
  & #new-opration-group
    & #new-opration-btn
      transition: .5s

.container
  position: relative
  & #board-bar
    position: absolute
    left: 20px
    right: 370px

</style>
