import json


def requires(libname, path):
    import os
    import subprocess
    try:
        temp_output_file = "static/netjson_tmp/temp_output.txt"
        command = [path + 'pip3', 'show', libname]
        subprocess.run(command, stdout=open(temp_output_file, 'w', encoding='utf-8'), stderr=subprocess.PIPE,
                       check=True)
        with open(temp_output_file, 'r', encoding='utf-8') as f:
            output = f.read()
        os.remove(temp_output_file)

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


def nodes(pylibsNet):
    for n in pylibsNet:
        d = {"name": ""}
        d['name'] = n
        nodejson.append(d)
    netjson['nodes'] = nodejson
    return len(nodejson)


def edges(pylibsNet, path):
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
    packages = []
    i = 0
    with open('pylibsNet.txt', 'r', encoding='utf-8') as f:
        line = f.readline()
        while line:
            packages.append(line.split(" ")[0].replace(".py", ""))
            line = f.readline()
            i = i + 1
        print("i", i)
    return packages[2:]


def pylibs(path):
    global netjson, nodejson, edgejson, e
    netjson = {"links": "", "nodes": ""}
    nodejson = []
    edgejson = []
    e = {"source": -1, "target": -1}

    pylibsNet = readpylibsNet()
    print("pylibsNet: ", pylibsNet)
    edges(pylibsNet, path)
    nodes(pylibsNet)
    f = open('static/netjson_tmp/pylibsNet.json', 'w', encoding='utf-8')
    f.write(json.dumps(netjson))
    f.close()
