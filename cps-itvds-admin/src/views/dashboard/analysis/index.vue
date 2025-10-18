<template>
  <div class="p-4">
    <Card
      :loading="loading"
      :title="t('仪表盘.视频监控')"
      :headerStyle="{ padding: '20px 20px 0' }"
    >
      <div class="flex flex-col items-center">
        <!-- 视频选择和布局设置 -->
        <div class="layout-settings mb-4">
          <div class="flex space-x-4 items-center">
            <InputNumber
              v-model:value="rows"
              :min="1"
              :max="6"
              placeholder="行数"
              style="width: 100px"
            />
            <span class="mx-2">x</span>
            <InputNumber
              v-model:value="cols"
              :min="1"
              :max="6"
              placeholder="列数"
              style="width: 100px"
            />
            <Button @click="applyCustomLayout" type="primary" class="ml-4">
              {{ t('仪表盘.应用布局') }}
            </Button>
          </div>
        </div>

        <!-- 视频显示区域 -->
        <div id="videoBox" class="video-container grid" :style="gridStyle">
          <div
            v-for="(video, index) in displayedVideos"
            :key="index"
            class="video-item"
            @click="selectVideo(video)"
          >
            <img
              :src="video.url"
              :cnt="index"
              :class="selectedVideo === index ? 'video-chosen video-stream' : 'video-stream'"
              v-if="video.url"
              @error="handleVideoError"
              @click="selectedVideo = index"
            />
            <div v-else class="placeholder">{{ t('仪表盘.请选择视频源') }}</div>
          </div>
        </div>

        <!-- 可选择的视频列表 -->
        <div class="video-selection mt-4">
          <div v-for="(video, index) in displayedVideos" :key="index">
            <Select
              v-model:defaultValue="video.name"
              :options="videoList"
              :field-names="{ label: 'name', value: 'name' }"
              class="flex-1"
              :placeholder="t('仪表盘.选择视频源')"
              @change="
                (name, info) => {
                  chosenVideos[index] = info.url;
                }
              "
              v-show="selectedVideo === index"
            />
            <Button
              @click="updateVideoUrl(index)"
              type="primary"
              v-show="selectedVideo === index"
              >{{ t('仪表盘.更新视频') }}</Button
            >
          </div>
        </div>

        <!-- 控制面板 -->

        <!-- 输出信息区域 -->
        <div class="output-container mt-4">
          <pre class="output-text">{{ outputMessage }}</pre>
        </div>

        <!-- 图表区域 -->
        <div class="charts-container mt-4 flex space-x-4">
          <div class="pie-chart-container">
            <SalesProductPie
              :loading="loading"
              :data="pieChartData"
              :custom-config="{
                title: t('仪表盘.车辆类型占比'),
                colors: ['#5ab1ef', '#b6a2de', '#67e0e3', '#2ec7c9'],
              }"
            />
          </div>
          <div class="bar-chart-container">
            <SiteAnalysis
              :loading="loading"
              :default-active-key="'tab2'"
              :show-tabs="false"
              :custom-config="{
                title: t('仪表盘.车辆数量统计'),
                data: barChartData,
              }"
            />
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>
<script lang="ts" setup>
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
  import { Card, Select, Button, InputNumber, Modal } from 'ant-design-vue';
  import { useI18n } from '@/hooks/web/useI18n';
  import SalesProductPie from './components/SalesProductPie.vue';
  import SiteAnalysis from './components/SiteAnalysis.vue';
  import { getVideoList } from '@/api/dashboard/video';
  import './socketio.js';

  const { t } = useI18n();
  const loading = ref(false);
  const selectedLayout = ref('2 3'); // 默认布局
  const selectedVideo = ref(0);
  const outputMessage = ref(''); // 输出信息
  const videoList = ref<{ id: string; name: string; url?: string }[]>([]); // 添加 url 属性
  const videoUrls = ref<{ id: string; url: string }[]>([]); // 视频流 URL
  const displayedVideos = ref([]); // 当前显示的视频
  const videoOptions = ref([]); // 可选择的视频列表
  const pieChartData = ref();
  const barChartData = ref();
  const chosenVideos = ref({});

  // 添加行列数的响应式变量
  const rows = ref(2);
  const cols = ref(3);

  // 添加应用自定义布局的方法
  const applyCustomLayout = () => {
    setLayout(rows.value, cols.value);
  };

  // 设置布局
  const setLayout = (rows: number, cols: number) => {
    selectedLayout.value = `${rows} ${cols}`;
    fetchVideos(rows, cols);
  };

  // 获取视频列表
  const fetchVideos = async (rows: number, cols: number) => {
    const img = document.querySelectorAll('img[cnt]');
    img.forEach((item) => {
      (item as HTMLImageElement).src = '';
    });

    loading.value = true;
    try {
      const { ok, list } = await getVideoList();
      if (ok) {
        videoList.value = list.map((video) => ({
          ...video,
          url: `http://127.0.0.1:5000/basic-api/videoFeed?id=${video.id}`, // 更新为新的URL
        }));
        updateDisplayedVideos(rows, cols, videoList.value);
      } else {
        // message.error(err_msg || t('仪表盘.获取视频列表失败'));
      }
    } catch (error) {
      console.error('获取视频列表失败:', error);
      // message.error(t('仪表盘.获取视频列表失败'));
    } finally {
      loading.value = false;
    }
  };

  // 更新显示的视频
  const updateDisplayedVideos = (rows: number, cols: number, videos: any[]) => {
    const totalVideos = rows * cols;
    displayedVideos.value = videos.slice(0, totalVideos);
    videoOptions.value = videos; // 存储所有视频以供选择
  };

  // 选择视频
  const selectVideo = (video: any) => {
    if (!videoOptions.value.includes(video)) {
      videoOptions.value.push(video); // 添加到可选择的视频列表
    }
  };

  // 应用选择的视频
  const applySelectedVideo = () => {
    const video = videoOptions.value.find((v) => v.id === selectedVideo.value);
    if (video) {
      const index = displayedVideos.value.findIndex((v) => v.id === video.id);
      if (index !== -1) {
        displayedVideos.value[index].url =
          `http://127.0.0.1:5000/basic-api/videoFeed?id=${video.id}`;
      }
    }
  };

  const updateVideoUrl = (index: number) => {
    const img = document.querySelectorAll(`img[cnt="${index}"]`);
    if (img.length <= 0) return;
    (img[0] as HTMLImageElement).src = '';
    let url = chosenVideos.value[index];
    if (!url) url = videoList.value[index].url;
    (img[0] as HTMLImageElement).src = url;
    console.log(img[0], url, index);
  };

  const handleVideoError = () => {
    // message.error(t('仪表盘.视频加载失败'));
  };

  // 处理接收到的数据，转换为图表所需格式
  const processChartData = (data: VehicleData[]) => {
    // 计算总数，用于计算占比
    const total = data.reduce((sum, item) => sum + item.count, 0);

    // 处理饼图数据 - 直接更新，不使用动画
    pieChartData.value = data
      .map((item) => ({
        value: item.count,
        name: `${item.type} (${((item.count / total) * 100).toFixed(2)}%)`,
      }))
      .sort((a, b) => a.value - b.value);

    // 处理柱状图数据 - 直接更新，不使用动画
    barChartData.value = data.map((item) => ({
      x: item.type,
      y: item.count,
      tooltip: `数量: ${item.count}\n平均速度: ${item.speed}km/h`,
    }));
  };

  const socket = io.connect('ws://127.0.0.1:5000/A10');
  // 通过 WebSocket 获取图表数据
  const setupWebSocket = () => {
    socket.on('connect', () => {
      console.log('WebSocket 连接已建立');
    });

    socket.on('accident_message', (data) => {
      //console.log('receive accident message:', data);
      showAccidentMessage(data.msg); // 显示弹窗
    });

    const askfor_data = setInterval(() => {
      socket.emit('fetchChartData');
      socket.emit('fetchVehicleCount');
    }, 1000);

    // 监听图表数据 - 直接更新，不使用过渡效果
    socket.on('fetchChartData', (data) => {
      processChartData(data.vehical_data);
    });

    // 监听车辆计数数据 - 直接更新，不使用过渡效果
    socket.on('fetchVehicleCount', (data) => {
      enterCount.value = data.enterCount || 0;
      leaveCount.value = data.leaveCount || 0;
    });

    socket.onerror = (error) => {
      console.error('WebSocket 错误:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket 连接已关闭');
      clearInterval(askfor_data); // 清除定时器
    };
  };

  // 显示事故信息的弹窗
  const showAccidentMessage = (message: string) => {
    Modal.info({
      title: '事故信息',
      content: message,
      onOk() {},
    });
    document.querySelector('.ant-modal-content').style.whiteSpace = 'pre-wrap';
  };

  // 页面加载时获取视频列表和设置 WebSocket
  onMounted(() => {
    fetchVideos(2, 3);
    setupWebSocket();
  });

  // 组件卸载时关闭 WebSocket 连接
  onBeforeUnmount(() => {
    if (socket) {
      socket.close();
    }
  });

  // 在 script 部分添加 gridStyle 计算属性
  const gridStyle = computed(() => {
    return {
      'grid-template-columns': `repeat(${cols.value}, 1fr)`,
      'grid-template-rows': `repeat(${rows.value}, 1fr)`,
      'aspect-ratio': `${cols.value} / ${rows.value}`,
    };
  });
</script>

<style lang="less" scoped>
  .video-chosen {
    border: 2px solid #1890ff;
    box-shadow: 0 0 10px rgb(24 144 255 / 50%);
  }

  .video-container {
    display: grid;
    gap: 10px;
    width: 100%;
    height: auto;
    margin: 0 auto;
  }

  .video-item {
    position: relative;
    overflow: hidden;
    border-radius: 8px;
    background-color: #1a1a1a;
    cursor: pointer;
  }

  .video-stream {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #ccc;
    font-size: 16px;
  }

  .output-container {
    width: 100%;
    margin-top: 16px;
    padding: 16px;
    border-radius: 8px;
    background-color: #f0f0f0;
  }

  .output-text {
    color: #333;
    font-family: monospace;
    font-size: 14px;
  }

  .charts-container {
    display: flex;
    justify-content: space-between;
    width: 100%;
    margin-top: 16px;

    .pie-chart-container,
    .bar-chart-container {
      flex: 1;
      min-height: 300px;
      margin: 0 8px;
      padding: 16px;
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 2px 8px rgb(0 0 0 / 15%);
    }
  }
</style>
