import os
import subprocess
import urllib.parse
import shutil
from flask import Flask, request, jsonify
from flask_cors import CORS
import inspect
import importlib
from extract import pylibsNet, pyNet4Inspect2ClassFunctionAll, pyNet4Inspect2ClassFunctionSingle

app = Flask(__name__)
CORS(app)


@app.route("/")
def netvis():
    return app.send_static_file("main.html")


@app.route("/module")
def module():
    print("module")
    wanted = request.args.get("wanted", type=str)
    if (wanted is None) or (wanted == "undefined") or (wanted == ""):
        wanted = 'pylibsNet'
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
        jsonfile = inspect.getmembers(class_object, inspect.isclass)
        jsonstrinside = []
        jsonstroutside = []
        for item in jsonfile:
            class_str = str(item[1])
            start_index = class_str.find("'") + 1  # 找到第一个单引号的位置
            end_index = class_str.rfind("'")  # 找到最后一个单引号的位置
            class_name = class_str[start_index:end_index]
            if (class_name.startswith(wanted)):
                # class_name=class_name[len(wanted)+1:]
                jsonstrinside.append(class_name)
                # jsonstrinside = jsonstrinside + (class_name) + "\n"
            else:
                jsonstroutside.append(class_name)
        response_data = {
            "jsoninside": jsonstrinside,
            "jsonoutside": jsonstroutside
        }
        return jsonify(response_data)
        # print(jsonfile, type(jsonfile))
    except Exception as e:
        print("error", e)
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


@app.route("/bubbleCode", methods=["GET"])
def bubbleCode():
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
    

@app.route("/moduletxt")
def moduletxt():
    wanted = request.args.get("wanted", type=str)
    if wanted == None:
        wanted = 'inspect'
    wanted = wanted[0:wanted.find(".py")]
    wanted = "torch.nn.modules." + wanted
    import_statement = "import " + wanted
    print(import_statement)
    exec(import_statement)

    print(wanted)
    # modulesrc=inspect.getsource(eval(wanted))
    modulesrc = open(eval(wanted).__file__).read()
    # return jsonify({"result":modulesrc})
    return modulesrc


@app.route("/localModule")
def localModule():
    print("localModule")
    wanted = request.args.get("wanted", type=str)
    if (wanted is None) or (wanted == "undefined") or (wanted == ""):
        wanted = 'pylibsNet'
    jsonfile = "netjson/" + wanted + ".json"
    print(jsonfile)
    return app.send_static_file(jsonfile)


@app.route('/localPath', methods=['GET'])
def localPath():
    try:
        output = subprocess.check_output('where pip3', shell=True)
        paths = output.decode('utf-8').split('\n')
        paths = [path.strip() for path in paths if path.strip() != '']
        paths = [path[:-8] if path.endswith("pip3.exe") else path for path in paths]
        result = {'result': paths}
        return jsonify(result)
    except Exception as e:
        print(f'Error executing the command: {str(e)}')
        return jsonify({'error': 'An error occurred while executing the command'}), 500


@app.route('/single', methods=['GET'])
def single():
    single_module = request.args.get('wanted', type=str)
    print("Single module name:", single_module)

    if os.path.isfile('static/netjson/' + single_module + '.json'):
        os.remove('static/netjson/' + single_module + '.json')
    pyNet4Inspect2ClassFunctionSingle.pyNet(single_module)
    return jsonify({'message': 'Tasks completed successfully'})


@app.route('/userPath', methods=['GET'])
def userPath():
    user_path = request.args.get('new_path', type=str)
    print("user_path:", user_path)

    if os.path.isfile('pylibsNet.txt'):
        os.remove('pylibsNet.txt')
    try:
        print("Performs command line operations.")
        subprocess.run(user_path + 'pip3 list >>pylibsNet.txt', shell=True, check=True)
    except subprocess.CalledProcessError as e:
        return jsonify({'error': f'Error running pip3 list: {str(e)}'}), 500

    if os.path.isfile('pylibsNet.txt'):
        try:
            shutil.rmtree('static/netjson')
            os.makedirs('static/netjson')
            print(f"Folder static/netjson successfully cleared.")
        except Exception as e:
            print(f"An error occurred while emptying the folder：{e}")

        pylibsNet.pylibs(user_path)
        pyNet4Inspect2ClassFunctionAll.pyNetAll(user_path)
        # try:
        #     subprocess.run(["python", "extract/pyNet4Inspect2ClassFunctionAll.py", "--path", user_path])
        # except Exception as e:
        #     return jsonify({'error': f'Error executing pyNet4Inspect2ClassFunctionAll.py: {str(e)}'}), 500

    return jsonify({'message': 'Tasks completed successfully'})


if "__main__" == __name__:  # 程序入口
    app.run(port=5006)
