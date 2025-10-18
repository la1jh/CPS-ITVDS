<template>
  <Card
    :title="customConfig?.title"
    :tab-list="showTabs ? tabListTitle : null"
    v-bind="$attrs"
    :active-tab-key="activeKey"
    @tab-change="onTabChange"
    :loading="loading"
  >
    <VisitAnalysisBar :data="customConfig?.data || []" />
  </Card>
</template>

<script lang="ts" setup>
  import { ref, PropType } from 'vue';
  import { Card } from 'ant-design-vue';
  import VisitAnalysisBar from './VisitAnalysisBar.vue';

  const props = defineProps({
    loading: Boolean,
    defaultActiveKey: {
      type: String,
      default: 'tab2',
    },
    showTabs: {
      type: Boolean,
      default: false,
    },
    customConfig: {
      type: Object as PropType<{
        title?: string;
        data?: any[];
      }>,
      default: () => ({}),
    },
  });

  const activeKey = ref(props.defaultActiveKey);

  const tabListTitle = [
    {
      key: 'tab2',
      tab: '访问量',
    },
  ];

  function onTabChange(key) {
    activeKey.value = key;
  }
</script>
