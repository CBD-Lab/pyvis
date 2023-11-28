# 根据jupyter代码尝试接入后端
import os
import subprocess
# import networkx as nx
# import matplotlib.pyplot as plt
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


def run_pyreverse(output_path):
    # 切换到指定路径
    # os.chdir(output_path)
    # 执行 pyreverse 命令生成 .dot 文件
    subprocess.run(["pyreverse", '-Smy', "-o", "dot", output_path, "."], check=True)


def parse_dot_file(dot_file_path):
    # 创建一个有向图
    # graph = nx.DiGraph()

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

                # 添加边到图中
                # graph.add_edge(source, target)

    # 将字符串classes和nodes同时排序，因为索引是通过classes进行的
    sorted_classes = sorted(classes)
    sorted_nodes = sorted(nodes, key=lambda x: x['name'])

    # 生成link
    for item in links:
        item['source'] = sorted_classes.index(item['source'])
        item['target'] = sorted_classes.index(item['target'])

    classesjson['nodes'] = sorted_nodes
    classesjson['links'] = links  # pillow  -> Pillow   Flask -> flask

    # # 生产json
    # f = open('../flaskclass.json', 'w')
    # f.write(json.dumps(classesjson))
    # f.close()

    # return graph


# def visualize_graph(graph):
#     # 使用 Matplotlib 绘制图形
#     pos = nx.circular_layout(graph)  # 选择布局算法
#
#     # 设置图的大小
#     plt.figure(figsize=(15, 12))
#
#     nx.draw(graph, pos, with_labels=True, font_weight='bold', node_color='skyblue', arrowsize=15, node_size=500)
#     plt.show()


def getPyreverseClass(path, moduleName):
    target_directory = path + "\\" + moduleName  # 将目标目录替换为你的目录路径
    run_pyreverse(target_directory)  # 切换到指定路径并生成 .dot 文件

    dot_file_path = "classes.dot"  # 拼接 .dot 文件路径
    parse_dot_file(dot_file_path)
    # class_graph = parse_dot_file(dot_file_path)

    # 输出图的邻接列表
    #     print("Graph Adjacency List:")
    #     print(class_graph.adjacency())

    # 可视化图
    # visualize_graph(class_graph)

    print("classjson", classesjson)

    f = open('static/netjson/' + moduleName + 'class.json', 'w')
    f.write(json.dumps(classesjson))
    f.close()

# def readpackages():
#     packages = []
#     i = 0
#     with open('pylibsNet.txt', 'r', encoding='utf-8') as f:
#         line = f.readline()
#         while line:
#             packages.append(line.split(" ")[0].replace(".py", "").lower())
#             line = f.readline()
#             i = i + 1
#         print("i", i)
#     return packages[2:]
#
#
# def getPyreverseClassAll(path):
#     path = path[:-8] + 'Lib\site-packages'
#     packages_name = readpackages()
#     for package_name in packages_name:
#         init()
#         initpname = package_name
#         print("package_name: ", package_name)
#         try:
#             if importlib.util.find_spec(package_name):
#                 netjson(package_name, initpname)
#                 f = open('static/netjson_tmp/' + package_name + '.json', 'w')
#                 f.write(json.dumps(mnetjson))
#                 f.close()
#         except Exception as e:
#             print(f"Error in package {package_name}: {e}. Skipping...")
