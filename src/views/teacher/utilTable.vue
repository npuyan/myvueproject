<template>
  <div>

    <a-button v-if="fetchUrl == 'api/getcoursebyteacher'" class="editable-add-btn" @click="handleAdd"> 添加 </a-button>
    
    <a-table
      bordered
      :columns="columns"
      :data-source="data"
      :loading="loading"
      @change="handleTableChange"
    >
      <template
        v-for="col in columnsName"
        :slot="col"
        slot-scope="text, record, index"
      >
        <div :key="col">
          <a-input
            v-if="record.editable"
            style="margin: -5px 0"
            :value="text"
            @change="(e) => handleChange(e.target.value, record.key, col)"
          />
          <template v-else>
            {{ text }}
          </template>
        </div>
      </template>
      <template slot="delete" slot-scope="text, record, index">
        <a-popconfirm
          v-if="data.length"
          title="确定删除吗？"
          @confirm="() => onDelete(record.key)"
        >
          <a-button>删除</a-button>
        </a-popconfirm>

      </template>

      <template slot="finsh" slot-scope="text, record, index">
        <a-popconfirm
          v-if="data.length"
          title="确定结束课程吗？"
          @confirm="() => onClear(record.key)"
        >
          <a-button>结束</a-button>
        </a-popconfirm>
      </template>
      
      <template slot="edit" slot-scope="text, record, index">
        <div class="editable-row-operations">
          <span v-if="record.editable">
            <a @click="() => save(record.key)"> 保存 </a>
            <a-popconfirm
              title="确定取消吗?"
              @confirm="() => cancel(record.key)"
            >
              <a>取消</a>
            </a-popconfirm>
          </span>
        </div>
      </template>
      <template slot="info" slot-scope="text, record, index">
        <a-button @click="Details(record)">详细信息</a-button>
      </template>
    </a-table>
  </div>
</template>

<script>
export default {
  name: 'util-table',
  props: {
    data: {
      type: Array,
      default: []
    },
    columns: {
      type: Array,
      default: []
    },
    columnsName: {
      type: Array,
      default: []
    },
    dataIdName: {
      type: String,
      default: ''
    },
    recvParam: {
      type: String,
      default: ''
    },
    fetchUrl: {
      type: String,
      default: ''
    },
    delUrl: {
      type: String,
      default: ''
    },
    saveUrl: {
      type: String,
      default: ''
    }
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
    this.fetch(this.recvParam)
  },
  methods: {
    /* 列表发生排序改变时 */
    handleTableChange (pagination, filters, sorter) {
      // console.log(pagination)
      const pager = {...this.pagination}
      pager.current = pagination.current
      this.pagination = pager
      this.fetch(this.recvParam)
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
      console.log('the params in fetch')
      var temp_param = JSON.stringify(params)
      console.log(temp_param)
      this.loading = true
      this.postRequest(this.fetchUrl,
        params
      ).then(data => {
        console.log("实验列表数据")
        console.log(data)
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

      this.$router.push({
        path: '/teacherCourseBasic',
        query: {obj: {"courseName": '',
                      "author": '',
                      "type": '',
                      "tag": '',
                      "time": null,
                      "remark": '',
                      "courseId": null,
                      "createTime": null}}})
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
    /*根据key结束课程, 就是删除学生实验过程中开启的容器POD*/
    onClear(key) {
      this.postRequest("api/finishcourse", {
        id:key
      }).then(resp=>{
        if(resp){
          alert('清理成功')
        }
        else{
          alert('清理失败')
        }
      })
    },
    /* 根据key打开编辑 */
    edit (key) {
      console.log('key' + key)
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
      console.log('cancel' + key)
      const newData = [...this.data]
      const target = newData.filter(item => key === item.key)[0]
      this.editingKey = ''
      if (target) {
        Object.assign(target, this.cacheData.filter(item => key === item.key)[0])
        delete target.editable
        this.data = newData
      }
    },
    Details(record) {
      console.log(record)
      this.renameBackId(record)
      if(record.hasOwnProperty('labName')){
        // 实验详情
        this.$router.push({
        path: '/teacherLabDetails',
        query: {obj: record, fromTable: true}
      })
      }
      else if(record.hasOwnProperty('picture')){
        // 课程详情
        this.$router.push({
        path: '/teacherCourseBasic',
        query: {obj: record}
      })
      }
      else{
         // 学生学习详情
        console.log("gotocourseDetials", record.userId, record.username,this.recvParam.courseid);
        this.$router.push({
        path: '/teacherStudentCourseDetails',
        query: {
          studentName: record.username,
          studentId: record.userId,
          courseId: this.recvParam.courseid,
          imageUrl: '',}
      })
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
