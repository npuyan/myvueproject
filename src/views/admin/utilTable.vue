<template>
  <div>
    <a-button class="editable-add-btn" @click="handleAdd">
      添加
    </a-button>
    <a-table
      bordered
      :columns="columns"
      :data-source="data"
      :loading="loading"
      @change="handleTableChange">
      <!--      <a-input>你好</a-input>-->
      <template v-for="col in columnsName"
                :slot="col"
                slot-scope="text,record,index">
        <div :key="col">
          <a-input v-if="record.editable"
                   style="margin: -5px 0"
                   :value="text"
                   @change="e=>handleChange(e.target.value, record.key, col)"/>
          <template v-else>
            {{ text }}
          </template>
        </div>
      </template>
      <template slot="delete" slot-scope="text, record,index">
        <a-popconfirm v-if="data.length"
                      title="确定删除吗？"
                      @confirm="() => onDelete(record.key)"
        >
          <a-button>删除</a-button>
          <!--          <a href="javascript:;">删除</a>-->
        </a-popconfirm>
      </template>
      <template slot="edit" slot-scope="text,record,index">
        <div class="editable-row-operations">
          <span v-if="record.editable">
            <a @click="()=>save(record.key)">
              保存
            </a>
            <a-popconfirm title="确定取消吗?"
                          @confirm="()=>cancel(record.key)">
              <a>取消</a>
            </a-popconfirm>
          </span>
          <span v-else>
            <a-button :disabled="editingKey!==''" @click="()=>edit(record.key)">
              编辑
            </a-button>
          </span>
        </div>
      </template>
    </a-table>
  </div>
</template>

<script>
export default {
  name: 'util-table',
  props: {
    data: [],
    columns: [],
    columnsName: [],
    dataIdName: '',
    fetchUrl: '',
    delUrl: '',
    saveUrl: ''
  },
  data () {
    return {
      cacheData: '',
      loading: false,
      editingKey: '',
      count: 0,
      pagination: ''
    }
  },
  mounted () {
    this.fetch()
  },
  methods: {
    /* 列表发生排序改变时 */
    handleTableChange (pagination, filters, sorter) {
      // console.log(pagination)
      const pager = {...this.pagination}
      pager.current = pagination.current
      this.pagination = pager
      this.fetch({
        results: pagination.pageSize,
        page: pagination.current,
        sortField: sorter.field,
        sortOrder: sorter.order,
        ...filters
      })
    },
    /* 发生更新添加操作时 */
    handleChange (value, key, column) {
      const newData = [...this.data]
      const target = newData.filter(item => key === item.key)[0]
      if (target) {
        target[column] = value
        this.data = newData
        console.log('tart')
        console.log(target)
      }
    },
    /* 获取数据 */
    fetch (params = {}) {
      this.loading = true
      this.getRequest(this.fetchUrl, {
        // this.getRequest('api/getallusercourse', {
        results: 10,
        ...params
      }).then(data => {
        const pagination = {...this.pagination}
        // Read total count from server
        // pagination.total = data.totalCount;
        pagination.total = 200
        this.loading = false
        this.data = data
        this.pagination = pagination
        this.count = data.length
        this.data.forEach(this.renameId)
        // console.log(data)
        this.cacheData = this.data.map(item => ({...item}))
      })
    },
    renameId: function (item) {
      item.key = item[this.dataIdName]
      delete item[this.dataIdName]
    },
    renameBackId: function (item) {
      item[this.dataIdName] = item.key
      delete item.key
    },
    /* 添加一个空行 */
    handleAdd () {
      const {count, data} = this
      const newData = {
        id: '自动生成',
        userId: '--',
        courseId: '--'
      }
      this.data = [...data, newData]
      this.count = count + 1
    },
    /* 根据key删除 */
    onDelete (key) {
      this.loading = true
      // alert(key)
      console.log()
      this.postRequest(this.delUrl, {
      // this.postRequest('api/dropcoursebyid', {
        id: key
      }).then(resp => {
        if (resp) {
          alert('删除成功')
          const data = [...this.data]
          this.data = data.filter(item => item.key !== key)
          this.count = data.length
        } else {
          alert('删除失败')
        }
        this.loading = false
      })
    },
    /* 根据key打开编辑 */
    edit (key) {
      const newData = [...this.data]
      const target = newData.filter(item => key === item.key)[0]
      this.editingKey = key
      if (target) {
        // alert(key)
        target.editable = true
        // alert(target.editable)
        this.data = newData
      }
    },
    /* 将修改保存到服务器 */
    save (key) {
      // 使用缓存保存未修改之前的数据
      const newData = [...this.data]
      const newCacheData = [...this.cacheData]
      const target = newData.filter(item => key === item.key)[0]
      console.log(target)
      const targetCache = newCacheData.filter(item => key === item.key)[0]
      if (target && targetCache) {
        var newtarget = Object.assign({}, target)
        // newtarget.id = newtarget.key
        // delete newtarget.key
        this.renameBackId(newtarget)
        delete newtarget.editable
        console.log('newtart')
        console.log(newtarget)
        console.log(JSON.stringify(newtarget))
        // TODO 在不影响过去传参的条件下，更改传参方式直接传对象，在后端进行对象的分析，节省前端的传参量
        this.postRequest(this.saveUrl,
          newtarget
        ).then(resp => {
          if (resp && resp.status === 200) {
            alert('编辑成功')
          } else {
            alert('编辑失败')
          }
        })
        delete target.editable
        this.data = newData
        Object.assign(targetCache, target)
        this.cacheData = newCacheData
      }
      this.editingKey = ''
    },
    /* 取消编辑，恢复到编辑之前 */
    cancel (key) {
      const newData = [...this.data]
      const target = newData.filter(item => key === item.key)[0]
      this.editingKey = ''
      if (target) {
        Object.assign(target, this.cacheData.filter(item => key === item.key)[0])
        delete target.editable
        this.data = newData
      }
    }
  }
}
</script>

<style scoped>
.editable-add-btn {
  margin-bottom: 8px;
  margin-left: 10px;
  /*float: left;*/
}

.editable-row-operations a {
  margin-right: 8px;
}
</style>
