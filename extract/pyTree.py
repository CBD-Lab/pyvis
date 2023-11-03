#!/usr/bin/env python
# coding: utf-8
#filter __pycache__


import os
import json
import pathlib
from . import basicFunction
import torch



def print_files(path,tree):
    child=[]
    lsdir = os.listdir(path)

    for f in lsdir:
        if (f!='__pycache__') and (f!='test')and (f!='testing'):  #test and cache directory are filtered
            if os.path.isfile(os.path.join(path, f)):  #inspect file
                if (pathlib.Path(f).suffix==".py") and (not f.startswith("_") or f.startswith("__")):
                    print(f)

                    fsize=os.path.getsize(os.path.join(path, f))   #file size
                    modulepath=os.path.splitext(os.path.join(path, f))[0]   #file path
                    modulepath=modulepath[modulepath.find(r"site-packages")+14:len(modulepath)]
                    modulepath=modulepath.replace('\\','.')
                    print("1-------"+modulepath)
                    import_statement = "import " + modulepath
                    print("------" + import_statement)
                    try:
                        #exec(import_statement)
                        myinclass=[]
                        myoutclass=[]
                        myinclass,myoutclass = basicFunction.in_out_classes_bymodulename(eval(modulepath))
                        inclasscount = len(myinclass)
                        outclasscount=len(myoutclass)

                        myfunction=[]
                        myfunction = basicFunction.get_functions(eval(modulepath))
                        functioncount = len(myfunction)

                        child.append({"name":""+f+"","value":fsize,"in_classes":myinclass,"out_classes":myoutclass,"in_function":myfunction})
                    except:
                        fsize = os.path.getsize(os.path.join(path, f))
                        child.append({"name": "" + f + "", "value": fsize})
                else:
                    fsize = os.path.getsize(os.path.join(path, f))
                    child.append({"name": "" + f + "", "value": fsize})
            else:
                child.append({"name": "" + f + ""})    # is directory, not file

    tree['children']=child

    dirs = [i for i in lsdir if os.path.isdir(os.path.join(path, i))]
    # print("---------------")
    # print(dirs)
    if dirs:
        for i in dirs:           
            subtree={"name":"","children":""}            

            for t in tree['children']:
                if t['name']==i:
                    print(t,t['name'])
                    subtree=t
            print_files(os.path.join(path, i),subtree)
    files = [i for i in lsdir if os.path.isfile(os.path.join(path,i))]
    for f in files:
        print(os.path.join(path, f))

#
# path=r'H:\PyVisVue3D3V7\venv\Lib\site-packages\flask'
# filename=path[path.rindex('\\')+1:len(path)]
#
# import_statement = "import " + filename
# print(import_statement)
# exec(import_statement)
#
# pytree={"name":filename,"children":""}
# print(path)
# print(pytree)
# print_files(path,pytree)
# #写入Json文件
# f = open('../static/treejson/'+filename+'.json', 'w')
# f.write(json.dumps(pytree))
# f.close()


def pyTree(path,moduleName):
    pytree = {"name": moduleName, "children": ""}
    import_statement = "import " + moduleName
    print(import_statement)
    exec(import_statement)
    path = path+"\\"+moduleName
    print_files(path, pytree)
    f = open('static/treejson/' + moduleName + '.json', 'w')
    f.write(json.dumps(pytree))
    f.close()