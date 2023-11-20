import importlib
import inspect
import os
import json
import pathlib
import subprocess
import traceback
from distutils.log import Log

from . import basicFunction
import torch


def print_files(path, tree):
    child = []
    lsdir = os.listdir(path)

    for f in lsdir:
        if (f != '__pycache__') and (f != 'test') and (f != 'testing'):  # test and cache directory are filtered
            if os.path.isfile(os.path.join(path, f)):  # inspect file
                if (pathlib.Path(f).suffix == ".py") and (not f.startswith("_") or f.startswith("__")):
                    linkAll = {}
                    pdfModule = []
                    fileCount = 0
                    pdfClass = []
                    gitClass = []
                    classNameAll = ''
                    class_obj = None
                    fsize = os.path.getsize(os.path.join(path, f))  # file size
                    modulepath = os.path.splitext(os.path.join(path, f))[0]  # file path
                    modulepath = modulepath[modulepath.find(r"site-packages") + 14:len(modulepath)]
                    modulepath = modulepath.replace('\\', '.')
                    import_statement = "import " + modulepath
                    docs = ""
                    try:
                        class_name = modulepath.rsplit('.', 1)[1]
                        module_name = modulepath.rsplit('.', 1)[0]
                        module = importlib.import_module(module_name)
                        # class_obj = getattr(module, class_name)
                        # docs = inspect.getdoc(class_obj)
                        if hasattr(module, class_name):
                            class_obj = getattr(module, class_name)
                            docs = inspect.getdoc(class_obj)
                        else:
                            print(f" cannot find attribute {class_name} in module {module_name}")
                        if docs:
                            pdfurl = len("https://arxiv.org/abs/1810.04805")
                            arxiv_index = docs.find("https://arxiv.org")

                            if arxiv_index != -1:
                                pdf = docs[arxiv_index:arxiv_index + pdfurl]
                                pdfModule.append(pdf)
                        if (len(pdfModule) > 0):
                            linkAll["pdfModule"] = pdfModule
                            fileCount += len(pdfModule)
                        pdfClass, gitClass, myinclass, myoutclass = basicFunction.in_out_classes_bymodulename_new(
                            class_obj, modulepath)
                        # myinclass = []
                        # myoutclass = []
                        inclasscount = len(myinclass)
                        outclasscount = len(myoutclass)
                        if len(pdfClass) > 0:
                            linkAll["pdfClass"] = pdfClass
                            fileCount += len(pdfClass)
                        if len(gitClass) > 0:
                            linkAll["gitClass"] = gitClass
                            fileCount += len(gitClass)
                        myfunction = []
                        # myfunction = basicFunction.get_functions(modulepath)
                        functioncount = len(myfunction)
                        if (linkAll):
                            child.append({
                                "name": "" + f + "",
                                "value": fsize,
                                "linkAll": linkAll,
                                "fileCount": fileCount
                            })
                        else:
                            child.append({
                                "name": "" + f + "",
                                "value": fsize,
                                "fileCount": fileCount
                            })
                    except Exception as e:
                        traceback.print_exc()
                        fsize = os.path.getsize(os.path.join(path, f))
                        child.append({
                            "name": "" + f + "",
                            "value": fsize,
                        })
                else:
                    fsize = os.path.getsize(os.path.join(path, f))
                    child.append({"name": "" + f + "", "value": fsize})
            else:
                child.append({"name": "" + f + ""})  # is directory, not file

    tree['children'] = child

    dirs = [i for i in lsdir if os.path.isdir(os.path.join(path, i))]
    if dirs:
        for i in dirs:
            subtree = {"name": "", "children": ""}
            for t in tree['children']:
                if t['name'] == i:
                    subtree = t
            print_files(os.path.join(path, i), subtree)
    files = [i for i in lsdir if os.path.isfile(os.path.join(path, i))]
    for f in files:
        print(os.path.join(path, f))


def pyTree(path, moduleName):
    pytree = {"name": moduleName, "children": ""}
    exec("import " + moduleName)
    path = path + "\\" + moduleName
    print_files(path, pytree)
    f = open('static/treejson/' + moduleName + '.json', 'w')
    f.write(json.dumps(pytree))
    f.close()


def readpackages():
    packages = []
    i = 0
    with open('pylibsNet.txt', 'r', encoding='utf-8') as f:
        line = f.readline()
        while line:
            packages.append(line.split(" ")[0].replace(".py", "").lower())
            line = f.readline()
            i = i + 1
        print("i", i)
    return packages[2:]


def pyTreeAll(path):
    path = path[:-8] + 'Lib\site-packages'
    packages_name = readpackages()
    print("package_names", packages_name)
    for package_name in packages_name:
        moduleName = package_name
        print("package_name: ", package_name)
        try:
            pytree = {"name": moduleName, "children": ""}
            exec("import " + moduleName)
            folder_path = path + "\\" + moduleName
            print_files(folder_path, pytree)
            f = open('static/treejson_tmp/' + moduleName + '.json', 'w')
            f.write(json.dumps(pytree))
            f.close()
        except Exception as e:
            print(f"Error in package {package_name}: {e}. Skipping...")
