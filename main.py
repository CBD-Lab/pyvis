import json
import os
import subprocess
import sys
import urllib.parse
import shutil
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import inspect
import importlib
from extract import basicFunction, pylibsNet, pyNet, pyClass, pylibsInfo, pyTree, pylibsTree

app = Flask(__name__)
CORS(app)


@app.route("/")
def netvis():
    return app.send_static_file("main.html")


@app.route("/module")
def module():
    wanted = request.args.get("wanted", type=str)
    if (wanted is None) or (wanted == "undefined") or (wanted == ""):
        wanted = 'pylibsNet'
    jsonfile = "netjson/" + wanted + ".json"
    return app.send_static_file(jsonfile)


@app.route("/treevis")
def treevis():
    wanted = request.args.get("wanted", type=str)
    if (wanted is None) or (wanted == "undefined") or (wanted == ""):
        wanted = 'nn'
    jsonfile = "treejson/" + wanted + ".json"
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
            start_index = class_str.find("'") + 1  # Finding the location of the first single quote
            end_index = class_str.rfind("'")  # Finding the position of the last single quote
            class_name_all = class_str[start_index:end_index]
            # print(len(wanted))
            if (class_name_all.startswith(wanted)):
                jsonstrinside.append(class_name_all)
            else:
                jsonstroutside.append(class_name_all)
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
        # Trying to import the module.
        module = __import__(module_name, fromlist=[''])
        # Getting the source code of the module.
        source_code = open(module.__file__, 'r').read()
        print(source_code)
    except ImportError as e:
        print(f"cannot load '{module_name}': {e}")
        source_code = f"Cannot load '{module_name}': {e}"
    except Exception as e:
        print(f"error happens: {e}")
        source_code = f"error happens: {e}"
    return source_code


@app.route("/classVariable", methods=["GET"])
def classVariable():
    my_class = request.args.get("wanted", type=str)
    varAll = []
    class_name = my_class.rsplit('.', 1)[1]
    module_name = my_class.rsplit('.', 1)[0]

    module = importlib.import_module(module_name)
    class_obj = getattr(module, class_name)

    class_variables = [attr for attr in dir(class_obj) if
                       not callable(getattr(class_obj, attr))]
    for var in class_variables:
        varAll.append(var)

    funcAll = basicFunction.get_class_method(class_obj)

    docs, pdf, git = basicFunction.get_class_pdf(class_obj, my_class)
    result = {
        "var": varAll,
        "fun": funcAll,
        "doc": docs,
        "pdf": pdf,
        'git': git
    }
    return jsonify(result)


@app.route("/moduletxt")
def moduletxt():
    wanted = request.args.get("wanted", type=str)
    if (wanted is None) or (wanted == "undefined") or (wanted == ""):
        wanted = 'inspect'
    wanted = wanted[0:wanted.find(".py")]
    wanted = "torch.nn.modules." + wanted
    exec("import " + wanted)

    print(wanted)
    # modulesrc = inspect.getsource(eval(wanted))
    modulesrc = open(eval(wanted).__file__).read()
    # return jsonify({"result": modulesrc})
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
        global python_path
        python_path = sys.executable
        python_path = python_path.strip()
        python_path = python_path[:-len("python.exe")] if python_path.endswith("python.exe") else python_path
        python_path = [python_path[:-len("Scripts\\")] if python_path.endswith("Scripts\\") else python_path]
        print("python_path：", python_path)
        result = {'result': python_path}
        return jsonify(result)
    except Exception as e:
        print(f'Error executing the command: {str(e)}')
        return jsonify({'error': 'An error occurred while executing the command'}), 500


# load certain package
@app.route('/single', methods=['GET'])
def single():
    single_module = request.args.get('wanted', type=str).lower()
    if (single_module is None) or (single_module == "undefined") or (single_module == ""):
        single_module = 'flask'
    pyNet.pyNet(single_module)
    pyTree.pyTree(single_module)
    pyClass.getClassNet(single_module)

    return jsonify({'message': 'Tasks completed successfully'})


# load all local module....
@app.route('/userPath', methods=['GET'])
def userPath():
    user_path = os.path.join(python_path[0], 'Scripts\\')

    if os.path.isfile('pylibsNet.txt'):
        os.remove('pylibsNet.txt')
    try:
        print("Performs command line operations.")
        subprocess.run(user_path + 'pip3 list >>pylibsNet.txt', shell=True, check=True)
    except subprocess.CalledProcessError as e:
        return jsonify({'error': f'Error running pip3 list: {str(e)}'}), 500

    if os.path.isfile('pylibsNet.txt'):
        try:
            if os.path.exists('static/netjson_tmp'):
                shutil.rmtree('static/netjson_tmp')
            os.makedirs('static/netjson_tmp', exist_ok=True)
            pylibsNet.pylibs(user_path)
            pyNet.pyNetAll()
            pyClass.getClassNetAll()
            shutil.rmtree('static/netjson')
            os.rename('static/netjson_tmp', 'static/netjson')
            pylibsInfo.showInfo(user_path)
            print(f"Folder static/netjson successfully updated.")
        except Exception as e:
            print(f"An error occurred while updating the folder：{e}")

    try:
        print("Performs command line operations.")
        subprocess.run(user_path + 'pipdeptree --json-tree > pipdeptree.json', shell=True, check=True)
    except subprocess.CalledProcessError as e:
        return jsonify({'error': f'Error running pipdeptree: {str(e)}'}), 500

    if os.path.isfile('pipdeptree.json'):
        try:
            if os.path.exists('static/treejson_tmp'):
                shutil.rmtree('static/treejson_tmp')
            os.makedirs('static/treejson_tmp', exist_ok=True)
            pylibsTree.main()
            pyTree.pyTreeAll()
            shutil.rmtree('static/treejson')
            os.rename('static/treejson_tmp', 'static/treejson')
            print(f"Folder static/treejson successfully updated.")
        except Exception as e:
            print(f"An error occurred while updating the folder：{e}")

    return jsonify({'message': 'Tasks completed successfully'})


# Add a new route to return SVG files
@app.route('/get_svg/<filename>')
def get_svg(filename):
    svg_directory = 'static/pic/'
    return send_from_directory(svg_directory, filename)


# Get information about the overall package
@app.route("/info", methods=["GET"])
def info():
    module_name = request.args.get("wanted", type=str)
    filedir = 'pylibsInfo.json'
    # print(send_from_directory(filedir))
    with open(filedir, 'rb') as f:
        load_json = json.load(f)
        module_info = load_json[module_name]
        print(module_info)
    return module_info


if "__main__" == __name__:  # program entrance
    app.run(port=5006, debug=True)
