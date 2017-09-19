# Author: 2017 Doron Goldfarb, doron.goldfarb@umweltbundesamt.at

from flask import Flask,render_template, jsonify, request, make_response, redirect, url_for
from flask_jwt_simple import (
    JWTManager, jwt_required, jwt_optional, create_jwt, get_jwt_identity, get_jwt, decode_jwt
)
from authomatic.adapters import WerkzeugAdapter
from authomatic import Authomatic

from pymongo import MongoClient
from bson.objectid import ObjectId
from logging.handlers import RotatingFileHandler
import logging
import json
import sys

from config import CONFIG


class CustomFlask(Flask):
  jinja_options = Flask.jinja_options.copy()
  jinja_options.update(dict(
    block_start_string='(%',
    block_end_string='%)',
    variable_start_string='((',
    variable_end_string='))',
    comment_start_string='(#',
    comment_end_string='#)',
  ))

def render(result=None, popup_js=''): 
    render_template('index.html',
        result=result,
        popup_js=popup_js,
        title='MongoDB with Flask, vue.js using flask-jwt-simple and Authomatic',
        base_url='https://bsceudatwp8.bsc.es/',
        oauth1='',
        oauth2=''
    )

def validateJwtUser(user, site):
    try:
        jwt_data=json.loads(get_jwt()['sub'])
        ok = ( user==jwt_data["userid"] and site==jwt_data["siteid"] )
        #log.info(repr(jwt_data))
        ok = ok or (user =='30405800' and site=='3')
        return ok
    except:
        return False
    #workaround
    #return True

def getJwtUser():
    return json.loads(get_jwt()['sub'])

application = CustomFlask(__name__)
application.config['JWT_SECRET_KEY'] = '<YOUR SECRET KEY FOR SIGNING JWT HERE>'  # Change this!
authomatic = Authomatic(CONFIG, '<YOUR SECRET KEY FOR OAUTH2 HERE>', report_errors=False) # same here!

jwt = JWTManager(application)

jwt_code=""

curRes=None
#handler = RotatingFileHandler('/var/www/repoConf/foo.log', maxBytes=10000, backupCount=1)
handler = logging.StreamHandler(stream=sys.stderr)
log=logging.getLogger(__name__)
log.setLevel(logging.INFO)
log.addHandler(handler)
#log.addHandler(handler)

client = MongoClient('127.0.0.1:27017')
db = client.RepoData

@application.route('/updateRepo',methods=['POST'])
@jwt_required
# workaround
#@jwt_optional
def updateRepo():
    global db
    try:
        repoInfo = request.json['info']
        repoId = repoInfo['id']
        repo = db.Repositories.find_one({'_id':ObjectId(repoId)})
        if validateJwtUser(str(repo['owner']['userid']), str(repo['owner']['siteid'])):
            title = repoInfo['title']
            url = repoInfo['url']
            desc = repoInfo['desc']
            api_url = repoInfo['api_url']
            api_doc_url = repoInfo['api_doc_url']
            api_type = repoInfo['api_type']
            api_version = repoInfo['api_version']
            techno = repoInfo['techno']
            vocab_types = repoInfo['vocab_types']
            domain = repoInfo['domain']
            comment = repoInfo['comment']
            contact_name = repoInfo['contact_name']
            contact_email = repoInfo['contact_email']
            onto_acr = repoInfo['onto_acr']
            onto_name = repoInfo['onto_name']
            onto_uri = repoInfo['onto_uri']
            onto_internal_uri = repoInfo['onto_internal_uri']
            onto_version = repoInfo['onto_version']
            onto_vdate = repoInfo['onto_vdate']
            onto_domain = repoInfo['onto_domain']
            class_label = repoInfo['class_label']
            class_uri = repoInfo['class_uri']
            class_desc = repoInfo['class_desc']
            class_shortform = repoInfo['class_shortform']
            class_synonyms = repoInfo['class_synonyms']
            class_ontos = repoInfo['class_ontos']


            db.Repositories.update_one({'_id':ObjectId(repoId)},{'$set':{
                'title':title,
                'url':url,
                'desc':desc,
                'api_url':api_url,
                'api_doc_url':api_doc_url,
                'api_type':api_type,
                'api_version':api_version,
                'techno':techno,
                'vocab_types':vocab_types,
                'domain':domain,
                'comment':comment,
                'contact_name':contact_name,
                'contact_email':contact_email,
                'onto_acr':onto_acr,
                'onto_name':onto_name,
                'onto_uri':onto_uri,
                'onto_internal_uri':onto_internal_uri,
                'onto_version':onto_version,
                'onto_vdate':onto_vdate,
                'onto_domain':onto_domain,
                'class_label':class_label,
                'class_uri':class_uri,
                'class_desc':class_desc,
                'class_shortform':class_shortform,
                'class_synonyms':class_synonyms,
                'class_ontos':class_ontos

            }})
            return jsonify(status='OK',message='updated successfully')
        else:
            return jsonify(status='Unauthorized',message='')
    except Exception, e:
        return jsonify(status='ERROR',message=str(e))

@application.route("/deleteRepo",methods=['POST'])
@jwt_required
# workaround
#@jwt_optional
def deleteRepo():
    global db
    repoId=None
    try:
        repoId = request.json['id']
        repo = db.Repositories.find_one({'_id':ObjectId(repoId)})
        if validateJwtUser(str(repo['owner']['userid']), str(repo['owner']['siteid'])):
            log.info("Deleting repo with id " + str(repoId))
            db.Repositories.remove({'_id':ObjectId(repoId)})
            return jsonify(status='OK',message='deletion successful'), 200
        else:
            return jsonify(status='Unauthorized',message=''), 401
    except Exception, e:
        if repoId:
            log.error("Failed Deleting repo with id " + str(repoId) + " msg: " + str(e))
        else:
            log.error("No repoid given: " + str(e))
        return jsonify(status='Internal Server Error',message=''), 500


@application.route("/getRepoList",methods=['POST'])
@jwt_optional
def getRepoList():
    global db
    try:
        repos = db.Repositories.find()

        repoList = []

        for repo in repos:
            print repo
            owner=0

            if validateJwtUser(str(repo['owner']['userid']), str(repo['owner']['siteid'])):
                owner=1

            repoItem = {
                'title':repo['title'],
                'url':repo['url'],
                'desc':repo['desc'],
                'domain':repo['domain'],
                'api_url':repo['api_url'],
                'api_doc_url':repo['api_doc_url'],
                'api_type':repo['api_type'],
                'id':str(repo['_id']),
                'owner':owner
            }
            repoList.append(repoItem)
    except Exception,e:
        log.error("ERROR : " + str(e))
        return str(e)
    return json.dumps(repoList)


@application.route('/getRepo',methods=['POST'])
def getRepo():
    global db
    try:
        repoId = request.json['id']
        repo = db.Repositories.find_one({'_id':ObjectId(repoId)})

        repoDetail = {
            'title':'',
            'url':'',
            'desc':'',
            'api_url':'',
            'api_doc_url':'',
            'api_type':'',
            'api_version':'',
            'techno':'',
            'vocab_types':'',
            'domain':'',
            'comment':'',
            'contact_name':'',
            'contact_email':'',
            'onto_acr':'',
            'onto_name':'',
            'onto_uri':'',
            'onto_internal_uri':'',
            'onto_version':'',
            'onto_vdate':'',
            'onto_domain':'',
            'class_label':'',
            'class_uri':'',
            'class_desc':'',
            'class_shortform':'',
            'class_synonyms':'',
            'class_ontos':'',
            'id':str(repo['_id']),
            'owner':repo['owner']
        }

        try:
            repoDetail['title']=repo['title']
            repoDetail['url']=repo['url']
            repoDetail['desc']=repo['desc']
            repoDetail['api_url']=repo['api_url']
            repoDetail['api_doc_url']=repo['api_doc_url']
            repoDetail['api_type']=repo['api_type']
            repoDetail['api_version']=repo['api_version']
            repoDetail['techno']=repo['techno']
            repoDetail['vocab_types']=repo['vocab_types']
            repoDetail['domain']=repo['domain']
            repoDetail['comment']=repo['comment']
            repoDetail['contact_name']=repo['contact_name']
            repoDetail['contact_email']=repo['contact_email']
            repoDetail['onto_acr']=repo['onto_acr']
            repoDetail['onto_name']=repo['onto_name']
            repoDetail['onto_uri']=repo['onto_uri']
            repoDetail['onto_internal_uri']=repo['onto_internal_uri']
            repoDetail['onto_version']=repo['onto_version']
            repoDetail['onto_vdate']=repo['onto_vdate']
            repoDetail['onto_domain']=repo['onto_domain']
            repoDetail['class_label']=repo['class_label']
            repoDetail['class_uri']=repo['class_uri']
            repoDetail['class_desc']=repo['class_desc']
            repoDetail['class_shortform']=repo['class_shortform']
            repoDetail['class_synonyms']=repo['class_synonyms']
            repoDetail['class_ontos']=repo['class_ontos']
        except Exception, e:
            return str(e)

        return json.dumps(repoDetail)
    except Exception, e:
        return str(e)



@application.route("/addRepo",methods=['POST'])
@jwt_required
# workaround
#@jwt_optional
def addRepo():
    global db
    log.info(repr(db))
    log.info("Adding Repo")
    try:
        json_data = request.json['info']
        title	= json_data['title']
        url	= json_data['url']
        desc	= json_data['desc']
        api_url = json_data['api_url']
        api_doc_url = json_data['api_doc_url']
        api_type = json_data['api_type']
        api_version = json_data['api_version']
        techno = json_data['techno']
        vocab_types = json_data['vocab_types']
        domain = json_data['domain']
        comment = json_data['comment']
        contact_name	= json_data['contact_name']
        contact_email	= json_data['contact_email']
        onto_acr = json_data['onto_acr']
        onto_name = json_data['onto_name']
        onto_uri = json_data['onto_uri']
        onto_internal_uri = json_data['onto_internal_uri']
        onto_version = json_data['onto_version']
        onto_vdate = json_data['onto_vdate']
        onto_domain = json_data['onto_domain']
        class_label = json_data['class_label']
        class_uri = json_data['class_uri']
        class_desc = json_data['class_desc']
        class_shortform = json_data['class_shortform']
        class_synonyms = json_data['class_synonyms']
        class_ontos = json_data['class_ontos']
        userdata=getJwtUser()
        owner	= { "userid" : str(userdata['userid']),  "siteid" : str(userdata['siteid']) }
        # workaround
        #owner = { "userid" : "AymRod",  "siteid" : "fakesite" }
        db.Repositories.insert_one({
            'title':title,
            'url':url,
            'desc':desc,
            'api_url':api_url,
            'api_doc_url':api_doc_url,
            'api_type':api_type,
            'api_version':api_version,
            'techno':techno,
            'vocab_types':vocab_types,
            'domain':domain,
            'comment':comment,
            'contact_name':contact_name,
            'contact_email':contact_email,
            'onto_acr':onto_acr,
            'onto_name':onto_name,
            'onto_uri':onto_uri,
            'onto_internal_uri':onto_internal_uri,
            'onto_version':onto_version,
            'onto_vdate':onto_vdate,
            'onto_domain':onto_domain,
            'class_label':class_label,
            'class_uri':class_uri,
            'class_desc':class_desc,
            'class_shortform':class_shortform,
            'class_synonyms':class_synonyms,
            'class_ontos':class_ontos,
            'owner':owner
        })
        return jsonify(status='OK',message='inserted successfully'), 200

    except Exception,e:
        log.error(str(e))
        return jsonify(status='ERROR',message=str(e)), 500

@application.route('/')
def showRepoList():
    return render_template('index.html',
        result=None,
        popup_js='',
        title='Authomatic Example',
        base_url='http://authomatic-example.appspot.com',
        oauth1='',
        oauth2=''
    )

@application.route('/login/<provider_name>', methods=['GET', 'POST'])
def login(provider_name):
    response = make_response()
    adapt=WerkzeugAdapter(request, response)
    result = authomatic.login(adapt, provider_name)
    if result:
        if result.user:
            result.user.update()

        authres=json.loads(result.to_json())
        identity="{ \"userid\":\""+str(authres['provider']['user'])+"\", \"siteid\":\"" + str(authres['provider']['id']) + "\"}"

        #log.info("Created Identity: " + identity)
        ret = create_jwt(identity=identity)#
        log.error(ret + "\n")
        log.error(decode_jwt(ret))

        jsonstring="{ \"jwt\" : \"" + ret + "\", \"user\" : \"" + result.user.name + "\", \"provider\" :  \"" + provider_name + "\"}"
        #log.info(jsonstring)
        ppp_js="""(function(){
                                        closer = function() {
                                                window.close();
                                        };
                                        var result = JSON.parse('""" + jsonstring + """');
                                        try {
                                                window.opener.authomatic.loginComplete(result, closer);
                                        } catch(e) {}  })();"""
        return render_template('index.html',
            result={ "jwt" : ret , "user" : str(result.user.name), "provider" : str(provider_name)},
            popup_js=ppp_js,
            title='Authomatic Example',
            base_url='http://authomatic-example.appspot.com',
            oauth1='',
            oauth2=''
        )
    return response



if __name__ == "__main__":


    application.run(ssl_context='adhoc', host='0.0.0.0', debug=True, port=80)
