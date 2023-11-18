import json
import re
import subprocess


def readpackages():
    filename = 'pylibsNet.txt'
    i = 0
    with open(filename, 'r', encoding='utf-8') as f:
        line = f.readline()
        while line:
            pylibsNet.append(line.split(" ")[0])
            line = f.readline()
            i = i + 1
        print("i", i)
    print("pylibsNet before", pylibsNet)
    return pylibsNet[2:]


def parse_pip_show_output(output):
    result = {}
    for line in output.splitlines():
        match = re.match(r"([^:]+): (.+)$", line)
        if match:
            key, value = match.groups()
            result[key.strip()] = value.strip()
    return result


def showInfo(path):
    global infojson, pylibsNet
    infojson = {}
    pylibsNet = []

    package_names = readpackages()
    print("package_names", package_names)

    for package_name in package_names:
        filename = package_name.replace(".py", "")
        print("package_name：", package_name)
        try:
            command = [path + 'pip3', 'show', filename]
            result = subprocess.check_output(command, text=True)
            package_info = parse_pip_show_output(result)
            infojson[filename] = package_info

        except Exception as e:
            print(f"Error in package {filename}: {e}. Skipping...")

    with open('pylibsInfo.json', 'w', encoding='utf-8') as f:
        json.dump(infojson, f, ensure_ascii=False, indent=4)

    return infojson
