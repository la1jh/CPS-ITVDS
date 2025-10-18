<template>
  <Card :title="customConfig?.title || '成交占比'" :loading="loading">
    <div ref="chartRef" :style="{ width, height }"></div>
  </Card>
</template>
<script lang="ts" setup>
  import { Ref, ref, watch, PropType } from 'vue';
  import { Card } from 'ant-design-vue';
  import { useECharts } from '@/hooks/web/useECharts';

  const props = defineProps({
    loading: Boolean,
    width: {
      type: String as PropType<string>,
      default: '100%',
    },
    height: {
      type: String as PropType<string>,
      default: '300px',
    },
    data: {
      type: Array as PropType<{ value: number; name: string }[]>,
      default: () => [],
    },
    customConfig: {
      type: Object as PropType<{
        title?: string;
        colors?: string[];
      }>,
      default: () => ({}),
    },
  });

  const chartRef = ref<HTMLDivElement | null>(null);
  const { setOptions } = useECharts(chartRef as Ref<HTMLDivElement>);

  watch(
    [() => props.loading, () => props.data],
    () => {
      if (props.loading) {
        return;
      }
      setOptions({
        animation: false,
        tooltip: {
          trigger: 'item',
        },
        series: [
          {
            name: props.customConfig?.title || '成交占比',
            type: 'pie',
            radius: '80%',
            center: ['50%', '50%'],
            color: props.customConfig?.colors || ['#5ab1ef', '#b6a2de', '#67e0e3', '#2ec7c9'],
            data: props.data,
            roseType: 'radius',
            animation: false,
            animationType: false,
            animationDelay: 0,
          },
        ],
      });
    },
    { immediate: true },
  );
</script>
