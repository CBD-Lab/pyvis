import importlib
import inspect
import os
import pathlib
import json
import builtins
from . import basicFunction


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
                    modulepath = modulepath[len(pathGV):len(modulepath)]
                    modulepath = modulepath.replace('/', '.')
                    # import_statement = "import " + modulepath
                    # exec(import_statement)
                    # print(modulepath) #torch.nn.modules.transformer
                    try:
                        inclass, inclasspath, _ = basicFunction.in_out_classes_bymodulename4path(eval(modulepath))
                        for c in inclass:
                            exec("from " + modulepath + " import " + c)
                            methods, attributes = basicFunction.get_class_method_attr(eval(c))
                            # parent = eval(c).__bases__[0].__name__
                            parent = eval(inclasspath[inclass.index(c)]).__bases__
                            if (len(parent)) > 1:
                                parentname = ""
                                for p in parent:
                                    parentname = parentname + p.__module__ + "." + p.__name__ + "|"
                                parentname = parentname[0:-2]
                            else:
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


def getClassNet(pname):
    global pathGV
    init()
    if '.' in pname:
        pname = pname.split('.', 1)[0]
    path = basicFunction.get_path(pname)
    print("------------------------------------getpath--------------------------",path)
    pathGV = path[:-len(pname)]
    myclasses = get_classes(path, pname)
    links = get_links(myclasses, nodes)

    classesjson['nodes'] = nodes
    classesjson['links'] = links
    f = open('static/netjson/' + pname + 'class.json', 'w')
    f.write(json.dumps(classesjson))
    f.close()


def getClassNetAll():
    global pathGV
    packages_name = basicFunction.readPackages()
    for package_name in packages_name:
        init()
        pname = package_name
        try:
            path = basicFunction.get_path(pname)
            pathGV = path[:-len(pname)]
            get_classes(path, pname)
            get_links(myclasses, nodes)

            classesjson['nodes'] = nodes
            classesjson['links'] = links
            f = open('static/netjson_tmp/' + pname + 'class.json', 'w')
            f.write(json.dumps(classesjson))
            f.close()
        except Exception as e:
            print(f"Error in package {package_name}: {e}. Skipping...")
