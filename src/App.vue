<template>
  <div id="app">
    <nav id="nav">
      <img id="logo" src="./assets/logo.jpg">
    </nav>
    <router-view/>
  </div>
</template>

<script>
export default {
  name: 'app'
}
</script>

<style lang="stylus" scoped>

#nav
  height: 70px
  width: 100%
  background-color: #fff
  border-bottom: 1px solid #ddd
  box-shadow: #ddd 0px 3px 3px
  text-align: center
  margin-bottom: 15px
  & #logo
    width: 50px
    height: 50px
    margin: 10px
  
</style>
