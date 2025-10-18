<template>
  <div class="p-4">
    <Card title="系统日志查看" :bordered="false">
      <!-- 操作按钮区域 -->
      <div class="mb-4">
        <Button type="primary" :loading="loading" @click="fetchLogs">刷新日志</Button>
        <Button class="ml-2" @click="clearLogs">清空日志</Button>
      </div>

      <!-- 日志显示区域 -->
      <div class="log-container">
        <div ref="logContentRef" class="log-content" v-loading="loading">
          <a-empty v-if="!logData.length" description="暂无日志数据" />
          <BasicTable v-else :dataSource="logData" :columns="columns" rowKey="date" />
        </div>
      </div>
    </Card>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { Card, Button, message } from 'ant-design-vue';
  import { BasicTable } from '@/components/Table';
  import { getSystemLogs, type LogItem } from '@/api/sys/log';

  // 日志数据
  const logData = ref<LogItem[]>([]);
  // 加载状态
  const loading = ref(false);
  // 日志容器引用
  const logContentRef = ref<HTMLElement>();

  // 表格列定义
  const columns = [
    {
      title: '车牌号',
      dataIndex: 'vehical_plate',
      key: 'vehical_plate',
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '地点',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: '车辆类型',
      dataIndex: 'vehicle_type',
      key: 'vehicle_type',
    },
    {
      title: '平均速度',
      dataIndex: 'average_speed',
      key: 'average_speed',
    },
    {
      title: '车辆行为',
      dataIndex: 'movement',
      key: 'movement',
    },
  ];

  // 获取日志数据
  const fetchLogs = async () => {
    try {
      loading.value = true;
      const data = await getSystemLogs();

      // 处理数据，提取所需字段
      if (Array.isArray(data)) {
        logData.value = data.map((item) => ({
          vehical_plate: item.vehical_plate,
          date: item.date,
          position: item.position,
          vehicle_type: item.vehicle_type,
          average_speed: Number(item.average_speed),
          movement: item.movement,
        }));
      } else {
        console.error('返回数据格式错误:', data);
        message.error('获取日志失败：数据格式错误');
      }
    } catch (error) {
      console.error('获取日志失败:', error);
      message.error('获取日志失败');
    } finally {
      loading.value = false;
    }
  };

  // 清空日志
  const clearLogs = () => {
    logData.value = [];
  };

  // 页面加载时获取数据
  fetchLogs();
</script>

<style lang="less" scoped>
  .log-container {
    position: relative;
    //height: calc(100vh - 300px);
    //min-height: 400px;
    //padding: 8px;
    //border: 1px solid #e8e8e8;
    //border-radius: 2px;
    //background: #fafafa;

    .log-content {
      height: 100%;
      overflow-y: auto;

      &::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }

      &::-webkit-scrollbar-thumb {
        border-radius: 3px;
        background: #ccc;
      }

      &::-webkit-scrollbar-track {
        border-radius: 3px;
        background: #f1f1f1;
      }
    }
  }
</style>
