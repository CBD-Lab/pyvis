import urllib.parse

from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from types import *
import os
import pymysql
import subprocess
import torch.nn
import ast
import inspect
import json
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
        #sql="select * from map_enword limit 10"
        sql = "select * from map_enword where english like '"+wanted+"%'"
        cursor.execute(sql)
        rs = cursor.fetchall()
        words = list(rs)
        print(words)
        wcount = len(words)
    except:
        rs = 'db-error'
    #return render_template("eng.html",words=words,wcount=wcount)
    return jsonify({"result":words})


@app.route("/net")
def netvis():
    return app.send_static_file("main2023.html")


@app.route("/module")
def module():
    print("module")
    wanted = request.args.get("wanted", type=str)
    if (wanted == None)or(wanted=="undefined")or(wanted==""):
        wanted = 'pylibs'
    jsonfile="netjson/"+wanted+".json"
    print(jsonfile)
    return app.send_static_file(jsonfile)


@app.route("/treevis")
def treevis():
    #print("module")
    wanted = request.args.get("wanted", type=str)
    if (wanted == None)or(wanted=="undefined")or(wanted==""):
        wanted = 'nn'
    jsonfile="treejson/"+wanted+".json"
    #print(jsonfile)
    return app.send_static_file(jsonfile)


@app.route("/treeLeaf", methods=["GET"])
def treeLeaf():
    wanted = request.args.get("wanted", type=str)

    if (wanted == None)or(wanted=="undefined")or(wanted==""):
        wanted = 'torch.nn.modules.transformer'
    print(wanted)

    wanted = urllib.parse.quote(wanted)
    try:
        class_object = importlib.import_module(wanted)
        print(class_object)
        jsonfile = inspect.getmembers(class_object, inspect.isclass or inspect.ismodule or inspect.ismethod())
        jsonstr = ""
        for item in jsonfile:
            class_str = str(item[1])
            print(item)
            start_index = class_str.find("'") + 1  # 找到第一个单引号的位置
            end_index = class_str.rfind("'")  # 找到最后一个单引号的位置
            class_name = class_str[start_index:end_index]
            jsonstr = jsonstr + (class_name) + "\n"
        jsonfile = json.dumps(jsonstr, default=str)
        print(jsonfile, type(jsonfile))
    except:
        print("error")
        jsonfile=None
    # jsonfile+="\n"
    # 将二维数组转换为一维数组
    # flattened_data = [item for sublist in jsonfile for item in sublist]
    # 将一维数组转换为逗号分隔的字符串
    # result = ', '.join(flattened_data)
    # print(result)
    return jsonify(jsonfile)


@app.route("/localModule")
def localModule():
    print("localModule")
    wanted = request.args.get("wanted", type=str)
    if wanted is None:
        wanted = 'pylibs2023'
    jsonfile = "userjson/"+wanted+".json"
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


def pylibs2023():
    import json

    netjson = {"links": "", "nodes": ""}
    nodejson = []
    edgejson = []
    pylibs = []

    e = {"source": -1, "target": -1}

    def requires(libname):
        import os
        import subprocess
        try:
            temp_output_file = "temp_output.txt"
            command = [user_path+'pip3', 'show', libname]
            subprocess.run(command, stdout=open(temp_output_file, 'w', encoding='utf-8'),
                           stderr=subprocess.PIPE, check=True)
            # 从临时文件读取输出
            with open(temp_output_file, 'r', encoding='utf-8') as f:
                output = f.read()
            os.remove(temp_output_file)  # 删除临时文件

            relist = output.split('\n')
            requirelist = []
            requiredlist = []
            for line in relist:
                if line.startswith("Requires:"):
                    requirelist = line[len("Requires: "):].strip().split(', ')
                elif line.startswith("Required-by:"):
                    requiredlist = line[len("Required-by: "):].strip().split(', ')
            return requirelist, requiredlist
        except subprocess.CalledProcessError as e:
            print(f"Error: {e}")

    def readpylibs():
        filename = 'pylibs2023.txt'
        i = 0
        with open(filename, 'r', encoding='utf-8') as f:
            line = f.readline()
            while line:
                # print("line", line)
                pylibs.append(line.split(" ")[0])
                line = f.readline()
                i = i + 1
            print("i", i)
        print("pylibs before", pylibs)
        # pylibs.pop()
        # pylibs = pylibs
        # print("pylibs after", pylibs)
        return pylibs[2:]

    # 节点
    def nodes(pylibs):
        for n in pylibs:
            d = {"name": ""}
            d['name'] = n
            # print(d)
            nodejson.append(d)
            # print(nodejson)
        netjson['nodes'] = nodejson
        return len(nodejson)

    # 边的关系
    def edges(pylibs):
        # print("edges pylibs", pylibs)
        for n in pylibs:
            print('--------------------------------------------')
            print(n)
            requirelist, requiredlist = requires(n)

            print("requirelist", requirelist)
            print("requiredlist", requiredlist)

            i = 0
            if not (len(requirelist) == 1 and requirelist[0] == ''):
                for eg in requirelist:
                    test = e.copy()
                    test['source'] = (pylibs.index(n))
                    if not (eg in pylibs):
                        pylibs.append(eg)
                    test['target'] = (pylibs.index(eg))
                    edgejson.append(test)
                    i = i + 1
                netjson['links'] = edgejson
        return len(edgejson)


    f = open('static/userjson/pylibs2023.json', 'w', encoding='utf-8')
    netjson = {"links": "", "nodes": ""}
    nodejson = []
    edgejson = []
    pylibs = []
    e = {"source": -1, "target": -1}
    print("即将开始运行pylibs2023!")
    pylibs = readpylibs()
    print("ptlibs after", pylibs)
    edges(pylibs)
    nodes(pylibs)
    f.write(json.dumps(netjson))
    f.close()


def pyNet4Inspect2ClassFunction2023():
    import inspect
    import json
    import importlib

    modules = []
    mnetjson = {'nodes': '', 'links': ''}
    nodes = []
    links = []
    myclass = ""
    myfunction = ""

    layer = 0

    def get_modules(arg, str, layer):
        try:
            if arg.__name__ == filename:
                modules.append(arg.__name__)
                # 获取当前模块中类和函数的信息
                hasclass = inspect.getmembers(arg, inspect.isclass)
                hasfunction = inspect.getmembers(arg, inspect.isfunction)
                print("\n-------Function-------")
                print("hasclass:", hasclass)
                print("hasfunction:", hasfunction)
                myclass = ""
                classcount = 0
                for h in hasclass:
                    if h[1].__module__ == arg.__name__:
                        # myclass = myclass + h[1].__module__ + "." + h[1].__name__ + ";"
                        myclass = myclass + h[1].__name__ + ";"
                        classcount = classcount + 1;

                myfunction = ""
                functioncount = 0
                for f in hasfunction:
                    if f[1].__module__ == arg.__name__:
                        myfunction = myfunction + f[1].__name__ + ";"
                        functioncount = functioncount + 1;
                nodes.append(
                    {'name': arg.__name__, 'file': arg.__file__, 'layer': layer, 'hasclass': classcount,
                     'myclass': myclass,
                     'hasfunction': functioncount, 'myfunction': myfunction})
        except Exception as e:
            print(f"Error in module {filename}: {e}. Skipping...")

        # 获取当前模块中的子模块信息
        mmembers = inspect.getmembers(arg, inspect.ismodule)
        layer = layer + 1
        print("mmembers:", mmembers)
        print('--------------------------')
        for (name, moduleurl) in mmembers:
            try:
                # print("name=" + name)
                # print(moduleurl.__name__)
                if str in moduleurl.__name__ and not (moduleurl.__name__ in modules):
                    modules.append(moduleurl.__name__)
                    mname = arg.__name__ + "." + name
                    # modules.append(mname)
                    # print(modules)

                    # print(mname)
                    if ('__file__' in dir(eval(moduleurl.__name__))) or (
                            len(inspect.getmembers(arg, inspect.ismodule)) > 0):
                        # print(eval(mname).__file__)
                        hasclass = inspect.getmembers(eval(moduleurl.__name__), inspect.isclass)
                        hasfunction = inspect.getmembers(eval(moduleurl.__name__), inspect.isfunction)
                        # print(mname + "=---Function--------------")
                        # print(hasfunction)
                        myclass = ""
                        classcount = 0
                        for h in hasclass:
                            if h[1].__module__ == mname:
                                # myclass = myclass + h[1].__module__ + "." + h[1].__name__ + ";"
                                myclass = myclass + h[1].__name__ + ";"
                                classcount = classcount + 1;

                        myfunction = ""
                        functioncount = 0
                        for f in hasfunction:
                            if f[1].__module__ == mname:
                                myfunction = myfunction + f[1].__name__ + ";"
                                functioncount = functioncount + 1;
                        if ('__file__' in dir(eval(moduleurl.__name__))):
                            nodes.append(
                                {'name': moduleurl.__name__, 'file': eval(moduleurl.__name__).__file__, 'layer': layer,
                                 'hasclass': classcount, 'myclass': myclass, "hasfunction": functioncount,
                                 "myfunction": myfunction})
                        else:
                            nodes.append({'name': moduleurl.__name__, 'file': 'null', 'layer': layer,
                                          'hasclass': classcount, 'myclass': myclass, "hasfunction": functioncount,
                                          "myfunction": myfunction})
                        # print('\n-----------')
                        # print(mname)
                        get_modules(eval(moduleurl.__name__), filename, layer)
            except Exception as e:
                print(f"Error in module {moduleurl.__name__}: {e}. Skipping...")
        return modules

    def get_links(mymodule, str):
        for m in mymodule:
            nextmodules = []
            print("m:", m)
            try:
                # 获取当前模块m中的子模块信息
                mm = inspect.getmembers(eval(m), inspect.ismodule)
                print("mm:", mm)
                print('--------------------------')
                for (name, moduleurl) in mm:
                    if str in moduleurl.__name__:
                        nextmodules.append(moduleurl.__name__)
                for n in nextmodules:
                    links.append({'source': mymodule.index(m), 'target': mymodule.index(n)})
            except Exception as e:
                print(f"Error in module {m}: {e}. Skipping...")
        print("links:", links)
        return links

    def netjson(filename):
        # 递归搜索模块Module节点
        mymodule = get_modules(eval(filename), filename, layer)
        print("mymodule:", mymodule)
        print("----")
        print("len(nodes):", len(nodes))

        get_links(mymodule, filename)

        mnetjson['nodes'] = nodes
        mnetjson['links'] = links

        print("mnetjson:", mnetjson)
        print('-------End-------')

        f = open('static/userjson/' + filename + '.json', 'w')
        f.write(json.dumps(mnetjson))
        f.close()

    def readpackages():
        packages = []
        filename = 'pylibs2023.txt'
        i = 0
        with open(filename, 'r', encoding='utf-8') as f:
            line = f.readline()
            while line:
                # print("line", line)
                packages.append(line.split(" ")[0])
                line = f.readline()
                i = i + 1
            print("i", i)
        print("pylibs before", packages)
        return packages[2:]

    path = user_path[:-8] + 'Lib\site-packages'
    package_names = []
    print("即将开始运行pyNet4Inspect2ClassFunction2023!")
    package_names = readpackages()
    print("package_names", package_names)
    for package_name in package_names:
        filename = package_name.replace(".py", "")
        print("filename:", filename)
        try:
            # 检查模块是否存在，如果存在则导入
            if importlib.util.find_spec(filename):
                import_statement = "import " + filename
                print(import_statement)
                exec(import_statement)
                # importlib.import_module(filename)
                netjson(filename)
        except Exception as e:
            print(f"Error in package {filename}: {e}. Skipping...")


@app.route('/userPath', methods=['GET'])
def userPath():
    new_path = request.args.get('new_path', type=int)
    global user_path
    user_path = global_paths[new_path]
    print("user_path:", user_path)

    if not os.path.isfile('pylibs2023.txt'):
        print("执行命令行操作")
        try:
            subprocess.run('pip3 list >>pylibs2023.txt', shell=True, check=True)
        except subprocess.CalledProcessError as e:
            return jsonify({'error': f'Error running pip3 list: {str(e)}'}), 500

    if not os.path.isfile('static/userjson/pylibs2023.json'):
        try:
            print("在尝试调用pylibs2023文件")
            pylibs2023()
        except Exception as e:
            print("pylibs2023失败了")
            return jsonify({'error': f'Error executing pylibs2023: {str(e)}'}), 500
        try:
            print("在尝试调用pyNet4Inspect2ClassFunction2023文件")
            pyNet4Inspect2ClassFunction2023()
        except Exception as e:
            print("pyNet4Inspect2ClassFunction2023失败了")
            return jsonify({'error': f'Error executing pylibs2023: {str(e)}'}), 500

    return jsonify({'message': 'Tasks completed successfully'})


if "__main__"==__name__:   # 程序入口
    app.run(port=5006)
