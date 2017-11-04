<template>
<div class="perform">
  <div class="status">
    <div class="chart">
      <canvas id="progress-chart"></canvas>
    </div>
    <div class="progress">
      <p class="progress-title">Trainning Progress</p>
      <el-progress :text-inside="true" :stroke-width="18" :percentage="progress" :status="completed?'success':null"></el-progress>
    </div>
  </div>
  <transition name="fade">
    <div class="exp" v-if="completed">
      <div class="choose">
        <p class="exp-title">Choose a hand-written number picture:</p>
        <el-upload
          class="avatar-uploader"
          id="upload"
          action="http://localhost:12450/task/picture"
          :show-file-list="false"
          :with-credentials="true"
          :on-success="handleAvatarSuccess"
          :before-upload="beforeAvatarUpload">
          <img v-if="imageUrl" :src="imageUrl" class="avatar">
          <i v-else class="el-icon-plus avatar-uploader-icon"></i>
        </el-upload>
      </div>
      <span class="seperate"></span>
      <!--<div v-if="resultDisplay" class="result">-->
      <div class="result">
        <p class="result-title">The recognization result:</p>
        <p class="result-num">{{ recogNum }}</p>
      </div>
    </div>
  </transition>
</div>
</template>

<script>
import Chart from 'chart.js'
const log2object = function (log) {
  const arr = log.split("\n")
  arr.pop()
  const res = []
  for (let i in arr) {
    const line = arr[i].split(",")
    res[i] = { iter:line[0], loss:line[1], acc:line[2] }
  }
  return res
}

export default {
  beforeRouteEnter (to, from, next) {
    next(vm => {
      vm.$chart = new Chart(document.getElementById("progress-chart"), {
      type: 'line',
        data: vm.chartData,
        options: vm.chartOption
        })
      const labels = vm.chartData.labels
      const acc = vm.chartData.datasets[0].data
      const loss = vm.chartData.datasets[1].data
      const interval = window.setInterval(() => {
        vm.$http.get('http://localhost:12450/task/process', { credentials: true }).then(resp => {
          if (resp.body.complete) {
            vm.completed = true
            vm.progress = 100
            window.clearInterval(interval)
            vm.$http.get('http://localhost:12450/task/status', { credentials: true }).then(resp => {
              const data = log2object(resp.body.data)
              while(labels.pop()) {}
              while(acc.pop()) {}
              while(loss.pop()) {}
              for (let i of data) {
                labels.push(i.iter)
                acc.push(i.acc)
                loss.push(i.loss)
              }
              vm.$chart.update()
            })
            return
          }
          vm.progress = parseFloat(((resp.body.process >=1 ? 1 : resp.body.process) * 100).toFixed(2))
          labels.push(resp.body.iter)
          acc.push(resp.body.acc)
          loss.push(resp.body.loss)
          vm.$chart.update()
        })
      }, 200)
    })
  },
  data() {
    return {
      imageUrl: '',
      resultDisplay: false,
      recogNum: '?',
      chartData: {
        labels : [],
        datasets : [
          { 
            label: "Accuracy",
            borderColor: "rgba(151,187,205,0.5)",
            // backgroundColor: "rgba(151,187,205,0.5)",
            backgroundColor: 'rgba(255,255,255,0)',
            data: [],
            yAxisID: 'acc',
            borderWidth: 2,
            pointRadius: 2
          },
          {
            label: "Loss",
            borderColor: "rgba(255,176,0,0.5)",
            // backgroundColor: "rgba(255,176,0,0.5)",
            backgroundColor: 'rgba(255,255,255,0)',
            data: [],
            yAxisID: 'loss',
            borderWidth: 2,
            pointRadius: 2
          }
        ]
      },
      progress: 0,
      chartOption: {
        animation: {
          duration: 150,
        },
        responsiveAnimationDuration: 0,
        responsive: true,
        title:{
          display:true,
          text:'Trainning Status'
        },
        tooltips: {
          mode: 'index',
          intersect: false,
        },
        hover: {
          animationDuration: 0,
          mode: 'nearest',
          intersect: true
        },
        scales: {
          yAxes: [{
              type: "linear", // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
              display: true,
              position: "left",
              id: "loss",
          }, {
              type: "linear", // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
              display: true,
              position: "right",
              id: "acc",
              // grid line settings
              gridLines: {
                  drawOnChartArea: false, // only want the grid lines for one axis to show up
              },
          }],
        }
      },
      completed: false
    }
  },
  methods: {
    handleAvatarSuccess(res, file) {
      this.imageUrl = URL.createObjectURL(file.raw)
      this.resultDisplay = true
      this.recogNum = res.res
    },
    beforeAvatarUpload(file) {
      this.resultDisplay = false
      this.recogNum = '?'
      return true
    }
  }
}
</script>

<style scoped>
  .chart {
    width: 800px;
    height: 400px;
    margin: auto;
    margin-top: 20px;
  }
  .progress {
    width: 600px;
    margin: auto;
    margin-top: 10px;
    overflow: visible;
  }
  .exp {
    width: 378px;
    padding-top: 40px;
    margin: auto;
  }
  .choose {
    width: 178px;
    float: left;
  }
  .result {
    border-left: solid #d9d9d9 1px;
  }
  .seperate {
    float: left;
    margin-left: 10px;
    margin-right: 10px;
    width: 1px;
    background: #d9d9d9;
    height: 256px;
  }
  .result-title {
    margin-top: 20px;
    font-size: 12px;
    color: #777;
    display: none;
  }
  .result-num {
    float: left;
    font-size: 84px;
    color: #999;
    width: 178px;
    height: 256px;
    font-weight: 200;
    line-height: 94px;
    text-align: center;
  }
 .avatar-uploader .el-upload {
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }
  .avatar-uploader .el-upload:hover {
    border-color: #409EFF;
  }

  #upload {
      border: 1px dashed #d9d9d9;
      border-radius: 6px;
  }
  #upload:hover {
    border-color: #409EFF;
  }
  .avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 178px;
    height: 178px;
    line-height: 178px;
    text-align: center;
  }
  .avatar {
    width: 174px;
    height: 174px;
    display: block;
    margin-top: 2px;
    margin-left: 1px;
  }
  .progress-title {
    font-size: 16px;
    color: #777;
    text-align: center;
  }
  .exp-title {
    font-size: 16px;
    color: #777;
    text-align: center;
  }
  .fade-enter-active, .fade-leave-active {
    transition: opacity .5s
  }
  .fade-enter, .fade-leave-to /* .fade-leave-active in below version 2.1.8 */ {
    opacity: 0
  }
</style>

