<template>
  <el-row :gutter="20" class="container">
    <el-col :span="18">
      <div class="jtk-demo-main">
        <div class="jtk-demo-canvas canvas-wide nn-map jtk-surface jtk-surface-nopan" id="board">
          <div v-for="node in nodes"
               :id="node.name"
               class="window">
            {{ node.name }}
          </div>
        </div>
      </div> 
      <div id="list"></div>
    </el-col>
    <el-col :span="6">
      <el-col :span="24">
        <el-button type="primary" @click="addPoint">Add Operation</el-button>
      </el-col>
    </el-col>
  </el-row>
</template>

<script>
import '../assets/jsplumb/style/jsplumbtoolkit-defaults.css'
import '../assets/jsplumb/style/main.css'
import '../assets/jsplumb/style/jsplumbtoolkit-demo.css'
import '../assets/jsplumb/style/demo.css'

const jsPlumb = require("jsplumb")

export default {
  name: 'Graph',
  data () {
    return {
      nodeTypes: {
        init: ['conv2d', 'linear', 'dropout2d'],
        forward: ['relu', 'max_pool2d', 'view', 'log_softmax'],
        others: ['input', 'output']
      },
      nodes: [
        {
          name: 'conv2d_1',
          type: 'conv2d',
        },
        {
          name: 'linear_1',
          type: 'linear',
        },
        {
          name: 'dropout2d_1',
          type: 'dropout2d',
        },
        {
          name: 'relu_1',
          type: 'relu',
        },
        {
          name: 'max_pool2d_1',
          type: 'max_pool2d',
        }
      ]
    }
  },
  methods: {
    addPoint () {
      this.nodes.push({
        name: 'log_softmax_1',
        type: 'log_softmax',
      })
      setTimeout(() => {
        console.log(jsPlumb.getSelector(".nn-map #" + 'log_softmax_1'))
        console.log(this)
        this.jsPlumbObj.instance.draggable(jsPlumb.getSelector(".nn-map #" + 'log_softmax_1'))
      })
    }
  },
  beforeRouteEnter (to, from, next) {
    next (vm => {
      vm.jsPlumbObj = {}
      jsPlumb.ready(function () {
        var instance = jsPlumb.getInstance({
          DragOptions: { cursor: 'pointer', zIndex: 2000 },
          PaintStyle: { stroke: '#666' },
          EndpointHoverStyle: { fill: "orange" },
          HoverPaintStyle: { stroke: "orange" },
          EndpointStyle: { width: 20, height: 16, stroke: '#666' },
          Endpoint: "Rectangle",
          Anchors: ["TopCenter", "TopCenter"],
          Container: "canvas"
        });

        // suspend drawing and initialise.
        instance.batch(function () {

          // bind to connection/connectionDetached events, and update the list of connections on screen.
          instance.bind("connection", function (info, originalEvent) {
            updateConnections(info.connection);
          });
          instance.bind("connectionDetached", function (info, originalEvent) {
            updateConnections(info.connection, true);
          });

          instance.bind("connectionMoved", function (info, originalEvent) {
            //  only remove here, because a 'connection' event is also fired.
            // in a future release of jsplumb this extra connection event will not
            // be fired.
            updateConnections(info.connection, true);
          });

          instance.bind("click", function (component, originalEvent) {
            alert("click!")
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
              fill: "transparent",
              radius: 7,
              strokeWidth: 1
            },
            isSource: true,
            reattach: true,
            scope: "blue",
            // connectorStyle: {
            //   strokeWidth: 5,
            //   stroke: '#7AB02C'
            // },
            connectorStyle: connectorPaintStyle,
            hoverPaintStyle: endpointHoverStyle,
            connectorHoverStyle: connectorHoverStyle,
            isTarget: true,
            beforeDrop: function (params) {
              return confirm("Connect " + params.sourceId + " to " + params.targetId + "?");
            },
            dropOptions: dropOptions
          }

          // setup some empty endpoints.  again note the use of the three-arg method to reuse all the parameters except the location
          // of the anchor (purely because we want to move the anchor around here; you could set it one time and forget about it though.)
          var e1 = instance.addEndpoint('linear_1', { anchor: [0.5, 1, 0, 1] }, endPointStyle);

          // setup some DynamicAnchors for use with the blue endpoints
          // and a function to set as the maxConnections callback.
          var anchors = [
            [1, 0.2, 1, 0],
            [0.8, 1, 0, 1],
            [0, 0.8, -1, 0],
            [0.2, 0, 0, -1]
          ],
          maxConnectionsCallback = function (info) {
            alert("Cannot drop connection " + info.connection.id + " : maxConnections has been reached on Endpoint " + info.endpoint.id);
          };

          var e1 = instance.addEndpoint("linear_1", { anchor: anchors }, endPointStyle);

          e1.bind("linear_1", maxConnectionsCallback);

          var e2 = instance.addEndpoint('dropout2d_1', { anchor: [0.5, 1, 0, 1] }, endPointStyle);
          // again we bind manually. it's starting to get tedious.  but now that i've done one of the blue endpoints this way, i have to do them all...
          e2.bind("maxConnections", maxConnectionsCallback);
          instance.addEndpoint('dropout2d_1', { anchor: "RightMiddle" }, endPointStyle);

          var e3 = instance.addEndpoint("relu_1", { anchor: [0.25, 0, 0, -1] }, endPointStyle);
          e3.bind("maxConnections", maxConnectionsCallback);
          instance.addEndpoint("relu_1", { anchor: [0.75, 0, 0, -1] }, endPointStyle);

          var e4 = instance.addEndpoint("max_pool2d_1", { anchor: [1, 0.5, 1, 0] }, endPointStyle);
          e4.bind("maxConnections", maxConnectionsCallback);
          instance.addEndpoint("max_pool2d_1", { anchor: [0.25, 0, 0, -1] }, endPointStyle);

          // make .window divs draggable
          instance.draggable(jsPlumb.getSelector(".nn-map .window"));

          // add endpoint of type 3 using a selector.
          instance.addEndpoint(jsPlumb.getSelector(".nn-map .window"), endPointStyle);

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
          });
        });

        jsPlumb.fire("jsPlumbDemoLoaded", instance);

        vm.jsPlumbObj.instance = instance
      })
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


</style>
