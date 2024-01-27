import json


def process_data(node):
    if 'key' in node:
        node['name'] = node['key']
        del node['key']
    if 'package_name' in node:
        del node['package_name']
    if 'installed_version' in node:
        del node['installed_version']
    if 'required_version' in node:
        del node['required_version']
    if 'dependencies' in node:
        node['children'] = node['dependencies']
        del node['dependencies']
        for child in node['children']:
            process_data(child)


def main():
    with open('pipdeptree.json', 'r') as f:
        data = json.load(f)
    for item in data:
        process_data(item)

    root_data = {
        "name": "package",
        "children": data
    }
    with open('static/treejson_tmp/pylibsTree.json', 'w') as f:
        json.dump(root_data, f, indent=2)
