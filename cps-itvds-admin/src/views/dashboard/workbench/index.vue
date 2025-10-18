<template>
  <PageWrapper>
    <template #headerContent> <WorkbenchHeader /> </template>
    <div class="w-full">
      <div id="graphBox">
        <span v-if="!selectedRow || !selectedRow.value">等待路径查询</span>
        <!-- SVG 图形将被插入到这里 -->
      </div>
      <GrowCard :loading="loading" :dangerous-vehicles="dangerousVehicles" />

      <div class="mt-4">
        <a-button type="primary" :loading="loading" @click="handleQueryPath">查询路径</a-button>
        <!-- 删除重置和查询按钮 -->
      </div>

      <BasicTable @register="registerTable" @row-click="onRowClick">
        <template #toolbar>
          <!-- <BasicForm @register="registerForm" @submit="handleSubmit">
            <template #selectAfter>
              <a-button type="primary" @click="handleSubmit">查询</a-button>
            </template>
          </BasicForm> -->
          <div>
            <span>选中行信息: {{ selectedRowInfo }}</span>
          </div>
        </template>
      </BasicTable>
    </div>
  </PageWrapper>
</template>
<script lang="ts" setup>
  import { ref, onMounted } from 'vue';
  import { PageWrapper } from '@/components/Page';
  import { BasicTable, useTable } from '@/components/Table';
  import { BasicForm, useForm } from '@/components/Form';
  import WorkbenchHeader from './components/WorkbenchHeader.vue';
  import GrowCard from './components/GrowCard.vue';
  import { getAppointments } from '@/api/work';
  import { Button as AButton } from 'ant-design-vue';
  import { defHttp } from '@/utils/http/axios.ts';
  import './d3.v7.min.js';

  declare const d3: any;

  const loading = ref(true);
  const dangerousVehicles = ref(0);
  const selectedRow = ref<any>(null);
  const selectedRowInfo = ref('');

  // 表单配置
  const [registerForm] = useForm({
    labelWidth: 100,
    schemas: [
      // 移除三个输入框
      // {
      //   field: 'vehical_plate',
      //   label: '车牌号',
      //   component: 'Input',
      //   colProps: { span: 8 },
      // },
      // {
      //   field: 'path',
      //   label: '路径',
      //   component: 'Input',
      //   colProps: { span: 8 },
      // },
      // {
      //   field: 'path_id',
      //   label: '路径ID',
      //   component: 'Input',
      //   colProps: { span: 8 },
      // },
    ],
    layout: 'inline',
  });

  // 表格配置
  const [registerTable] = useTable({
    title: '车辆路径信息',
    columns: [
      {
        title: '时间',
        dataIndex: 'appointment_date',
        width: 200,
      },
      {
        title: '车牌号',
        dataIndex: 'vehical_plate',
        width: 200,
      },
      {
        title: '路径ID',
        dataIndex: 'path_id',
        width: 200,
      },
    ],
    api: getAppointments,
    useSearchForm: false,
    showTableSetting: true,
    bordered: true,
    showIndexColumn: true,
  });

  const fetchDangerousVehicles = async () => {
    try {
      const data = await getAppointments();
      // 假设 data 是一维数组
      dangerousVehicles.value = data.length;
    } catch (error) {
      console.error('获取系统日志数据失败:', error);
    } finally {
      loading.value = false;
    }
  };

  // 行点击事件
  const onRowClick = (record) => {
    selectedRow.value = record;
    selectedRowInfo.value = `日期：${record.appointment_date}, 车牌号: ${record.vehical_plate}, 路径ID: ${record.path_id}`;
  };

  const loadGraph = (() => {
    let intervalId = null;
    return function (nodes, edges, node_datas, edge_datas, refreshFunc) {
      if (intervalId) clearInterval(intervalId);
      const nodeDict = {},
        edgeDict = {};
      const vis = new Set(),
        edgeSet = new Set();
      const nodeQue = [];
      for (const node of nodes) {
        node.x = 300;
        node.y = 300;
        nodeDict[node.id] = node;
        edgeDict[node.id] = [];
        if (node.is_begin) {
          nodeQue.push(node.id);
          vis.add(node.id);
          node_datas.push(node);
        }
      }
      refreshFunc();
      for (const edge of edges) {
        edgeDict[edge.source].push(edge);
        edgeDict[edge.target].push(edge);
      }
      intervalId = setInterval(() => {
        if (nodeQue.length > 0) {
          let flag = false;
          let res = 'nodeQue: ';
          for (const node of nodeQue) {
            res += node + ' ';
          }
          const node = nodeQue.shift();
          for (const edge of edgeDict[node]) {
            if (!edgeSet.has(edge)) {
              edgeSet.add(edge);
              edge_datas.push(edge);
            }
            let next = edge.target.id ? edge.target.id : edge.target;
            if (next == node) next = edge.source.id ? edge.source.id : edge.source;
            if (flag || vis.has(next)) continue;
            vis.add(next);
            nodeQue.push(next);
            node_datas.push(nodeDict[next]);
          }
          refreshFunc();
        } else {
          clearInterval(intervalId);
          intervalId = null;
        }
      }, 300);
    };
  })();
  // 查询路径按钮点击事件
  const drawGraph = async () => {
    try {
      const edge_datas = [],
        node_datas = [];
      const { edges, nodes } = await defHttp.post({
        url: '/basic-api/fetchPathData',
        params: {
          appointment_date: selectedRow.value.appointment_date,
          vehical_plate: selectedRow.value.vehical_plate,
          path_id: selectedRow.value.path_id,
        },
      });

      const container = document.getElementById('graphBox');
      d3.select(container).selectAll('*').remove();
      const width = 1000,
        height = 600;
      const svg = d3
        .select(container)
        //.empty()
        .append('svg')
        .attr('width', width)
        .attr('height', height);
      const simulation = d3
        .forceSimulation(node_datas)
        .force(
          'link',
          d3
            .forceLink(edge_datas)
            .id((d) => d.id)
            .distance(100)
            .strength(0.3),
        )
        .force('charge', d3.forceManyBody().strength(-20))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collide', d3.forceCollide().radius(30))
        .velocityDecay(0.3);

      const updateGraph = () => {
        svg
          .selectAll('.link')
          .data(edge_datas)
          .join('line')
          .attr('class', 'link')
          .attr('stroke', (d) => (d.type === 1 ? '#006400' : '#FF2500'))
          .attr('stroke-opacity', 0.6)
          .attr('stroke-width', 3)
          .attr('stroke-dasharray', (d) => (d.walked === 1 ? '0' : '5,5'));
        svg
          .selectAll('.node')
          .data(node_datas, (d) => d.id)
          .join(
            (enter) => {
              const g = enter
                .append('g')
                .attr('class', 'node-group')
                .call(
                  d3
                    .drag()
                    .on('start', (event, d) => {
                      if (!event.active) simulation.alphaTarget(0.3).restart();
                      d.fx = d.x;
                      d.fy = d.y;
                    })
                    .on('drag', (event, d) => {
                      d.fx = event.x;
                      d.fy = event.y;
                      simulation.alphaTarget(0.3);
                    })
                    .on('end', (event, d) => {
                      if (!event.active) simulation.alphaTarget(0);
                      d.fx = null;
                      d.fy = null;
                    }),
                );
              g.append('circle')
                .attr('r', 20)
                .attr('fill', (d) => (d.is_begin ? 'darkblue' : 'lightblue'))
                .attr('stroke', '#000')
                .attr('class', 'node');
              g.append('text')
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .attr('font-size', 20)
                .attr('fill', (d) => (d.is_begin ? 'white' : 'black'))
                .style('pointer-events', 'none')
                .text((d) => d.id);
            },
            (update) => update,
            (exit) => exit.remove(),
          );
        svg.selectAll('.link').lower();
        simulation.nodes(node_datas);
        simulation.force('link').links(edge_datas);
        simulation.alphaTarget(0.1).restart();
      };

      loadGraph(nodes, edges, node_datas, edge_datas, updateGraph);

      //动态更新位置
      simulation.on('tick', () => {
        svg.selectAll('.node-group').attr('transform', (d) => `translate(${d.x}, ${d.y})`);
        svg
          .selectAll('.link')
          .attr('x1', (d) => d.source.x)
          .attr('y1', (d) => d.source.y)
          .attr('x2', (d) => d.target.x)
          .attr('y2', (d) => d.target.y);
        //console.log(node_datas);
      });
    } catch (error) {
      console.error('获取系统日志数据失败:', error);
    }
  };
  const handleQueryPath = async () => {
    if (!selectedRow.value) {
      return;
    }
    loading.value = true;
    try {
      await drawGraph();
    } catch (error) {
      console.error('查询申请记录失败:', error);
    } finally {
      loading.value = false;
    }
  };

  // 表单提交
  const handleSubmit = async () => {
    loading.value = true;
    try {
      await getAppointments();
    } catch (error) {
      console.error('查询失败:', error);
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    fetchDangerousVehicles();
  });
</script>

<style>
  #graphBox {
    display: flex;
    align-items: center; /* 垂直居中 */
    justify-content: center; /* 水平居中 */
    width: 1000px; /* 设置宽度 */
    height: 600px; /* 设置高度 */
    margin: 20px auto; /* 上下外边距，水平居中 */
    border: 2px solid #ccc; /* 添加边框 */
    border-radius: 8px; /* 圆角 */
    background-color: #f9f9f9; /* 背景颜色 */
    box-shadow: 0 2px 10px rgb(0 0 0 / 10%); /* 阴影 */
  }

  svg {
    max-width: 100%; /* 确保SVG不超出容器 */
    height: auto; /* 自动调整高度 */
  }
</style>
