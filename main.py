from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import os
import pymysql
import subprocess


app = Flask(__name__)
CORS(app)


@app.route("/")
def english_app():
    # return "Hello"
    return app.send_static_file("mobile.html")


@app.route("/mobile")
def mobileApp():
    wanted = request.args.get("wanted", type=str)
    if wanted is None:
        wanted = 'pineapple'
    db = pymysql.connect(host="localhost", user="root", passwd="123456", db="english202211", charset='utf8')
    cursor = db.cursor()
    print(cursor)
    try:
        # sql="select * from map_enword limit 10"
        sql = "select * from map_enword where english like '" + wanted + "%'"
        cursor.execute(sql)
        rs = cursor.fetchall()
        words = list(rs)
        print(words)
        wcount = len(words)
    except:
        rs = 'db-error'
    # return render_template("eng.html", words=words, wcount=wcount)
    return jsonify({"result": words})


@app.route("/net")
def netvis():
    return app.send_static_file("main2023.html")


@app.route("/module")
def module():
    print("module")
    wanted = request.args.get("wanted", type=str)
    if wanted is None:
        wanted = 'pylibs'
    jsonfile = "netjson/"+wanted+".json"
    print(jsonfile)
    return app.send_static_file(jsonfile)


@app.route('/localPath', methods=['GET'])
def localPath():
    try:
        output = subprocess.check_output('where pip3', shell=True)
        paths = output.decode('utf-8').split('\n')
        paths = [path.strip() for path in paths if path.strip() != '']
        result = {'result': paths}
        return jsonify(result)
    except Exception as e:
        print(f'Error executing the command: {str(e)}')
        return jsonify({'error': 'An error occurred while executing the command'}), 500


if "__main__" == __name__:  # 程序入口
    app.run(port=5006)
