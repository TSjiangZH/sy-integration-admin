<template>
  <el-dialog :visible.sync="visible" title="分配权限" width="500px" :close-on-click-modal="false" @close="$emit('close')">
    <div class="permission-dialog-container">
      <div class="search-container">
        <el-input
          v-model="searchPermission"
          placeholder="搜索权限名称或ID"
          size="small"
          prefix-icon="el-icon-search"
          style="width: 100%;"
        />
      </div>
      <el-tree
        ref="permissionTree"
        :data="permissionTree"
        :props="treeProps"
        show-checkbox
        node-key="id"
        :default-checked-keys="checkedPermissionIds"
        style="max-height: 400px; overflow: auto; margin-top: 15px;"
        class="custom-tree"
        @check="handleCheck"
      >
        <template slot-scope="{ node, data }">
          <div class="tree-node-content">
            <div class="node-title">{{ data.name }}</div>

          </div>
        </template>
      </el-tree>
    </div>
    <div slot="footer">
      <el-button @click="$emit('close')">取消</el-button>
      <el-button type="primary" @click="onConfirm">保存</el-button>
    </div>
  </el-dialog>
</template>
<script>
export default {
  props: {
    visible: Boolean,
    permissions: Array,
    checkedPermissionIds: Array
  },
  data() {
    return {
      searchPermission: '',
      treeProps: {
        children: 'children',
        label: 'name'
      },
      permissionTree: []
    }
  },
  watch: {
    permissions: {
      handler(newVal) {
        this.buildPermissionTree();
      },
      immediate: true
    },
    searchPermission: {
      handler(newVal) {
        this.filterTree();
      }
    }
  },
  methods: {
    // 构建权限树
    buildPermissionTree() {
      if (!this.permissions || this.permissions.length === 0) {
        this.permissionTree = [];
        return;
      }

      // 构建ID到权限的映射
      const permissionMap = new Map();
      this.permissions.forEach(permission => {
        permissionMap.set(permission.id, { ...permission, children: [] });
      });

      // 构建树结构
      const rootPermissions = [];
      this.permissions.forEach(permission => {
        const parentId = permission.parentId || 0;
        if (parentId === 0) {
          // 根节点
          rootPermissions.push(permissionMap.get(permission.id));
        } else {
          // 非根节点，添加到父节点的children中
          const parentPermission = permissionMap.get(parentId);
          if (parentPermission) {
            parentPermission.children.push(permissionMap.get(permission.id));
          } else {
            // 如果父节点不存在，作为根节点处理
            rootPermissions.push(permissionMap.get(permission.id));
          }
        }
      });

      this.permissionTree = rootPermissions;
    },

    // 过滤树节点
    filterTree() {
      if (!this.searchPermission) {
        // 如果搜索框为空，重建完整的权限树
        this.buildPermissionTree();
        return;
      }

      const searchStr = this.searchPermission.toLowerCase();
      // 深拷贝原始权限树
      const filteredTree = JSON.parse(JSON.stringify(this.permissionTree));

      // 递归过滤树节点
      this.filterNodes(filteredTree, searchStr);

      this.permissionTree = filteredTree;
    },

    // 递归过滤节点
    filterNodes(nodes, searchStr) {
      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        const nameMatch = node.name?.toLowerCase().includes(searchStr);
        const idMatch = node.id?.toString().includes(searchStr);

        if (node.children && node.children.length > 0) {
          this.filterNodes(node.children, searchStr);
        }

        // 如果当前节点不匹配搜索条件，且没有匹配的子节点，则移除该节点
        if (!nameMatch && !idMatch && (!node.children || node.children.length === 0)) {
          nodes.splice(i, 1);
        }
      }
    },

    // 处理勾选事件
    handleCheck() {
      // 获取所有选中的节点ID
      this.$emit('update:checkedPermissionIds', this.$refs.permissionTree.getCheckedKeys());
    },

    onConfirm() {
      try {
        const checkedKeys = this.$refs.permissionTree.getCheckedKeys();
        this.$emit('confirm', checkedKeys);
      } catch (error) {
        this.$message.error('获取选中权限失败: ' + (error.message || '未知错误'));
      }
    }
  }
}
</script>
<style lang="scss" scoped>
.permission-dialog-container {
  padding: 10px;
}

.search-container {
  margin-bottom: 10px;
}

.custom-tree {
  --el-tree-node-content-hover-bg-color: #f0f5ff;
}

.tree-node-content {
  display: flex;
  flex-direction: column;
  padding: 5px 0;
}

.node-title {
  font-weight: 500;
  color: #333;
}

.node-path {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.el-dialog__header {
  background-color: #f7f9fc;
  padding: 15px 20px;
  border-bottom: 1px solid #e6e6e6;
}

.el-dialog__title {
  font-size: 16px;
  font-weight: 600;
}
</style>
