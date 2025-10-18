<template>
  <div class="md:flex">
    <template v-for="(item, index) in cardList" :key="item.title">
      <Card
        size="small"
        :loading="loading"
        :title="item.title"
        class="md:w-1/4 w-full !md:mt-0"
        :class="{ '!md:mr-4': index + 1 < 2, '!mt-4': index > 0 }"
      >
        <template #extra>
          <Tag :color="item.color">{{ item.action }}</Tag>
        </template>

        <div class="py-4 px-4 flex justify-between items-center">
          <CountTo :startVal="0" :endVal="item.value" class="text-2xl" />
          <Icon :icon="item.icon" :size="40" />
        </div>

        <div class="p-2 px-4 flex justify-between">
          <span>{{ item.total }}</span>
          <CountTo :startVal="0" :endVal="item.totalValue" />
        </div>
      </Card>
    </template>
  </div>
</template>

<script lang="ts" setup>
  import { ref, watch } from 'vue';
  import { CountTo } from '@/components/CountTo';
  import Icon from '@/components/Icon/Icon.vue';
  import { Tag, Card } from 'ant-design-vue';

  const props = defineProps({
    loading: {
      type: Boolean,
    },
    enterCount: {
      type: Number,
      default: 0,
    },
    leaveCount: {
      type: Number,
      default: 0,
    },
  });

  const cardList = ref([
    {
      title: '进入车辆',
      icon: 'ant-design:arrow-down-outlined',
      value: 0,
      totalValue: 0,
      total: '总进入',
      color: 'green',
      action: '实时',
    },
    {
      title: '离开车辆',
      icon: 'ant-design:arrow-up-outlined',
      value: 0,
      totalValue: 0,
      total: '总离开',
      color: 'blue',
      action: '实时',
    },
  ]);

  // 监听props变化，更新卡片数据
  watch(
    () => [props.enterCount, props.leaveCount],
    ([newEnterCount, newLeaveCount]) => {
      cardList.value[0].value = newEnterCount;
      cardList.value[0].totalValue = newEnterCount;
      cardList.value[1].value = newLeaveCount;
      cardList.value[1].totalValue = newLeaveCount;
    },
    { immediate: true },
  );
</script>
