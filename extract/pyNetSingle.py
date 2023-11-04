import argparse
import inspect
from . import basicFunction
import json
import pathlib
import os
import collections
import math
import builtins
import ctypes
import glob
import platform
import textwrap
import sys
import importlib
#------------------do not delete the import above,using while runtime.----------------------------------


modules = []
mnetjson = {'nodes': '', 'links': ''}
nodes = []
links = []
myclass = ""
myfunction = ""

layer = 0

def get_modules(pname,initpname,layer):
    __import__(pname)
    import_statement = "import " + pname
    print(import_statement)
    exec(import_statement)
    arg=eval(pname)
    if arg.__name__ ==initpname:
        modules.append(arg.__name__)
        myclass= basicFunction.in_out_classes_bymodulename(eval(arg.__name__))
        classcount=len(myclass)

        myfunction= basicFunction.get_functions(eval(arg.__name__))
        functioncount=len(myfunction)
        if("__file__" in dir(eval(arg.__name__)) and (eval(arg.__name__).__file__ is not None)):
            nodes.append({'name': arg.__name__, 'file': arg.__file__,'ftype':'.py','layer':layer,'hasclass':classcount,'myclass':myclass,"hasfunction":functioncount,"myfunction":myfunction})
        else:
            nodes.append({'name': arg.__name__, 'file': 'none', 'ftype':'none','layer': layer,
                                      'hasclass': classcount, 'myclass': myclass, "hasfunction": functioncount,
                                      "myfunction": myfunction})
#     count=count+1

    layer=layer+1
    mem=inspect.getmembers(eval(pname),inspect.ismodule)
    for m,m_info in mem:
        if (pname in m_info.__name__) and not(m_info.__name__ in modules):   #Filter calling external modules
            if("__file__" in dir(eval(m_info.__name__)) and (eval(m_info.__name__).__file__ is not None)):
                if(pathlib.Path(eval(m_info.__name__).__file__).suffix==".py"):
                    #print("1---.py=",m,m_info.__name__,m_info.__file__)
                    modules.append(m_info.__name__)

                    myclass = basicFunction.in_out_classes_bymodulename(eval(m_info.__name__))
                    classcount = len(myclass)

                    myfunction =basicFunction.get_functions(eval(m_info.__name__))
                    functioncount = len(myfunction)
                    nodes.append({'name': m_info.__name__, 'file': eval(m_info.__name__).__file__, 'layer': layer,
                                      'hasclass': classcount, 'myclass': myclass, "hasfunction": functioncount,
                                      "myfunction": myfunction})

                else:
                    #print("2---Not.py(.pyd,.pyi,.pyc)",m,m_info.__name__,m_info.__file__)
                    modules.append(m_info.__name__)
                    ex=os.path.splitext(m_info.__file__)[1]
                    #print(ex)
                    myclass = basicFunction.in_out_classes_bymodulename(eval(m_info.__name__))
                    classcount = len(myclass)

                    myfunction = basicFunction.get_functions(eval(m_info.__name__))
                    functioncount = len(myfunction)
                    nodes.append({'name': m_info.__name__, 'file': eval(m_info.__name__).__file__, 'ftype':ex,'layer': layer,
                                      'hasclass': classcount, 'myclass': myclass, "hasfunction": functioncount,
                                      "myfunction": myfunction})

            else:
                #print("3---NoFile",m,m_info.__name__)
                modules.append(m_info.__name__)

                myclass = basicFunction.in_out_classes_bymodulename(eval(m_info.__name__))
                classcount = len(myclass)

                myfunction = basicFunction.get_functions(eval(m_info.__name__))
                functioncount = len(myfunction)
                nodes.append({'name': m_info.__name__, 'file': 'none', 'ftype':'none','layer': layer,
                                  'hasclass': classcount, 'myclass': myclass, "hasfunction": functioncount,
                                  "myfunction": myfunction})
            if ("__file__" in dir(eval(m_info.__name__))):
                get_modules(m_info.__name__, initpname, layer)
    return modules


def get_links(mymodule,pname):

    i=0
    for m in mymodule:

        __import__(pname)
        import_statement = "import " + pname
        print(import_statement)
        exec(import_statement)

        nextmodules = []
        print(i,"=",m)
        i=i+1
        try:   #torch.classes can not use inspect.getmembers(torch.classes)
            mm = inspect.getmembers(eval(m), inspect.ismodule)

            for (name, moduleurl) in mm:
                if pname in moduleurl.__name__:
                    nextmodules.append(moduleurl.__name__)
            for n in nextmodules:
                # print("target=",n)
                if n in mymodule:
                    links.append({'source': mymodule.index(m), 'target': mymodule.index(n)})
        except:
            print("May inspect.getMembers(object) error, the object is not iterable, such as torch.classes")
    print(links)

    return links



def netjson(filename,initpname):

    mymodule = get_modules(filename,initpname,layer)

    print(len(nodes))
    get_links(mymodule,initpname)

    mnetjson['nodes'] = nodes
    mnetjson['links'] = links

    f = open('static/netjson/' + filename + '.json', 'w')
    f.write(json.dumps(mnetjson))
    f.close()


def pyNet(moduleName):
    import_statement = "import " + moduleName
    initpname = moduleName
    print(import_statement)
    exec(import_statement)
    __import__(moduleName)
    importlib.import_module(moduleName)
    netjson(moduleName,initpname)