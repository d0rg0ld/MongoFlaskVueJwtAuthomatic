import Vue from 'vue/dist/vue.js';
import * as Icon from 'vue-awesome';
import axios from 'axios'
import https from 'https'

var confirmmodal = Vue.component('confirmmodal',{
	props: ['message'],
	template: `\
		<transition name="modal">\
    <div class="modal-mask">\
      <div class="modal-wrapper">\
        <div class="modal-container">\
\
          <div class="modal-header">\
            <slot name="header">\
              Confirm deletion\
            </slot>\
          </div>\
\
          <div class="modal-body">\
            <slot name="body">\
          	<a>Really delete {{message.title}} ?</a> \
            </slot>\
          </div>\
\
          <div class="modal-footer">\
            <slot name="footer">\
              <button class="modal-default-button" @click="$emit('close')">Cancel</button>\
	      <button class="modal-default-button" @click="$emit('deleterepo', message)">Delete</button>\
            </slot>\
          </div>\
        </div>\
      </div>\
    </div>\
  </transition>\
`
});


var modal = Vue.component('modal',{
	props: ['message', 'add'],
	template: `\
		<transition name="modal">\
    <div class="modal-mask">\
      <div class="modal-wrapper">\
        <div class="modal-container">\
\
          <div class="modal-header">\
            <slot name="header">\
		Edit repo
            </slot>\
          </div>\
\
          <div class="modal-body">\
            <slot name="body">\
          	<input v-model="message.title"></input> \
		<input v-model="message.url"></input> \
		<input v-model="message.desc"></input> \
            </slot>\
          </div>\
\
          <div class="modal-footer">\
            <slot name="footer">\
              <button class="modal-default-button" @click="$emit('close')">Cancel</button>\
	      <button v-if="this.add" class="modal-default-button" @click="$emit('addrepo', message)">Add</button>\
	      <button v-if="!this.add" class="modal-default-button" @click="$emit('changerepo', message)">Update</button>\
            </slot>\
          </div>\
        </div>\
      </div>\
    </div>\
  </transition>\
`
});

Vue.component('icon', Icon)

        var myList=Vue.component('repo-item', {
          props: ['title', 'url', 'desc', 'owner'],
          template: ` <tr> 
			<td style="padding 50px 0">{{ title }}</td> \
			<td style="padding 50px 0">{{ url }}</td> \
			<td style="padding 50px 0"> \
			<label style="max-width: 512px; word-wrap: break-word">{{ desc }}</label></td> \
                        <td><button  :disabled="owner==0" v-on:click="$emit(\'edit\')"><icon name="edit" style="color: #000000"></icon></button></td> \
                        <td><button :disabled="owner==0" v-on:click="$emit(\'remove\')"><icon name="ban" style="color: #FF0000"></icon></button></td> </tr>`
                        /*<td><button style="invisiblebutton" :disabled="owner==0" v-on:click="$emit(\'edit\')"><icon name="edit" style="color: #000000"></icon></button></td> \
                        <td><button style="invisiblebutton" :disabled="owner==0" v-on:click="$emit(\'remove\')"><icon name="ban" style="color: #FF0000"></icon></button></td> </tr>`*/
        });



	window.Vue=new Vue({
                el: '#repo-list-example',
                  data: {
			provider: null,
			user: null,
			jwt: null,
			axiosInstance: null,
			curRep: null,
			showModal: false,
			showConfirmModal: false,
			showAuth: false,
			showAdd: true,
                    newText: '',
                    repos: [],
                    nextRepoId: 4
                  },
		  mounted() {
			this.axiosInstance=axios.create({
				httpsAgent: new https.Agent({  
					rejectUnauthorized: false
				})
			});
			this.axiosInstance.post("https://bsceudatwp8.bsc.es/getRepoList", 
						{},
						{ headers: this.createJwtHeaderData() }
						)
			.then( response => { 
				this.repos = response.data;
				console.log(response); 
			})
			.catch(function(error) {console.log(error)});
			console.log(this.repos)
		  },
                  components: { myList : myList, modal : modal, confirmmodal : confirmmodal },
                  methods: {
		    createJwtHeaderData: function() {
			var headerdata={};
			if (this.jwt)
				headerdata = { Authorization : "Bearer " + this.jwt };
			return headerdata;
		    },
		    triggerLoginComplete: function () {
			console.log("hi there");
		    },
		    triggerLogout: function () {
			this.jwt=null;
			this.provider=null;
			this.user=null;
			window.location.reload(true);
			/*
			this.axiosInstance.post("https://bsceudatwp8.bsc.es/getRepoList", 
						{},
						{ headers: this.createJwtHeaderData() }
						)
			.then( response => { 
				this.repos = response.data;
				console.log(response); 
			})
			.catch(function(error) {console.log(error)});
			*/
		    },
		    triggerEdit: function (index) {
			this.curRep=this.repos[index];
			this.showModal = true;
			this.showAdd=false;
			this.axiosInstance.post("https://bsceudatwp8.bsc.es/getRepo", {'id':this.repos[index]['id']})
			.then( response => {
				this.curRep = response.data;
				console.log(response);
				}
			)
			.catch(function(error) {console.log(error)});
		    },
		    triggerAdd: function () {
			this.curRep={ title:"", url:"", desc:""};
			this.showModal = true;
			this.showAdd=true;
		    },
		    triggerDelete: function (index) {
			this.curRep=this.repos[index];
			this.showConfirmModal = true;
		    },
		    triggerDeleteConfirmed: function (repo) {
			this.axiosInstance.post("https://bsceudatwp8.bsc.es/deleteRepo", 
						{ 'id' : repo['id'] }, 
						{ headers: this.createJwtHeaderData() }
			)
			.then( response => {
				this.axiosInstance.post("https://bsceudatwp8.bsc.es/getRepoList", 
				{},
				{ headers: this.createJwtHeaderData() }
				)
				.then( response => { 
					this.repos = response.data;
					console.log(response); 
				})
				.catch(function(error) {console.log(error)})
			})
			.catch(function(error) {console.log(error)});
			this.showConfirmModal = false;
		    },
                    addNewRepo: function (repodata) {
			this.axiosInstance.post("https://bsceudatwp8.bsc.es/addRepo", 
						{ 'info' : repodata },
						{ headers: this.createJwtHeaderData() }
			)
			.then( response => {
				this.axiosInstance.post("https://bsceudatwp8.bsc.es/getRepoList", 
				{},
				{ headers: this.createJwtHeaderData() }
				)
				.then( response => { 
					this.repos = response.data;
					console.log(response); 
				})
				.catch(function(error) {console.log(error)})
			})
			.catch(function(error) {console.log(error)});
			this.showModal = false;
                    },
                    changeExistingRepo: function (repodata) {
			this.axiosInstance.post("https://bsceudatwp8.bsc.es/updateRepo", 
						{ 'info' : repodata },
						{ headers: this.createJwtHeaderData() }
			)
			.then( response => {
				console.log(response);
				this.axiosInstance.post("https://bsceudatwp8.bsc.es/getRepoList", 
				{},
				{ headers: this.createJwtHeaderData() }
				)
				.then( response => { 
					this.repos = response.data;
					console.log(response); 
				})
				.catch(function(error) {console.log(error)})
			})
			.catch(function(error) {console.log(error)});
			this.showModal = false;
                    }
                  }
        })
