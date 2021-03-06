import Vue from 'vue'
import Vuex from 'vuex'
 
Vue.use(Vuex)
 
const store = new Vuex.Store({
    state: {
        userName: "",
		    userId: null,
        userType: 0,
        baseUrl: "http://10.168.4.167:8081/"
    },
    mutations: {
		update(state,[key,value]){
			state[key]=value;
		},
    }
})
 
export default store