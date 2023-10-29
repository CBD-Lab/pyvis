# !/usr/bin/env python
# coding: utf-8
# 变量没有清空，需要重新开始，否则容易重复写入pylibs
# 先执行pip3 list >>pylibs2023.txt   所有的第三方包的名称和版本，再对每一个包提取它的require和required
# 将生成的pylibs2023.txt存到项目根目录，即PyVisVUE3
# 继续执行pyNet4Inspect2ClassFunction2023.py

import json
import argparse

# 创建参数解析器
parser = argparse.ArgumentParser(description="My script")
# 添加参数定义
parser.add_argument("--path", type=str, help="python path")
# 解析命令行参数
args = parser.parse_args()
# 访问参数值
python_path = args.path

netjson = {"links": "", "nodes": ""}
nodejson = []
edgejson = []
pylibs = []

e = {"source": -1, "target": -1}


def requires(libname):
    import os
    import subprocess
    try:
        temp_output_file = "temp_output.txt"
        # command = [r'D:\Anaconda\Anaconda3\Scripts\pip3', 'show', libname]
        command = [python_path + 'pip3', 'show', libname]
        subprocess.run(command, stdout=open(temp_output_file, 'w', encoding='utf-8'), stderr=subprocess.PIPE, check=True)
        # 从临时文件读取输出
        with open(temp_output_file, 'r', encoding='utf-8') as f:
            output = f.read()
        os.remove(temp_output_file)  # 删除临时文件

        relist = output.split('\n')
        requirelist = []
        requiredlist = []
        for line in relist:
            if line.startswith("Requires:"):
                requirelist = line[len("Requires: "):].strip().split(', ')
            elif line.startswith("Required-by:"):
                requiredlist = line[len("Required-by: "):].strip().split(', ')
        return requirelist, requiredlist
    except subprocess.CalledProcessError as e:
        print(f"Error: {e}")


def readpylibs():
    filename = 'pylibs2023.txt'
    i = 0
    with open(filename, 'r', encoding='utf-8') as f:
        line = f.readline()
        while line:
            # print("line", line)
            pylibs.append(line.split(" ")[0])
            line = f.readline()
            i = i + 1
        print("i", i)
    print("pylibs before", pylibs)
    # pylibs.pop()
    # pylibs = pylibs
    # print("pylibs after", pylibs)
    return pylibs[2:]


# 节点
def nodes(pylibs):
    for n in pylibs:
        d = {"name": ""}
        d['name'] = n
        # print(d)
        nodejson.append(d)
        # print(nodejson)
    netjson['nodes'] = nodejson
    return len(nodejson)


# 边的关系
def edges(pylibs):
    # print("edges pylibs", pylibs)
    for n in pylibs:
        print('--------------------------------------------')
        print(n)
        requirelist, requiredlist = requires(n)

        print("requirelist", requirelist)
        print("requiredlist", requiredlist)

        i = 0
        if not (len(requirelist) == 1 and requirelist[0] == ''):
            for eg in requirelist:
                test = e.copy()
                test['source'] = (pylibs.index(n))
                if not (eg in pylibs):
                    pylibs.append(eg)
                test['target'] = (pylibs.index(eg))
                edgejson.append(test)
                i = i + 1
            netjson['links'] = edgejson
    return len(edgejson)


# 写入 Json 文件
f = open('static/userjson/pylibs2023.json', 'w', encoding='utf-8')
netjson = {"links": "", "nodes": ""}
nodejson = []
edgejson = []
pylibs = []
pylibs = readpylibs()
print("ptlibs after", pylibs)
edges(pylibs)
nodes(pylibs)
f.write(json.dumps(netjson))
f.close()
