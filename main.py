import os
import json
import subprocess
import urllib.parse

from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from types import *
import pymysql
import torch.nn
import ast
import inspect
import importlib


app = Flask(__name__)
CORS(app)


@app.route("/")
def english_app():
    return app.send_static_file("main20231022.html")


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
    # return render_template("eng.html",words=words,wcount=wcount)
    return jsonify({"result": words})


@app.route("/net")
def netvis():
    return app.send_static_file("main2023.html")


@app.route("/module")
def module():
    print("module")
    wanted = request.args.get("wanted", type=str)
    if (wanted is None) or (wanted == "undefined") or (wanted == ""):
        wanted = 'pylibs'
    jsonfile = "netjson/" + wanted + ".json"
    print(jsonfile)
    return app.send_static_file(jsonfile)


@app.route("/treevis")
def treevis():
    # print("module")
    wanted = request.args.get("wanted", type=str)
    if (wanted is None) or (wanted == "undefined") or (wanted == ""):
        wanted = 'nn'
    jsonfile = "treejson/" + wanted + ".json"
    # print(jsonfile)
    return app.send_static_file(jsonfile)


@app.route("/treeLeaf", methods=["GET"])
def treeLeaf():
    wanted = request.args.get("wanted", type=str)

    if (wanted is None) or (wanted == "undefined") or (wanted == ""):
        wanted = 'torch.nn.modules.transformer'
    wanted = urllib.parse.quote(wanted)
    try:
        class_object = importlib.import_module(wanted)
        print(class_object)
        # jsonfile = inspect.getmembers(class_object, inspect.isclass or inspect.ismodule or inspect.ismethod())
        jsonfile = inspect.getmembers(class_object, inspect.isclass)
        jsonstrinside = ""
        jsonstroutside = []
        for item in jsonfile:
            class_str = str(item[1])
            print(item)
            start_index = class_str.find("'") + 1  # 找到第一个单引号的位置
            end_index = class_str.rfind("'")  # 找到最后一个单引号的位置
            class_name = class_str[start_index:end_index]
            print(class_name)
            if (class_name.startswith(wanted)):
                class_name=class_name[len(wanted)+1:]
                jsonstrinside = jsonstrinside + (class_name) + ","
            else:
                jsonstroutside.append(class_name)
        response_data = {
            "jsoninside": jsonstrinside,
            "jsonoutside": jsonstroutside
        }
        return jsonify(response_data)
        # print(jsonfile, type(jsonfile))
    except Exception as e:
        print("error",e)
        return jsonify({"error": "An error occurred"})


@app.route("/leafCode", methods=["GET"])
def leafCode():
    module_name = request.args.get("wanted", type=str)
    print(module_name)
    try:
        # 尝试导入模块
        module = __import__(module_name, fromlist=[''])
        # 获取模块的源代码
        source_code = open(module.__file__, 'r').read()
        print(source_code)
    except ImportError as e:
        print(f"cannot load '{module_name}': {e}")
    except Exception as e:
        print(f"error happens: {e}")
    return source_code


@app.route("/localModule")
def localModule():
    print("localModule")
    wanted = request.args.get("wanted", type=str)
    if (wanted is None) or (wanted == "undefined") or (wanted == ""):
        wanted = 'pylibs2023'
    jsonfile = "userjson_" + id + "/" + wanted + ".json"
    print(jsonfile)
    return app.send_static_file(jsonfile)


@app.route('/localPath', methods=['GET'])
def localPath():
    try:
        output = subprocess.check_output('where pip3', shell=True)
        paths = output.decode('utf-8').split('\n')
        paths = [path.strip() for path in paths if path.strip() != '']
        paths = [path[:-8] if path.endswith("pip3.exe") else path for path in paths]
        global global_paths
        global_paths = paths
        result = {'result': paths}
        return jsonify(result)
    except Exception as e:
        print(f'Error executing the command: {str(e)}')
        return jsonify({'error': 'An error occurred while executing the command'}), 500


@app.route('/userPath', methods=['GET'])
def userPath():
    new_path = request.args.get('new_path', type=int)
    global user_path
    user_path = global_paths[new_path]
    print("user_path:", user_path)
    global id
    id = str(new_path)

    try:
        os.mkdir('static/userjson_' + id)
        print(f'Folder created successfully.')
    except FileExistsError:
        print(f'Folder already exists.')
    except FileNotFoundError:
        print(f'Parent folder does not exist.')

    if not os.path.isfile('pylibs2023_' + id + '.txt'):
        print("Performs command line operations.")
        try:
            subprocess.run(user_path + 'pip3 list >>pylibs2023_' + id + '.txt', shell=True, check=True)
        except subprocess.CalledProcessError as e:
            return jsonify({'error': f'Error running pip3 list: {str(e)}'}), 500

    if not os.path.isfile('static/userjson_' + id + '/pylibs2023.json'):
        try:
            subprocess.run(["python", "extract/pylibs2023.py", "--path", user_path, "--id", id])
        except Exception as e:
            return jsonify({'error': f'Error executing pylibs2023.py: {str(e)}'}), 500
        try:
            subprocess.run(["python", "extract/pyNet4Inspect2ClassFunction2023.py", "--path", user_path, "--id", id])
        except Exception as e:
            return jsonify({'error': f'Error executing pyNet4Inspect2ClassFunction2023.py: {str(e)}'}), 500

    return jsonify({'message': 'Tasks completed successfully'})


if "__main__" == __name__:  # 程序入口
    app.run(port=5006)
