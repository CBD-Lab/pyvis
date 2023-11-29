import importlib
import inspect
import ast
import urllib

import numpy
from types import *
from inspect import isclass

from flask import jsonify


def get_functions(wanted):
    try:
        funcs = inspect.getmembers(wanted, inspect.isfunction)
        infuncs = []
        outfuncs = []
        for m in funcs:
            if (m[1].__module__ == wanted.__name__):
                infuncs.append(m[1].__name__)
            else:
                outfuncs.append(m[1].__name__)
            # print(m)
    except:
        print(wanted.__name__ + " may not be iterable!")
        infuncs = []
        outfuncs = []
    return infuncs, outfuncs


# print(get_functions(torch.nn.modules.transformer))会直接得到__init__.py里的函数


def in_out_classes_bymodulename(wanted):
    try:
        mos = inspect.getmembers(wanted, inspect.isclass)
        inclasses = []
        outclasses = []
        for m in mos:
            if (m[1].__module__ == wanted.__name__):
                # inclasses.append(m[1].__module__+'.'+m[0])
                inclasses.append(m[0])
            else:
                outclasses.append(m[1].__module__ + '.' + m[0])
    except:
        print(wanted.__name__ + " may not be iterable!")
        inclasses = []
        outclasses = []
    return inclasses, outclasses


def in_out_classes_bymodulename4path(wanted):
    try:
        mos = inspect.getmembers(wanted, inspect.isclass)
        inclasses = []
        inclassespath = []
        outclasses = []
        for m in mos:
            if (m[1].__module__ == wanted.__name__):
                inclassespath.append(m[1].__module__ + '.' + m[0])
                inclasses.append(m[0])
            else:
                outclasses.append(m[1].__module__ + '.' + m[0])
    except:
        print(wanted.__name__ + " may not be iterable!")
        inclasses = []
        inclassespath = []
        outclasses = []
    return inclasses, inclassespath, outclasses


def in_out_classes_bymodulename_new(class_object, wanted):
    pdfClass = {}
    gitClass = {}
    try:
        # class_object = importlib.import_module(wanted)
        jsonfile = inspect.getmembers(class_object, inspect.isclass)
        classIn = []
        classOut = []
        for item in jsonfile:
            class_str = str(item[1])

            start_index = class_str.find("'") + 1  # 找到第一个单引号的位置
            end_index = class_str.rfind("'")  # 找到最后一个单引号的位置
            class_name_all = class_str[start_index:end_index]
            print(class_str, class_name_all, wanted, type(class_name_all), type(wanted))
            if (class_name_all.startswith(wanted)):
                classIn.append(class_name_all)
                class_name = class_name_all.rsplit('.', 1)[1]
                module_name = class_name_all.rsplit('.', 1)[0]
                module = importlib.import_module(module_name)
                class_obj = getattr(module, class_name)
                docs, pdf, git = get_class_pdf(class_obj, class_name_all)
                if (pdf != []):
                    pdfClass.update(pdf)
                if (git != []):
                    gitClass.update(git)
            else:
                classOut.append(class_name_all)
        return pdfClass, gitClass, classIn, classOut
    except Exception as e:
        print("error", e)
        return [], [], [], []


def get_class_method(wanted):
    attr = wanted.__dict__
    # print('attr',attr)
    cmethod = []
    for item in attr:
        # print(item)
        cmethod.append(item)
    return cmethod


# print(get_class_method(torch.nn.modules.transformer.Transformer)) 得到__init__.py内python的内置函数，import的包和模块，
# form .xxx的xxx,前面带'_'的参数，以及在同一级目录下的其他模块（包和py文件）


# get a class's pdf in docs
def get_class_pdf(class_obj, fullname):
    pdfurl = len("https://arxiv.org/abs/1810.04805")
    docs = ""
    classPdf = []
    pdfValue = {}
    gitValue = {}
    classGit = []
    if inspect.isclass(class_obj):
        docs = inspect.getdoc(class_obj)
        if docs:
            arxiv_index = docs.find("https://arxiv.org")
            git_index = docs.find("https://github.com")
            if arxiv_index != -1:
                pdf = docs[arxiv_index:arxiv_index + pdfurl]
                if (pdf != []):
                    pdfValue[fullname] = pdf
                    # classPdf.append(pdfValue)
            if git_index != -1:
                git_end_index1 = docs.find(")", git_index)
                git_end_index2 = docs.find(">", git_index)
                git_end_index3 = docs.find(" ", git_index)
                git_end_index = min(git_end_index3, git_end_index1, git_end_index2)
                if (git_end_index != -1):
                    git = docs[git_index:git_end_index]
                else:
                    git = docs[git_index:]
                if (git != ''):
                    gitValue[fullname] = git
                    # classGit.append(gitValue)
    return docs, pdfValue, gitValue


def get_class_method_attr(MyClass):
    # 获取类的属性和方法列表(包括类的继承层次结构中的属性和方法)
    #     class_attributes_and_methods = dir(MyClass)
    # 不包括
    class_attributes_and_methods = MyClass.__dict__
    # 使用列表推导式分开属性和方法
    attributes = [attr for attr in class_attributes_and_methods if not callable(getattr(MyClass, attr))]
    iscall = [method for method in class_attributes_and_methods if callable(getattr(MyClass, method))]
    methods = []
    for i in iscall:
        if inspect.ismethod(i):
            methods.append(i)
    return methods, attributes


def is_iterable(wanted):
    try:
        iter(wanted)
        return True
    except:
        return False


def InstantiateOtherClasses(wanted):  # basicFunction新增方法，输入是一个类，输出是这个类中有可能实例化的类
    import re
    print("--------------3--------------")
    print(wanted)
    packagename = wanted[0:wanted.find(".")]
    print(packagename)
    exec("import " + packagename)

    wanted = wanted[0:wanted.rfind(".")]
    exec("import " + wanted)
    pyname = wanted
    # exec("import " + eval(wanted))
    ain, bout = in_out_classes_bymodulename(eval(pyname))
    methods, _ = get_class_method_attr(eval(wanted))
    allin = ain + bout
    classeslink = []
    for i in methods:
        print("------------4--------------")
        print(pyname + '.' + i)
        doc = inspect.getsource(eval(pyname + '.' + i))
        for j in allin:
            pattern = r"\b" + j + "\("  # 正则表达式判断是否实例化其他类
            tmpbool = bool(re.search(pattern, doc))
            if tmpbool:
                classeslink.append(j)
    return classeslink
