// Author: 2017 Doron Goldfarb, doron.goldfarb@umweltbundesamt.at

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
	props: ['message', 'first', 'add'],
	template: `\
		<transition name="modal">\
    <div class="modal-mask">\
      <div class="modal-wrapper">\
        <div class="modal-container">\
\
          <div v-if="this.first" class="modal-header">\
            <slot name="header">\
		General information about the repository
            </slot>\
          </div>\
          <div v-if="!this.first" class="modal-header">\
            <slot name="header">\
		Mapping for ontologies and classes
            </slot>\
          </div>\
\
          <div style="max-height: 400px; overflow:scroll; border: 1px black solid">
          <div class="modal-body">\
            <slot name="body">\
            <table v-if="this.first">
                <tr>
                    <td>Name *</td>
                    <td><input v-model="message.title"></input></td>
                </tr>
                <tr>
                    <td>URL *</td>
                    <td><input v-model="message.url"></input></td>
                </tr>
                <tr>
                    <td>Description</td>
                    <td><input v-model="message.desc"></input></td>
                </tr>
                <tr>
                    <td>URL of the API *</td>
                    <td><input v-model="message.api_url"></input></td>
                </tr>
                <tr>
                    <td>URL of the documentation of the API</td>
                    <td><input v-model="message.api_doc_url"></input></td>
                </tr>
                <tr>
                    <td>API type (REST, SPARQL)</td>
                    <td><input v-model="message.api_type"></input></td>
                </tr>
                <tr>
                    <td>API version</td>
                    <td><input v-model="message.api_version"></input></td>
                </tr>
                <tr>
                    <td>Technology used (BioPortal, SKOSMOS...)</td>
                    <td><input v-model="message.techno"></input></td>
                </tr>
                <tr>
                    <td>Types of vocabularies (OWL, SKOS, OBO...)</td>
                    <td><input v-model="message.vocab_types"></input></td>
                </tr>
                <tr>
                    <td>Domain coverage</td>
                    <td><input v-model="message.domain"></input></td>
                </tr>
                <tr>
                    <td>Commentaries</td>
                    <td><input v-model="message.comment"></input></td>
                </tr>
                <tr>
                    <td>Contact</td>
                    <td><input v-model="message.contact"></input></td>
                </tr>
          	</table>
            <slot v-if="!this.first" name="header">\
		        How are the following attributes named in your model? <br>
		        If the attribute doesn't exist, enter: None<br><br>
		        1) Ontology mapping
            </slot>\
            <table v-if="!this.first">
                <tr>
                    <td>Ontology acronym</td>
                    <td><input v-model="message.onto_acr"></input></td>
                </tr>
                <tr>
                    <td>Ontology name</td>
                    <td><input v-model="message.onto_name"></input></td>
                </tr>
                <tr>
                    <td>Ontology URI</td>
                    <td><input v-model="message.onto_uri"></input></td>
                </tr>
                <tr>
                    <td>Internal URI</td>
                    <td><input v-model="message.onto_internal_uri"></input></td>
                </tr>
                <tr>
                    <td>Ontology version</td>
                    <td><input v-model="message.onto_version"></input></td>
                </tr>
                <tr>
                    <td>Ontology Release date</td>
                    <td><input v-model="message.onto_rdate"></input></td>
                </tr>
                <tr>
                    <td>Ontology Domain</td>
                    <td><input v-model="message.onto_domain"></input></td>
                </tr>
          	</table>
            <slot v-if="!this.first" name="header">\
		        2) Class mapping
            </slot>\
            <table v-if="!this.first">
                <tr>
                    <td>Class label</td>
                    <td><input v-model="message.class_label"></input></td>
                </tr>
                <tr>
                    <td>Class URI</td>
                    <td><input v-model="message.class_uri"></input></td>
                </tr>
                <tr>
                    <td>Class description</td>
                    <td><input v-model="message.class_desc"></input></td>
                </tr>
                <tr>
                    <td>Class short form</td>
                    <td><input v-model="message.class_shortform"></input></td>
                </tr>
                <tr>
                    <td>Class synonyms</td>
                    <td><input v-model="message.class_synonyms"></input></td>
                </tr>
                <tr>
                    <td>Acronyms for ontologies reusing this class</td>
                    <td><input v-model="message.class_ontos"></input></td>
                </tr>
          	</table>
            </slot>\
          </div>\
          <div style="padding-left: 20px; font-size: 70%">
              Fields marked with a * are mandatory.
          </div>
          </div>

\
          <div class="modal-footer" id="button_footer">\
            <slot name="footer">\
              <div style="padding-right: 20px"><button class="modal-default-button" @click="$emit('close')">Cancel</button></div>

	          <button v-if="this.first" class="modal-default-button-not"><</button>\
	          <button v-if="!this.first" class="modal-default-button" @click="$emit('first', message)"><</button>
	          <div v-if="this.first" style="font-size: 120%; padding: 0px 3px 18px 2px">1/2</div>\
	          <div v-if="!this.first" style="font-size: 120%; padding: 0px 3px 18px 2px">2/2</div>\
	          <button v-if="this.first & message.title!='' & message.url!='' & message.api_url!='' " class="modal-default-button" @click="$emit('second', message)">></button>
	          <button v-else class="modal-default-button-not">></button>

	          <div v-if="this.add & !this.first" style="padding-left: 150px"><button class="modal-default-button" @click="$emit('addrepo', message)">Add</button></div>
	          <div v-if="!this.add & message.title!='' & message.url!='' & message.api_url!=''" style="padding-left: 150px"><button class="modal-default-button" @click="$emit('changerepo', message)">Update</button></div>
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
			<label style="max-width: 512px; word-wrap: break-word; cursor: default">{{ desc }}</label></td> \
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
			firstForm: true,
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
			this.axiosInstance.post("getRepoList",
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
                  components: { myList : myList, modal : modal, confirmmodal : confirmmodal},
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
			this.axiosInstance.post("getRepoList",
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
			this.axiosInstance.post("getRepo", {'id':this.repos[index]['id']})
			.then( response => {
				this.curRep = response.data;
				console.log(response);
				}
			)
			.catch(function(error) {console.log(error)});
		    },
		    triggerAdd: function () {
			this.curRep={
			    title:"",
			    url:"",
			    desc:"",
			    api_url:"",
			    api_doc_url:"",
			    api_type:"",
			    api_version:"",
			    techno:"",
			    vocab_types:"",
			    domain:"",
			    comment:"",
			    contact:"",
                onto_acr:"",
                onto_name:"",
                onto_uri:"",
                onto_internal_uri:"",
                onto_version:"",
                onto_vdate:"",
                onto_domain:"",
                class_label:"",
                class_uri:"",
                class_desc:"",
                class_shortform:"",
                class_synonyms:"",
                class_ontos:"",
			    };
			this.showModal=true;
			this.showAdd=true;
		    },
		    triggerDelete: function (index) {
			this.curRep=this.repos[index];
			this.showConfirmModal = true;
		    },
		    triggerDeleteConfirmed: function (repo) {
			this.axiosInstance.post("deleteRepo",
						{ 'id' : repo['id'] }, 
						{ headers: this.createJwtHeaderData() }
			)
			.then( response => {
				this.axiosInstance.post("getRepoList",
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
			this.axiosInstance.post("addRepo",
						{ 'info' : repodata },
						{ headers: this.createJwtHeaderData() }
			)
			.then( response => {
				this.axiosInstance.post("getRepoList",
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
			this.firstForm = true;
                    },
                    changeExistingRepo: function (repodata) {
			this.axiosInstance.post("updateRepo",
						{ 'info' : repodata },
						{ headers: this.createJwtHeaderData() }
			)
			.then( response => {
				console.log(response);
				this.axiosInstance.post("getRepoList",
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
