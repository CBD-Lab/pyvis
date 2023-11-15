import os
import pathlib
import json
from extract import basicFunction


def get_classes(path, pname):
    exec("import " + pname)
    print(path)
    lsdir = os.listdir(path)
    for f in lsdir:
        if (f != '__pycache__') and (f != 'test') and (f != 'testing'):
            if os.path.isfile(os.path.join(path, f)):
                if (pathlib.Path(f).suffix == ".py") and (not f.startswith("_") or f.startswith("__")):
                    modulepath = os.path.splitext(os.path.join(path, f))[0]
                    modulepath = modulepath[modulepath.find(r"site-packages") + 14:len(modulepath)]
                    modulepath = modulepath.replace('\\', '.')
                    # import_statement = "import " + modulepath
                    # exec(import_statement)
                    # print(modulepath) #torch.nn.modules.transformer
                    try:
                        inclass, _ = basicFunction.in_out_classes_bymodulename(eval(modulepath))

                        for c in inclass:
                            exec("from" + " " + modulepath + " " + "import" + " " + c)
                            methods, attributes = basicFunction.get_class_method_attr(eval(c))
                            parent = eval(c).__bases__[0].__name__
                            instantiateOtherClasses = basicFunction.InstantiateOtherClasses(eval(c))
                            tmpclass = {"name": c, "myparent": parent, "methods": methods, "attributes": attributes,"otherclasseslink":instantiateOtherClasses}
                            myclasses.append(c)
                            nodes.append(tmpclass)
                            # print(classes)
                    except:
                        pass
    dirs = [i for i in lsdir if os.path.isdir(os.path.join(path, i))]
    if dirs:
        for i in dirs:
            get_classes(os.path.join(path, i), pname)


def get_links(myclasses, nodes):
    for node in nodes:
        myparent = node['myparent']
        myname = node['name']
        if str(myparent) in myclasses:
            links.append({'source': myclasses.index(str(myparent)), 'target': myclasses.index(myname)})


def getClassNet(path, pname):
    global myclasses, nodes, links, classesjson, methods, attributes
    myclasses = []
    nodes = []
    links = []
    classesjson = {'nodes': '', 'links': ''}

    path = os.path.join(path, pname)
    get_classes(path, pname)
    get_links(myclasses, nodes)

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
            packages.append(line.split(" ")[0].lower().split("-")[0])
            line = f.readline()
            i = i + 1
        print("i", i)
    print("pylibsNet before", packages)
    return packages[2:]


def getClassNetAll(path):
    global myclasses, nodes, links, classesjson, methods, attributes
    myclasses = []
    nodes = []
    links = []
    classesjson = {'nodes': '', 'links': ''}

    path = path[:-8] + 'Lib\site-packages'
    package_names = []
    package_names = readpackages()
    print("package_names", package_names)
    for package_name in package_names:
        filename = package_name.replace(".py", "")
        pname = filename
        print("filename:", filename)
        try:
            folder_path = os.path.join(path, pname)
            get_classes(folder_path, pname)
            get_links(myclasses, nodes)

            classesjson['nodes'] = nodes
            classesjson['links'] = links
            f = open('static/netjson/' + pname + 'class.json', 'w')
            f.write(json.dumps(classesjson))
            f.close()
        except Exception as e:
            print(f"Error in package {filename}: {e}. Skipping...")