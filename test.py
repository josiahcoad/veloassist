import numpy as np


def compute_dist(X, Y):
    dists = (-2 * np.dot(X, Y.T)
             + np.sum(Y ** 2, axis=1)
             + np.sum(X ** 2, axis=1)[:, np.newaxis])
    return dists


X = np.array([
    [0, 1],
    [0, 1],
    [0, 1],
])
Y = np.array([
    [0, 2],
    [0, 3],
    [0, 4],
])


def latlng2xy(coords):
    lat, lng = coords.T
    R = 6371
    x = R*np.cos(lat)*np.cos(lng)
    y = R*np.cos(lat)*np.sin(lng)
    return np.array([x, y]).T


coords = np.array([
    [0, 0],
    [0, 0],
    [0, 0],
])

print(latlng2xy(coords))
