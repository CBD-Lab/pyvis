import importlib
import inspect
import os
import pathlib
import json
from extract import basicFunction
import builtins


def init():
    global myclasses, nodes, links, classesjson, methods, attributes
    myclasses = []
    nodes = []
    links = []
    classesjson = {'nodes': '', 'links': ''}


def get_classes(path, pname):
    exec("import " + pname)
    lsdir = os.listdir(path)
    print(lsdir[0:3])
    for f in lsdir:
        if (f != '__pycache__') and (f != 'test') and (f != 'testing'):
            if os.path.isfile(os.path.join(path, f)):
                if (pathlib.Path(f).suffix == ".py") and (not f.startswith("_") or f.startswith("__")):
                    modulepath = os.path.splitext(os.path.join(path, f))[0]
                    modulepath = modulepath[modulepath.find(r"site-packages") + 14:len(modulepath)]
                    modulepath = modulepath.replace('\\', '.')
                    print("-----------" + modulepath)
                    # import_statement = "import " + modulepath
                    # exec(import_statement)
                    # print(modulepath) #torch.nn.modules.transformer
                    try:
                        inclass, inclasspath, _ = basicFunction.in_out_classes_bymodulename4path(eval(modulepath))
                        print("---------2---------")
                        print(inclasspath)
                        for c in inclass:
                            exec("from" + " " + modulepath + " " + "import" + " " + c)
                            methods, attributes = basicFunction.get_class_method_attr(eval(c))
                            # parent = eval(c).__bases__[0].__name__
                            parent = eval(inclasspath[inclass.index(c)]).__bases__
                            if (len(parent)) > 1:
                                print(">1----------------------")
                                parentname = ""
                                for p in parent:
                                    parentname = parentname + p.__module__ + "." + p.__name__ + "|"
                                parentname = parentname[0:-2]
                            else:
                                print("=1  Parent Class is 1 ----------------------")
                                parentname = parent[0].__module__ + "." + parent[0].__name__
                            instantiateOtherClasses = basicFunction.InstantiateOtherClasses(
                                inclasspath[inclass.index(c)])
                            tmpclass = {"name": inclasspath[inclass.index(c)], "myparent": parentname,
                                        "methods": methods, "attributes": attributes,
                                        "otherclasseslink": instantiateOtherClasses}
                            myclasses.append(inclasspath[inclass.index(c)])
                            nodes.append(tmpclass)
                            # print(classes)
                    except Exception as error:
                        print(error)
    dirs = [i for i in lsdir if os.path.isdir(os.path.join(path, i))]
    if dirs:
        for i in dirs:
            get_classes(os.path.join(path, i), pname)

    return myclasses


def get_links(myclasses, nodes):
    print("----------myclasses------")
    print(myclasses)
    print("---------------nodes-------------")
    print(nodes)
    for node in nodes:
        myparent = node['myparent'].split("|")
        print(myparent)

        for p in myparent:
            print("-----p--------")
            print(p)
            if p != "":
                myname = node['name']
                if p in myclasses:
                    print("link")
                    links.append({'source': myclasses.index(myname), 'target': myclasses.index(p)})
                else:
                    myclasses.append(p)
                    nodes.append({"name": p, "myparent": ""})
                    links.append({'source': myclasses.index(myname), 'target': myclasses.index(p)})
    return links


def get_path(libname):
    libname = importlib.import_module(libname)
    module = inspect.getmodule(libname)
    if module:
        module_path = os.path.abspath(module.__file__)
        package_path = os.path.dirname(module_path)
        return package_path
    else:
        return None


def getClassNet(pname):
    init()
    path = get_path(pname)
    myclasses = get_classes(path, pname)
    print("-----5----")
    print(myclasses)
    links = get_links(myclasses, nodes)

    classesjson['nodes'] = nodes
    classesjson['links'] = links
    f = open('static/netjson/' + pname + 'class.json', 'w')
    f.write(json.dumps(classesjson))
    f.close()


def readpackages():
    packages = []
    filename = 'pylibsNet.txt'
    i = 0
    with open(filename, 'r', encoding='utf-8') as f:
        line = f.readline()
        while line:
            packages.append(line.split(" ")[0].replace(".py", "").lower())
            line = f.readline()
            i = i + 1
        print("i", i)
    print("pylibsNet before", packages)
    return packages[2:]


def getClassNetAll():
    packages_name = readpackages()
    print("packages_name: ", packages_name)
    for package_name in packages_name:
        init()
        pname = package_name
        print("package_name: ", package_name)
        try:
            path = get_path(pname)
            get_classes(path, pname)
            get_links(myclasses, nodes)

            classesjson['nodes'] = nodes
            classesjson['links'] = links
            f = open('static/netjson_tmp/' + pname + 'class.json', 'w')
            f.write(json.dumps(classesjson))
            f.close()
        except Exception as e:
            print(f"Error in package {package_name}: {e}. Skipping...")
