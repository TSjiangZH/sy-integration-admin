<template>
  <el-table :data="list" style="width: 100%;padding-top: 15px;">
    <el-table-column label="订单号" min-width="200">
      <template slot-scope="scope">
        {{ scope.row.order_no | orderNoFilter }}
      </template>
    </el-table-column>
    <el-table-column label="金额" width="195" align="center">
      <template slot-scope="scope">
        ¥{{ scope.row.price | toThousandFilter }}
      </template>
    </el-table-column>
    <el-table-column label="状态" width="100" align="center">
      <template slot-scope="{row}">
        <el-tag :type="row.status | statusFilter">
          {{ row.status | statusTextFilter }}
        </el-tag>
      </template>
    </el-table-column>
  </el-table>
</template>

<script>
// import { transactionList } from '@/api/modules/remote-search'

export default {
  filters: {
    statusFilter(status) {
      const statusMap = {
        success: 'success',
        pending: 'danger',
        processing: 'warning'
      }
      return statusMap[status] || 'info'
    },
    statusTextFilter(status) {
      const statusMap = {
        success: '已完成',
        pending: '待处理',
        processing: '处理中'
      }
      return statusMap[status] || status
    },
    orderNoFilter(str) {
      return str.substring(0, 30)
    },
    toThousandFilter(num) {
      return (+num || 0).toString().replace(/(\d)(?=(?:\d{3})+$)/g, '$1,')
    }
  },
  data() {
    return {
      list: []
    }
  },
  created() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      // 请根据后端实际API调整以下代码
      // 示例：
      // const response = await transactionList()
      // this.list = response.data.items || []
    }
  }
}
</script>
