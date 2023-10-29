import inspect
import json
import importlib

modules = []
mnetjson = {'nodes': '', 'links': ''}
nodes = []
links = []
myclass = ""
myfunction = ""

layer = 0


def get_modules(arg, str, layer):
    try:
        if arg.__name__ == filename:
            modules.append(arg.__name__)
            # 获取当前模块中类和函数的信息
            hasclass = inspect.getmembers(arg, inspect.isclass)
            hasfunction = inspect.getmembers(arg, inspect.isfunction)
            print("\n-------Function-------")
            print("hasclass:", hasclass)
            print("hasfunction:", hasfunction)
            myclass = ""
            classcount = 0
            for h in hasclass:
                if h[1].__module__ == arg.__name__:
                    # myclass = myclass + h[1].__module__ + "." + h[1].__name__ + ";"
                    myclass = myclass + h[1].__name__ + ";"
                    classcount = classcount + 1;

            myfunction = ""
            functioncount = 0
            for f in hasfunction:
                if f[1].__module__ == arg.__name__:
                    myfunction = myfunction + f[1].__name__ + ";"
                    functioncount = functioncount + 1;
            nodes.append(
                {'name': arg.__name__, 'file': arg.__file__, 'layer': layer, 'hasclass': classcount, 'myclass': myclass,
                 'hasfunction': functioncount, 'myfunction': myfunction})
    except Exception as e:
        print(f"Error in module {filename}: {e}. Skipping...")

    # 获取当前模块中的子模块信息
    mmembers = inspect.getmembers(arg, inspect.ismodule)
    layer = layer + 1
    print("mmembers:", mmembers)
    print('--------------------------')
    for (name, moduleurl) in mmembers:
        try:
            # print("name=" + name)
            # print(moduleurl.__name__)
            if str in moduleurl.__name__ and not (moduleurl.__name__ in modules):
                modules.append(moduleurl.__name__)
                mname = arg.__name__ + "." + name
                # modules.append(mname)
                # print(modules)

                # print(mname)
                if ('__file__' in dir(eval(moduleurl.__name__))) or (
                        len(inspect.getmembers(arg, inspect.ismodule)) > 0):
                    # print(eval(mname).__file__)
                    hasclass = inspect.getmembers(eval(moduleurl.__name__), inspect.isclass)
                    hasfunction = inspect.getmembers(eval(moduleurl.__name__), inspect.isfunction)
                    # print(mname + "=---Function--------------")
                    # print(hasfunction)
                    myclass = ""
                    classcount = 0
                    for h in hasclass:
                        if h[1].__module__ == mname:
                            # myclass = myclass + h[1].__module__ + "." + h[1].__name__ + ";"
                            myclass = myclass + h[1].__name__ + ";"
                            classcount = classcount + 1;

                    myfunction = ""
                    functioncount = 0
                    for f in hasfunction:
                        if f[1].__module__ == mname:
                            myfunction = myfunction + f[1].__name__ + ";"
                            functioncount = functioncount + 1;
                    if ('__file__' in dir(eval(moduleurl.__name__))):
                        nodes.append(
                            {'name': moduleurl.__name__, 'file': eval(moduleurl.__name__).__file__, 'layer': layer,
                             'hasclass': classcount, 'myclass': myclass, "hasfunction": functioncount,
                             "myfunction": myfunction})
                    else:
                        nodes.append({'name': moduleurl.__name__, 'file': 'null', 'layer': layer,
                                      'hasclass': classcount, 'myclass': myclass, "hasfunction": functioncount,
                                      "myfunction": myfunction})
                    # print('\n-----------')
                    # print(mname)
                    get_modules(eval(moduleurl.__name__), filename, layer)
        except Exception as e:
            print(f"Error in module {moduleurl.__name__}: {e}. Skipping...")
    return modules


def get_links(mymodule, str):
    for m in mymodule:
        nextmodules = []
        print("m:", m)
        try:
            # 获取当前模块m中的子模块信息
            mm = inspect.getmembers(eval(m), inspect.ismodule)
            print("mm:", mm)
            print('--------------------------')
            for (name, moduleurl) in mm:
                if str in moduleurl.__name__:
                    nextmodules.append(moduleurl.__name__)
            for n in nextmodules:
                links.append({'source': mymodule.index(m), 'target': mymodule.index(n)})
        except Exception as e:
            print(f"Error in module {m}: {e}. Skipping...")
    print("links:", links)
    return links



def netjson(filename):
    # 递归搜索模块Module节点
    mymodule = get_modules(eval(filename), filename, layer)
    print("mymodule:", mymodule)
    print("----")
    print("len(nodes):", len(nodes))

    get_links(mymodule, filename)

    mnetjson['nodes'] = nodes
    mnetjson['links'] = links

    print("mnetjson:", mnetjson)
    print('-------End-------')

    f = open('../static/userjson/' + filename + '.json', 'w')
    f.write(json.dumps(mnetjson))
    f.close()


def readpackages():
    packages = []
    filename = '../pylibs2023.txt'
    i = 0
    with open(filename, 'r', encoding='utf-8') as f:
        line = f.readline()
        while line:
            # print("line", line)
            packages.append(line.split(" ")[0])
            line = f.readline()
            i = i + 1
        print("i", i)
    print("pylibs before", packages)
    return packages[2:]


# path = r'D:\Anaconda\Anaconda3\Lib\site-packages'
path = r'D:\python3.8.6\Lib\site-packages'
# filename = 'wordcloud'
# netjson(filename)

package_names = []
package_names = readpackages()
print("package_names", package_names)
for package_name in package_names:
    filename = package_name.replace(".py", "")
    print("filename:", filename)
    try:
        # 检查模块是否存在，如果存在则导入
        if importlib.util.find_spec(filename):
            import_statement = "import " + filename
            print(import_statement)
            exec(import_statement)
            netjson(filename)
    except Exception as e:
        print(f"Error in package {filename}: {e}. Skipping...")
