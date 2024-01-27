# -*- coding: utf-8 -*-
# pytorch mlp for binary classification
from numpy import vstack
from pandas import read_csv
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score
from torch import Tensor
from torch.optim import SGD
from torch.utils.data import Dataset, DataLoader, random_split
from torch.nn import Linear, ReLU, Sigmoid, Module, BCELoss,ModuleList
from torch.nn.init import kaiming_uniform_, xavier_uniform_


class CSVDataset(Dataset):
    def __init__(self, path):
        df = read_csv(path, header=None)
        self.X = df.values[:, :-1]
        self.y = df.values[:, -1]
        self.X = self.X.astype('float32')
        self.y = LabelEncoder().fit_transform(self.y)
        self.y = self.y.astype('float32')
        self.y = self.y.reshape((len(self.y), 1))

    def __len__(self):
        return len(self.X)

    def __getitem__(self, idx):
        return [self.X[idx], self.y[idx]]

    def get_splits(self, n_test=0.3):
        test_size = round(n_test * len(self.X))
        train_size = len(self.X) - test_size
        return random_split(self, [train_size, test_size])


class MLP(Module):
    def __init__(self, param):
        super(MLP, self).__init__()

        input_size = param[0]
        output_size = param[-1]
        num_hidden_layers = len(param) - 2
        self.hidden_layers = ModuleList([
            Linear(param[i], param[i + 1]) for i in range(num_hidden_layers)
        ])
        for layer in self.hidden_layers:
            kaiming_uniform_(layer.weight, nonlinearity='relu')
        self.activation_functions = ModuleList([
            ReLU() for _ in range(num_hidden_layers)
        ])
        self.output_layer = Linear(param[-2], output_size)
        xavier_uniform_(self.output_layer.weight)
        self.final_activation = Sigmoid()


        # print("param",type(param),param[0],param[1])
        # self.hidden1 = Linear(param[0], param[1])
        # kaiming_uniform_(self.hidden1.weight, nonlinearity='relu')
        # self.act1 = ReLU()
        # self.hidden2 = Linear(param[1], param[2])
        # kaiming_uniform_(self.hidden2.weight, nonlinearity='relu')
        # self.act2 = ReLU()
        # self.hidden3 = Linear(param[2], param[3])
        # xavier_uniform_(self.hidden3.weight)
        # self.act3 = Sigmoid()

    # def forward(self, X):
    #     X = self.hidden1(X)
    #     X = self.act1(X)
    #     X = self.hidden2(X)
    #     X = self.act2(X)
    #     X = self.hidden3(X)
    #     X = self.act3(X)
    #     return X

    def forward(self, x):
        for layer, activation in zip(self.hidden_layers, self.activation_functions):
            x = layer(x)
            x = activation(x)

        x = self.output_layer(x)
        x = self.final_activation(x)

        return x

def prepare_data(path):
    dataset = CSVDataset(path)
    train, test = dataset.get_splits()
    train_dl = DataLoader(train, batch_size=32, shuffle=True)
    test_dl = DataLoader(test, batch_size=1024, shuffle=False)
    return train_dl, test_dl


def train_model(train_dl, model):
    criterion = BCELoss()
    optimizer = SGD(model.parameters(), lr=0.01, momentum=0.9)
    for epoch in range(100):
        for i, (inputs, targets) in enumerate(train_dl):
            optimizer.zero_grad()
            yhat = model(inputs)
            loss = criterion(yhat, targets)
            loss.backward()
            # print("epoch: {}, batch: {}, loss: {}".format(epoch, i, loss.data))
            optimizer.step()


def evaluate_model(test_dl, model):
    predictions, actuals = [], []
    for i, (inputs, targets) in enumerate(test_dl):
        yhat = model(inputs)
        yhat = yhat.detach().numpy()
        actual = targets.numpy()
        actual = actual.reshape((len(actual), 1))
        yhat = yhat.round()
        predictions.append(yhat)
        actuals.append(actual)
    predictions, actuals = vstack(predictions), vstack(actuals)
    acc = accuracy_score(actuals, predictions)
    return acc


def predict(row, model):
    row = Tensor([row])
    yhat = model(row)
    yhat = yhat.detach().numpy()
    return yhat

def runModel(param):
    path = 'server/extract/data/iris.csv'
    train_dl, test_dl = prepare_data(path)
    model = MLP(param)
    # print(model.hidden1.weight.detach().numpy(),model.hidden1.bias.detach().numpy())
    train_model(train_dl, model)
    # acc = evaluate_model(test_dl, model)
    # print('Accuracy: %.3f' % acc)
    row = [1, 0, 0.99539, -0.05889, 0.85243, 0.02306, 0.83398, -0.37708, 1, 0.03760, 0.85243, -0.17755, 0.59755, -0.44945,
        0.60536, -0.38223, 0.84356, -0.38542, 0.58212, -0.32192, 0.56971, -0.29674, 0.36946, -0.47357, 0.56811, -0.51171,
        0.41078, -0.46168, 0.21266, -0.34090, 0.42267, -0.54487, 0.18641, -0.45300]
    # yhat = predict(row, model)
    # print('Predicted: %.3f (class=%d)' % (yhat, yhat.round()))
    hidden_layers_weights = [[layer.weight.data.numpy().tolist(),layer.bias.data.numpy().tolist()] for i, layer in
                          enumerate(model.hidden_layers)]
    output_layer_weight=[model.output_layer.weight.data.numpy().tolist(),model.output_layer.bias.data.numpy().tolist()]
    merge_layer_weight = hidden_layers_weights + [output_layer_weight]
    # merge_layer_weight=hidden_layers_weights.append(output_layer_weight)
    return merge_layer_weight
