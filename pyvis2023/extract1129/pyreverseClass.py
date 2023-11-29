import importlib
import inspect
import os
import subprocess
import json

nodes = []
links = []
classes = []
classesjson = {'nodes': '', 'links': ''}


def get_class_method_attr(MyClass):
    # 获取类的属性和方法列表(包括类的继承层次结构中的属性和方法)
    #     class_attributes_and_methods = dir(MyClass)
    # 不包括
    class_attributes_and_methods = MyClass.__dict__
    # 使用列表推导式分开属性和方法
    attributes = [attr for attr in class_attributes_and_methods if
                  not callable(getattr(MyClass, attr)) and not attr.startswith('__')]
    methods = [method for method in class_attributes_and_methods if callable(getattr(MyClass, method))]
    return methods, attributes


def parse_dot_file(dot_file_path):
    with open(dot_file_path, "r") as dot_file:
        for line in dot_file:
            # 提取节点和边的信息
            if "->" in line:
                # 从边的定义中提取源节点和目标节点
                source, target = line.strip().split("->")
                source = source.strip('')
                target = target.strip('').split("[")[0].strip()  # 去掉可能存在的属性部分

                source = eval(source)
                target = eval(target)

                if source not in classes:
                    tmpnode = {"name": source, "myparent": '', "methods": [], "attributes": [], "otherclasseslink": []}
                    nodes.append(tmpnode)
                    classes.append(source)

                if target not in classes:
                    tmpnode = {"name": target, "myparent": '', "methods": [], "attributes": [], "otherclasseslink": []}
                    nodes.append(tmpnode)
                    classes.append(target)

                links.append({"source": source, "target": target})

    # 将字符串classes和nodes同时排序，因为索引是通过classes进行的
    sorted_classes = sorted(classes)
    sorted_nodes = sorted(nodes, key=lambda x: x['name'])

    # 生成link
    for item in links:
        item['source'] = sorted_classes.index(item['source'])
        item['target'] = sorted_classes.index(item['target'])

    classesjson['nodes'] = sorted_nodes
    classesjson['links'] = links


def get_path(libname):
    libname = importlib.import_module(libname)
    module = inspect.getmodule(libname)
    if module:
        module_path = os.path.abspath(module.__file__)
        package_path = os.path.dirname(module_path)
        return package_path
    else:
        return None


def getPyreverseClass(moduleName):
    target_dir = get_path(moduleName)
    # 生成packages.dot和classes.dot
    subprocess.run(["pyreverse", '-Smy', "-o", "dot", "-p", moduleName, target_dir, "-d", "static/dot"], check=True)
    dot_file_path = "static/dot/classes_" + moduleName + ".dot"  # 拼接 .dot 文件路径
    parse_dot_file(dot_file_path)

    f = open('static/netjson/' + moduleName + 'pyreverseclass.json', 'w')
    f.write(json.dumps(classesjson))
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


def getPyreverseClassAll():
    packages_name = readpackages()
    for package_name in packages_name:
        try:
            target_dir = get_path(package_name)
            subprocess.run(["pyreverse", '-Smy', "-o", "dot", "-p", package_name,
                            target_dir, "-d", "static/dot"], check=True)
            dot_file_path = "static/dot/classes_" + package_name + ".dot"
            parse_dot_file(dot_file_path)

            f = open('static/netjson_tmp/' + package_name + 'pyreverseclass.json', 'w')
            f.write(json.dumps(classesjson))
            f.close()
        except Exception as e:
            print(f"Error in package {package_name}: {e}. Skipping...")
