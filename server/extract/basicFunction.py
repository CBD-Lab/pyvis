import importlib
import inspect
import ast
import os
import urllib
import torch
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


# print(get_functions(torch.nn.modules.transformer)) will get the function in __init__.py directly.


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

            start_index = class_str.find("'") + 1  # Finding the location of the first single quote.
            end_index = class_str.rfind("'")  # Finding the position of the last single quote.
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


# print(get_class_method(torch.nn.modules.transformer.Transformer)) Get python's built-in functions in __init__.py, import's packages and modules.
# "form .xxx"'s xxx, Parameters preceded by '_' and other modules (packages and py files) in the same level directory.


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
    # Get the list of attributes and methods of a class (including attributes and methods in the class' inheritance hierarchy).
    #     class_attributes_and_methods = dir(MyClass)
    # exclusive of
    class_attributes_and_methods = MyClass.__dict__
    # Separating Properties and Methods Using List Derivatives.
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


# New methods in basicFunction. The input is a class and
# the output is a class that is potentially instantiated in this class.
def InstantiateOtherClasses(wanted):
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
            pattern = r"\b" + j + "\("  # Regular expression to determine if another class is instantiated.
            tmpbool = bool(re.search(pattern, doc))
            if tmpbool:
                classeslink.append(j)
    return classeslink


def readPackages():
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


def get_path(libname):
    libname = importlib.import_module(libname)
    module = inspect.getmodule(libname)
    if module:
        module_path = os.path.abspath(module.__file__)
        # For example, if libname is "matplotlib.pyplot"， the path to ".../matplotlib" will be retained.
        package_path = os.path.dirname(module_path)
        return package_path
    else:
        return None
    
def run_example(kdoc,code):
    try:
        code_str = "\n".join(code)
        code_str_with_imports = f"import torch\nimport torch.nn as nn\n{code_str}"
        code_str_with_imports
        namespace={}
        exec(code_str_with_imports, namespace)
        result = namespace.get('out', None)
        if isinstance(result, torch.Tensor):
            result = result.detach().cpu().numpy().tolist()
        return result
    except Exception as e:
        print("Error:", e)