<template>
  <div ref="chartRef" :style="{ width, height }"></div>
</template>
<script lang="ts" setup>
  import { ref, Ref, watch, PropType } from 'vue';
  import { useECharts } from '@/hooks/web/useECharts';

  const props = defineProps({
    width: {
      type: String as PropType<string>,
      default: '100%',
    },
    height: {
      type: String as PropType<string>,
      default: '300px',
    },
    data: {
      type: Array as PropType<{ x: string; y: number; tooltip?: string }[]>,
      default: () => [],
    },
  });

  const chartRef = ref<HTMLDivElement | null>(null);
  const { setOptions } = useECharts(chartRef as Ref<HTMLDivElement>);

  watch(
    () => props.data,
    () => {
      setOptions({
        animation: false,
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            const item = params[0];
            const data = props.data[item.dataIndex];
            return data.tooltip || `${data.x}: ${data.y}`;
          },
        },
        xAxis: {
          type: 'category',
          data: props.data.map((item) => item.x),
        },
        yAxis: {
          type: 'value',
        },
        series: [
          {
            data: props.data.map((item) => item.y),
            type: 'bar',
            animation: false,
            label: {
              show: true,
              position: 'top',
            },
          },
        ],
      });
    },
    { immediate: true },
  );
</script>
