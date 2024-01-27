import json
import re
import subprocess
from . import basicFunction

infojson = {}


def parse_pip_show_output(output):
    result = {}
    for line in output.splitlines():
        match = re.match(r"([^:]+): (.+)$", line)
        if match:
            key, value = match.groups()
            modified_key = ''.join(word.capitalize() for word in key.split('-'))
            result[modified_key.strip()] = value.strip()
    return result


def showInfo(path):
    packages_name = basicFunction.readPackages()
    print("packages_name", packages_name)
    for package_name in packages_name:
        print("package_name：", package_name)
        try:
            command = [path + 'pip3', 'show', package_name]
            result = subprocess.check_output(command, text=True)
            package_info = parse_pip_show_output(result)
            infojson[package_name] = package_info
        except Exception as e:
            print(f"Error in package {package_name}: {e}. Skipping...")

    with open('pylibsInfo.json', 'w', encoding='utf-8') as f:
        json.dump(infojson, f, ensure_ascii=False, indent=4)
