# !/usr/bin/env python
# coding: utf-8
# 变量没有清空，需要重新开始，否则容易重复写入pylibsNet
# 先执行pip3 list >>pylibsNet.txt   所有的第三方包的名称和版本，再对每一个包提取它的require和required
# 将生成的pylibsNet.txt存到项目根目录，即PyVisVUE3
# 继续执行pyNet4Inspect2ClassFunction2023.py

import json


netjson = {"links": "", "nodes": ""}
nodejson = []
edgejson = []
pylibsNet = []

e = {"source": -1, "target": -1}


def requires(libname, path):
    import os
    import subprocess
    try:
        temp_output_file = "static/netjson/temp_output.txt"
        # command = [r'D:\Anaconda\Anaconda3\Scripts\pip3', 'show', libname]
        command = [path + 'pip3', 'show', libname]
        subprocess.run(command, stdout=open(temp_output_file, 'w', encoding='utf-8'), stderr=subprocess.PIPE,
                       check=True)
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


# 节点
def nodes(pylibsNet):
    for n in pylibsNet:
        d = {"name": ""}
        d['name'] = n
        # print(d)
        nodejson.append(d)
        # print(nodejson)
    netjson['nodes'] = nodejson
    return len(nodejson)


# 边的关系
def edges(pylibsNet, path):
    # print("edges pylibsNet", pylibsNet)
    for n in pylibsNet:
        print('--------------------------------------------')
        print(n)
        requirelist, requiredlist = requires(n, path)

        print("requirelist", requirelist)
        print("requiredlist", requiredlist)

        i = 0
        if not (len(requirelist) == 1 and requirelist[0] == ''):
            for eg in requirelist:
                test = e.copy()
                test['source'] = (pylibsNet.index(n))
                if not (eg in pylibsNet):
                    pylibsNet.append(eg)
                test['target'] = (pylibsNet.index(eg))
                edgejson.append(test)
                i = i + 1
            netjson['links'] = edgejson
    return len(edgejson)


def readpylibsNet():
    filename = 'pylibsNet.txt'
    i = 0
    with open(filename, 'r', encoding='utf-8') as f:
        line = f.readline()
        while line:
            # print("line", line)
            pylibsNet.append(line.split(" ")[0])
            line = f.readline()
            i = i + 1
        print("i", i)
    print("pylibsNet before", pylibsNet)
    return pylibsNet[2:]


def pylibs(path):
    # 写入 Json 文件
    f = open('static/netjson/pylibsNet.json', 'w', encoding='utf-8')
    pylibsNet = readpylibsNet()
    print("pylibsNet after", pylibsNet)
    edges(pylibsNet, path)
    nodes(pylibsNet)
    f.write(json.dumps(netjson))
    f.close()
