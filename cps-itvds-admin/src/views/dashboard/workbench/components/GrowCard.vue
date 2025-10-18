<template>
  <div class="md:flex">
    <Card size="small" :loading="loading" title="危险车辆通行申请数" class="w-full">
      <template #extra>
        <Tag color="red">实时数据</Tag>
      </template>

      <div class="py-4 px-4 flex justify-between items-center">
        <CountTo :startVal="0" :endVal="dangerousVehicles" class="text-2xl" />
        <Icon icon="mdi:car-alert" :size="40" color="#ff4d4f" />
      </div>

      <div class="p-2 px-4 flex justify-between">
        <span>当前危险车辆通行申请记录总数</span>
        <CountTo :startVal="0" :endVal="dangerousVehicles" />
      </div>
    </Card>
  </div>
</template>
<script lang="ts" setup>
  import { CountTo } from '@/components/CountTo';
  import Icon from '@/components/Icon/Icon.vue';
  import { Tag, Card } from 'ant-design-vue';

  defineProps({
    loading: {
      type: Boolean,
      default: false,
    },
    dangerousVehicles: {
      type: Number,
      default: 0,
    },
  });
</script>
