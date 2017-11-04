import Vue from 'vue'
import Router from 'vue-router'
import Graph from '@/components/Graph'
import Perform from '@/components/Perform'

Vue.use(Router)

export default new Router({
  routes: [{
      path: '/',
      name: 'Graph',
      component: Graph
    },
    {
      path: '/perform',
      name: 'Perform',
      component: Perform
    }
  ]
})