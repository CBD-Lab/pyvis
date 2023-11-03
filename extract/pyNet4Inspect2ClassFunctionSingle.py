# 剔除了Open3D里的没有文件对应问题（Nodes）
# 剔除了NLTK里别名和重定向问题（Nodes）
import argparse
import inspect
# from . import basicFunction
import basicFunction
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
# import importlib
# ------------------do not delete the import above,using while runtime.----------------------------------
import flask
import torch
import networkx
import matplotlib
from matplotlib import pyplot

# 创建参数解析器
parser = argparse.ArgumentParser(description="My script")
# 添加参数定义
parser.add_argument("--module", type=str, help="single module name")
# 解析命令行参数
args = parser.parse_args()
# 访问参数值
filename = args.module

modules = []
mnetjson = {'nodes': '', 'links': ''}
nodes = []
links = []
myclass = ""
myfunction = ""

layer = 0


def get_modules(pname, initpname, layer):
    arg = eval(pname)
    if arg.__name__ == initpname:
        modules.append(arg.__name__)
        myclass = basicFunction.in_out_classes_bymodulename(eval(arg.__name__))
        classcount = len(myclass)

        myfunction = basicFunction.get_functions(eval(arg.__name__))
        functioncount = len(myfunction)
        if ("__file__" in dir(eval(arg.__name__))):
            nodes.append(
                {'name': arg.__name__, 'file': arg.__file__, 'ftype': '.py', 'layer': layer, 'hasclass': classcount,
                 'myclass': myclass, "hasfunction": functioncount, "myfunction": myfunction})
        else:
            nodes.append({'name': arg.__name__, 'file': 'none', 'ftype': 'none', 'layer': layer,
                          'hasclass': classcount, 'myclass': myclass, "hasfunction": functioncount,
                          "myfunction": myfunction})
    #     count=count+1

    layer = layer + 1
    mem = inspect.getmembers(eval(pname), inspect.ismodule)
    for m, m_info in mem:
        if (pname in m_info.__name__) and not (m_info.__name__ in modules):  # Filter calling external modules
            print(m_info)
            print(dir(eval(m_info.__name__)))
            print(eval(m_info.__name__).__file__)
            if ("__file__" in dir(eval(m_info.__name__)) and (eval(m_info.__name__).__file__ is not None)):
                if (pathlib.Path(eval(m_info.__name__).__file__).suffix == ".py"):
                    # print("1---.py=",m,m_info.__name__,m_info.__file__)
                    modules.append(m_info.__name__)

                    myclass = basicFunction.in_out_classes_bymodulename(eval(m_info.__name__))
                    classcount = len(myclass)

                    myfunction = basicFunction.get_functions(eval(m_info.__name__))
                    functioncount = len(myfunction)
                    nodes.append({'name': m_info.__name__, 'file': eval(m_info.__name__).__file__, 'layer': layer,
                                  'hasclass': classcount, 'myclass': myclass, "hasfunction": functioncount,
                                  "myfunction": myfunction})

                    # __import__(m_info.__name__)

                else:
                    # print("2---Not.py(.pyd,.pyi,.pyc)",m,m_info.__name__,m_info.__file__)
                    modules.append(m_info.__name__)
                    ex = os.path.splitext(m_info.__file__)[1]
                    # print(ex)
                    myclass = basicFunction.in_out_classes_bymodulename(eval(m_info.__name__))
                    classcount = len(myclass)

                    myfunction = basicFunction.get_functions(eval(m_info.__name__))
                    functioncount = len(myfunction)
                    nodes.append(
                        {'name': m_info.__name__, 'file': eval(m_info.__name__).__file__, 'ftype': ex, 'layer': layer,
                         'hasclass': classcount, 'myclass': myclass, "hasfunction": functioncount,
                         "myfunction": myfunction})

            else:
                # print("3---NoFile",m,m_info.__name__)
                modules.append(m_info.__name__)

                myclass = basicFunction.in_out_classes_bymodulename(eval(m_info.__name__))
                classcount = len(myclass)

                myfunction = basicFunction.get_functions(eval(m_info.__name__))
                functioncount = len(myfunction)
                nodes.append({'name': m_info.__name__, 'file': 'none', 'ftype': 'none', 'layer': layer,
                              'hasclass': classcount, 'myclass': myclass, "hasfunction": functioncount,
                              "myfunction": myfunction})
            if ("__file__" in dir(eval(m_info.__name__))):
                get_modules(m_info.__name__, initpname, layer)
    return modules


def get_links(mymodule, pname):
    i = 0
    for m in mymodule:
        nextmodules = []
        print(i, "=", m)
        i = i + 1
        try:  # torch.classes can not use inspect.getmembers(torch.classes)
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


def netjson(filename, initpname):
    # 递归搜索模块Module节点

    mymodule = get_modules(filename, initpname, layer)

    print(len(nodes))
    get_links(mymodule, initpname)

    mnetjson['nodes'] = nodes
    mnetjson['links'] = links
    # ------------------------ single test using the 153th line --------------------------
    # f = open('../static/netjson/'+filename+'.json', 'w')
    f = open('static/netjson/' + filename + '.json', 'w')
    f.write(json.dumps(mnetjson))
    f.close()


# #-------------------------------filename = '' is triggered in html page, if test in this .py use 162th line--------------------------------------------
# #path = r'D:\ProgramData\Anaconda3\Lib\site-packages'
# # path=r'H:\PyVisVue3D3V7\venv\Lib\site-packages'
# filename = 'networkx'
# initpname=filename
# from matplotlib import pyplot
# import_statement = "import " + filename
# print(import_statement)
# exec(import_statement)
#
# #__import__(filename)
# # #
# netjson(filename)


moduleName = filename
import_statement = "import " + moduleName
initpname = moduleName
print(import_statement)
exec(import_statement)
# __import__(moduleName)
# importlib.import_module(moduleName)
netjson(moduleName, initpname)
