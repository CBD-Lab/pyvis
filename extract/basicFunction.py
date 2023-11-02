import inspect
import ast
import numpy
from types import *
from inspect import isclass
import torch.nn
import torchvision
import torch.onnx

def get_modules(wanted):
    modules = inspect.getmembers(wanted, inspect.ismodule)
    mymodules=[]
    for m in modules:
        mymodules.append(m[1].__name__)
        #print(m)
    return mymodules

#print(get_modules(torch.nn.modules.transformer)) 得到py文件和包 ，多出来的有torch和os和warnings

def get_classes(wanted):
    classes = inspect.getmembers(wanted, inspect.isclass)
    myclasses=[]
    for m in classes:
        myclasses.append(m[1].__name__)
        #print(m)

    return myclasses

#print(get_classes(torch.nn.modules.transformer)) 也是init得到类

def get_classes_bydir(wanted):
    classes = [x for x in dir(wanted) if isclass(getattr(wanted, x))]
    return classes

#print(get_classes_bydir(torch.nn.modules.transformer)) 和上面的结果一样

def get_functions(wanted):##to do
    funcs = inspect.getmembers(wanted, inspect.isfunction)
    infuncs=[]
    outfuncs=[]
    for m in funcs:
        if(m[1].__module__ == wanted.__name__):
            infuncs.append(m[1].__name__)
        else:
            outfuncs.append(m[1].__name__)
        #print(m)
    return infuncs,outfuncs

#print(get_functions(torch.nn.modules.transformer))会直接得到__init__.py里的函数

def internal_classes(wanted):   #classes defined in this .py file
    try:
        src = inspect.getsource(wanted)
        p = ast.parse(src)
        classes = [node.name for node in ast.walk(p) if isinstance(node, ast.ClassDef)]
    except Exception as e:
        print("inspect.getsource error, maybe return null")
        classes = []
    return classes

#print(internal_classes(torch.nn.modules.transformer))直接输入包名跑为空

def in_out_classes_bymodulename(wanted):
    mos = inspect.getmembers(wanted, inspect.isclass)
    inclasses=[]
    outclasses=[]
    for m in mos:
        if(m[1].__module__ == wanted.__name__):
            inclasses.append(m[1].__module__)
        else:
            outclasses.append(m[1].__module__)
    return inclasses,outclasses
# ins,outs=in_out_classes_bymodulename(torch.nn.modules.transformer) inclass得到__module__名字和wanted一样的参数的__module__，outclass则是其他的
# print(ins)
# print("-------------")
# print(outs)


def get_class_method(wanted):
    attr=wanted.__dict__
    #print('attr',attr)
    cmethod=[]
    for item in attr:
        #print(item)
        cmethod.append(item)
    return cmethod

#print(get_class_method(torch.nn.modules.transformer.Transformer)) 得到__init__.py内python的内置函数，import的包和模块，form .xxx的xxx,前面带'_'的参数，以及在同一级目录下的其他模块（包和py文件）

def get_class_attributes(wanted):
    return [item for item in wanted.__dict__ if not callable(getattr(wanted, item)) and not item.startswith('__')]

#print(get_class_attributes(torch.nn.modules)) 还是有开头是'_'的item会被划进来，

if __name__ == "__main__":
    wanted = torchvision
    print('torchvision')
    print(get_modules(wanted))
    print(get_classes(wanted))
    print(get_classes_bydir(wanted))
    print(get_functions(wanted))
    print(internal_classes(wanted))
    print(in_out_classes_bymodulename(wanted))
    print(get_class_method(wanted))
    print(get_class_attributes(wanted))
    #print(get_modules(torch.nn.modules.transformer)) 得到py文件和包 和init导入的有torch和os和warnings
    #print(get_classes(torch.nn.modules.transformer)) 得到类 跑不通
    #print(get_classes_bydir(torch.nn.modules.transformer)) 跑不通
    #print(get_functions(torch.nn.modules.transformer))会直接得到__init__.py里的函数
    #print(internal_classes(torch.nn.modules.transformer))直接输入包名跑为空
    # ins,outs=in_out_classes_bymodulename(torch.nn.modules.transformer) 直接输入包跑不通，outclass得到modulefinder
    #print(get_class_method(torch.nn.modules.transformer.Transformer)) 得到__init__.py内python的内置函数，import的包和模块，form .xxx的xxx,前面带'_'的参数，以及在同一级目录下的其他模块（包和py文件）
    #print(get_class_attributes(torch.nn.modules)) 还是有开头是'_'的item会被划进来，

    wanted = torch.onnx
    print('torch.onnx')
    print(get_modules(wanted))
    print(get_classes(wanted))
    print(get_classes_bydir(wanted))
    print(get_functions(wanted))
    print(internal_classes(wanted))
    print(in_out_classes_bymodulename(wanted))
    print(get_class_method(wanted))
    print(get_class_attributes(wanted))
    #print(get_modules(torch.nn.modules.transformer)) 主要得到的是init里import的对象
    #print(get_classes(torch.nn.modules.transformer)) 也是init得到类
    #print(get_classes_bydir(torch.nn.modules.transformer)) 和上面的结果一样
    #print(get_functions(torch.nn.modules.transformer))会直接得到__init__.py里的函数 和import的函数
    #print(internal_classes(torch.nn.modules.transformer))直接输入包名跑为空
    #ins,outs=in_out_classes_bymodulename(torch.nn.modules.transformer) inclass得到__module__名字和wanted一样的参数的__module__，outclass则是其他的
    #print(get_class_method(torch.nn.modules.transformer.Transformer)) 得到__init__.py内python的内置函数，import的包和模块，form .xxx的xxx,前面带'_'的参数，init里的定义的函数，以及在同一级目录下的其他模块（包和py文件）
    #print(get_class_attributes(torch.nn.modules)) 还是有开头是'_'的item会被划进来，